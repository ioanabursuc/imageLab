package com.imagelab.ai.controller;

import com.imagelab.ai.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping(value = "/analyze", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> analyze(
            @RequestParam(required = false) Long imageId,
            @RequestParam(required = false) MultipartFile file,
            @RequestParam String userMessage,
            @RequestHeader("Authorization") String authHeader) {

        if (imageId == null && (file == null || file.isEmpty())) {
            return ResponseEntity.badRequest().body("Provide imageId or file.");
        }

        String result = aiService.analyze(imageId, file, userMessage, authHeader);
        return ResponseEntity.ok(result);
    }
}
