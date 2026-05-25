package com.imagelab.image.controller;

import com.imagelab.config.ResourceNotFoundException;
import com.imagelab.image.dto.ImageDto;
import com.imagelab.image.dto.UpdateImageRequest;
import com.imagelab.image.service.ImageService;
import com.imagelab.security.JwtPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageDto> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", required = false) String category,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        return ResponseEntity.ok(imageService.upload(file, category, user.getId()));
    }

    @GetMapping
    public ResponseEntity<List<ImageDto>> getUserImages(@AuthenticationPrincipal JwtPrincipal user) {
        return ResponseEntity.ok(imageService.getUserImages(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ImageDto> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        return ResponseEntity.ok(imageService.getById(id, user.getId()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ImageDto> updateImage(
            @PathVariable Long id,
            @Valid @RequestBody UpdateImageRequest request,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        return ResponseEntity.ok(imageService.updateCategory(id, request.getCategory(), user.getId()));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<UrlResource> getFile(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtPrincipal user
    ) throws MalformedURLException {
        return buildFileResponse(imageService.getImageFile(id, user.getId()));
    }

    @PostMapping(value = "/{id}/process", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageDto> saveProcessed(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        return ResponseEntity.ok(imageService.saveProcessed(id, file, user.getId()));
    }

    @GetMapping("/{id}/processed-file")
    public ResponseEntity<UrlResource> getProcessedFile(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtPrincipal user
    ) throws MalformedURLException {
        return buildFileResponse(imageService.getProcessedFile(id, user.getId()));
    }

    @DeleteMapping("/{id}/processed")
    public ResponseEntity<Void> deleteProcessed(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        imageService.deleteProcessed(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        imageService.deleteImage(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<UrlResource> buildFileResponse(Path filePath) throws MalformedURLException {
        UrlResource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("File not found on disk");
        }

        String fileName = filePath.getFileName().toString().toLowerCase();

        String contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
            contentType = MediaType.IMAGE_JPEG_VALUE;
        } else if (fileName.endsWith(".png")) {
            contentType = MediaType.IMAGE_PNG_VALUE;
        } else if (fileName.endsWith(".webp")) {
            contentType = "image/webp";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}