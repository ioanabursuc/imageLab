package com.imagelab.ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model}")
    private String geminiModel;

    @Value("${image.service.url}")
    private String imageServiceUrl;

    private final RestTemplate restTemplate;

    private static final String PROMPT_TEMPLATE =
            "You are an AI assistant inside ImageLab, an image editing application.\n\n" +
                    "Talk naturally with the user and help them decide what to do with their image.\n" +
                    "Recommend the tool, adjustment, or preset that best matches the user's request and that is available.\n" +
                    "Available tools: Seam Carving, Seam Carving with Protection Mask, Criminisi Inpainting, OpenCV Inpaint, Poisson Editing, Denoise, Detail Enhance, Histograms.\n" +
                    "Adjustments and ranges: brightness 0-200, contrast 0-200, saturation 0-200, grayscale 0-100, sepia 0-100, hue 0-360, blur 0-10, invert 0-100.\n" +
                    "Presets: Bright, Black & White, Vintage, Warm, Cold, High Contrast, plus custom user presets.\n\n" +
                    "User request: \"%s\"\n\n" +
                    "When mentioning a tool, adjustment, or preset, include its exact English name from the ImageLab interface.\n" +
                    "When useful, suggest concrete slider values within the available ranges.\n" +
                    "Do not invent unavailable features.\n" +
                    "Do not use Markdown, bold text, asterisks, bullet points, lists, or special formatting.\n" +
                    "Answer in the same language as the user request, in 1-2 short sentences.";

    public String analyze(
            Long imageId,
            MultipartFile file,
            String userMessage,
            String authHeader
    ) {
        ImagePayload imagePayload =
                getImagePayload(
                        imageId,
                        file,
                        authHeader
                );

        String base64Image =
                Base64.getEncoder()
                        .encodeToString(
                                imagePayload.bytes()
                        );

        String prompt =
                String.format(
                        PROMPT_TEMPLATE,
                        userMessage
                );

        return callGemini(
                prompt,
                base64Image,
                imagePayload.mimeType()
        );
    }

    private ImagePayload getImagePayload(
            Long imageId,
            MultipartFile file,
            String authHeader
    ) {
        if (file != null && !file.isEmpty()) {
            try {
                byte[] bytes = file.getBytes();

                String mimeType =
                        file.getContentType() != null
                                ? file.getContentType()
                                : detectMimeType(bytes);

                return new ImagePayload(
                        bytes,
                        normalizeImageMimeType(mimeType, bytes)
                );

            } catch (IOException e) {
                throw new RuntimeException(
                        "Failed to read uploaded file",
                        e
                );
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);

        try {
            ResponseEntity<byte[]> response =
                    restTemplate.exchange(
                            imageServiceUrl + "/images/" + imageId + "/file",
                            HttpMethod.GET,
                            new HttpEntity<>(headers),
                            byte[].class
                    );

            byte[] bytes =
                    Objects.requireNonNull(
                            response.getBody(),
                            "Image not found for id: " + imageId
                    );

            String mimeType =
                    detectMimeType(bytes);

            return new ImagePayload(
                    bytes,
                    mimeType
            );

        } catch (HttpClientErrorException e) {
            throw new RuntimeException(
                    "Could not retrieve image (status " + e.getStatusCode() + ")",
                    e
            );

        } catch (ResourceAccessException e) {
            throw new RuntimeException(
                    "Image service is unavailable",
                    e
            );
        }
    }

    @SuppressWarnings("unchecked")
    private String callGemini(
            String prompt,
            String base64Image,
            String mimeType
    ) {
        String url =
                "https://generativelanguage.googleapis.com/v1beta/models/"
                        + geminiModel
                        + ":generateContent?key="
                        + geminiApiKey;

        Map<String, Object> textPart =
                new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> inlineData =
                new HashMap<>();
        inlineData.put("mime_type", mimeType);
        inlineData.put("data", base64Image);

        Map<String, Object> imagePart =
                new HashMap<>();
        imagePart.put("inline_data", inlineData);

        Map<String, Object> content =
                new HashMap<>();
        content.put(
                "parts",
                List.of(
                        textPart,
                        imagePart
                )
        );

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.3);
        generationConfig.put("maxOutputTokens", 512);

        Map<String, Object> thinkingConfig = new HashMap<>();
        thinkingConfig.put("thinkingBudget", 0);
        generationConfig.put("thinkingConfig", thinkingConfig);

        Map<String, Object> body =
                new HashMap<>();
        body.put("contents", List.of(content));
        body.put("generationConfig", generationConfig);

        try {
            ResponseEntity<Map> response =
                    restTemplate.postForEntity(
                            url,
                            body,
                            Map.class
                    );

            Map<String, Object> responseBody =
                    Objects.requireNonNull(
                            response.getBody(),
                            "Empty response from Gemini"
                    );
            System.out.println(responseBody);

            return extractGeminiText(responseBody);

        } catch (HttpClientErrorException e) {
            throw new RuntimeException(
                    "Gemini API error: "
                            + e.getStatusCode()
                            + " - "
                            + e.getResponseBodyAsString(),
                    e
            );

        } catch (ResourceAccessException e) {
            throw new RuntimeException(
                    "Gemini API is unavailable",
                    e
            );
        }
    }

    @SuppressWarnings("unchecked")
    private String extractGeminiText(
            Map<String, Object> responseBody
    ) {
        List<Map<String, Object>> candidates =
                (List<Map<String, Object>>) responseBody.get("candidates");
        if (
                candidates == null ||
                        candidates.isEmpty()
        ) {
            return "I could not generate a recommendation for this image.";
        }

        Map<String, Object> firstCandidate =
                candidates.get(0);

        Map<String, Object> content =
                (Map<String, Object>) firstCandidate.get("content");

        if (content == null) {
            return "I could not read the AI response.";
        }

        List<Map<String, Object>> parts =
                (List<Map<String, Object>>) content.get("parts");

        if (
                parts == null ||
                        parts.isEmpty()
        ) {
            return "The AI did not return a text response.";
        }

        StringBuilder answer =
                new StringBuilder();

        for (Map<String, Object> part : parts) {
            Object text = part.get("text");

            if (text != null) {
                answer.append(text);
            }
        }

        String result =
                answer.toString().trim();

        if (result.isBlank()) {
            return "The AI did not return a text response.";
        }

        return result;
    }

    private String detectMimeType(byte[] bytes) {
        if (
                bytes.length >= 8 &&
                        (bytes[0] & 0xFF) == 0x89 &&
                        bytes[1] == 0x50 &&
                        bytes[2] == 0x4E &&
                        bytes[3] == 0x47
        ) {
            return "image/png";
        }

        if (
                bytes.length >= 3 &&
                        (bytes[0] & 0xFF) == 0xFF &&
                        (bytes[1] & 0xFF) == 0xD8 &&
                        (bytes[2] & 0xFF) == 0xFF
        ) {
            return "image/jpeg";
        }

        return "image/png";
    }

    private String normalizeImageMimeType(
            String mimeType,
            byte[] bytes
    ) {
        if (mimeType == null || mimeType.isBlank()) {
            return detectMimeType(bytes);
        }

        String normalized =
                mimeType.toLowerCase();

        if (
                normalized.equals("image/png") ||
                        normalized.equals("image/jpeg") ||
                        normalized.equals("image/jpg")
        ) {
            return normalized.equals("image/jpg")
                    ? "image/jpeg"
                    : normalized;
        }

        return detectMimeType(bytes);
    }

    private record ImagePayload(
            byte[] bytes,
            String mimeType
    ) {
    }
}