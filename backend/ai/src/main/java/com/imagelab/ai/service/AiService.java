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

    @Value("${ollama.url}")
    private String ollamaUrl;

    @Value("${ollama.model}")
    private String ollamaModel;

    @Value("${image.service.url}")
    private String imageServiceUrl;

    private final RestTemplate restTemplate;

    private static final String PROMPT_TEMPLATE =
            "The following algorithms are available in ImageLab:\n" +
            "1. image retargeting - useful for resizing an image while preserving important regions\n" +
            "2. Criminisi object removal / inpainting - useful for removing unwanted objects and filling the missing area\n" +
            "3. Poisson editing - useful for seamless cloning, blending, or inserting an object naturally into another image\n\n" +
            "Analyze the image and the user request: \"%s\"\n" +
            "Recommend the most suitable algorithm from the available algorithms.\n" +
            "Explain briefly why it is suitable.\n" +
            "If needed, mention what the user should select or mark in the image.\n" +
            "Answer in plain text only.";

    public String analyze(Long imageId, MultipartFile file, String userMessage, String authHeader) {
        byte[] imageBytes = getImageBytes(imageId, file, authHeader);
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        String prompt = String.format(PROMPT_TEMPLATE, userMessage);
        return callOllama(prompt, base64Image);
    }

    private byte[] getImageBytes(Long imageId, MultipartFile file, String authHeader) {
        if (file != null && !file.isEmpty()) {
            try {
                return file.getBytes();
            } catch (IOException e) {
                throw new RuntimeException("Failed to read uploaded file", e);
            }
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    imageServiceUrl + "/images/" + imageId + "/file",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    byte[].class
            );
            return Objects.requireNonNull(response.getBody(), "Image not found for id: " + imageId);
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Could not retrieve image (status " + e.getStatusCode() + ")", e);
        } catch (ResourceAccessException e) {
            throw new RuntimeException("Image service is unavailable", e);
        }
    }

    @SuppressWarnings("unchecked")
    private String callOllama(String prompt, String base64Image) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", ollamaModel);
        body.put("prompt", prompt);
        body.put("images", List.of(base64Image));
        body.put("stream", false);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                ollamaUrl + "/api/generate",
                body,
                Map.class
        );
        Map<String, Object> responseBody = Objects.requireNonNull(response.getBody());
        return (String) responseBody.get("response");
    }
}
