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
            "You are an AI assistant inside an image editing application called ImageLab.\n\n" +
                    "The following tools are available:\n" +
                    "1. Seam Carving - useful for resizing an image by removing rows or columns while preserving important content.\n" +
                    "2. Seam Carving with Protection Mask - useful for resizing while protecting user-marked regions.\n" +
                    "3. Criminisi Inpainting - useful for removing unwanted objects or areas and filling the missing region using surrounding texture.\n" +
                    "4. Poisson Editing - useful for seamless cloning, blending, or inserting an object naturally into another image.\n" +
                    "5. Adjustments - brightness, contrast and saturation.\n\n" +
                    "Analyze the image and the user request: \"%s\"\n\n" +
                    "Recommend the most suitable tool from the available tools.\n" +
                    "Explain briefly why it is suitable.\n" +
                    "If the user needs to draw a mask, clearly say what region should be marked.\n" +
                    "Answer in Romanian, in plain text only, concise and helpful.";

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

        Map<String, Object> generationConfig =
                new HashMap<>();
        generationConfig.put("temperature", 0.4);
        generationConfig.put("maxOutputTokens", 512);

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
            return "Nu am putut genera o recomandare pentru această imagine.";
        }

        Map<String, Object> firstCandidate =
                candidates.get(0);

        Map<String, Object> content =
                (Map<String, Object>) firstCandidate.get("content");

        if (content == null) {
            return "Nu am putut interpreta răspunsul de la Gemini.";
        }

        List<Map<String, Object>> parts =
                (List<Map<String, Object>>) content.get("parts");

        if (
                parts == null ||
                        parts.isEmpty()
        ) {
            return "Gemini nu a returnat un răspuns text.";
        }

        Object text =
                parts.get(0).get("text");

        if (text == null) {
            return "Gemini nu a returnat un răspuns text.";
        }

        return text.toString();
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