package com.imagelab.image.service;

import com.imagelab.config.ResourceNotFoundException;
import com.imagelab.image.dto.ImageDto;
import com.imagelab.image.entity.Image;
import com.imagelab.image.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    @Value("${upload.path:uploads}")
    private String uploadPath;

    private final ImageRepository imageRepository;

    public ImageDto upload(MultipartFile file, String category, Long userId) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPG, PNG, and WebP images are allowed");
        }

        String originalFileName = file.getOriginalFilename();
        String ext = getExtension(originalFileName);
        String storedFileName = UUID.randomUUID() + "." + ext;

        Path dir = Paths.get(uploadPath, String.valueOf(userId), "originals");

        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(storedFileName));
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }

        Image image = Image.builder()
                .originalFileName(originalFileName)
                .storedFileName(storedFileName)
                .uploadDate(LocalDateTime.now())
                .category(category != null && !category.isBlank() ? category.trim() : null)
                .userId(userId)
                .build();

        return ImageDto.from(imageRepository.save(image));
    }

    public List<ImageDto> getUserImages(Long userId) {
        return imageRepository.findByUserId(userId).stream()
                .map(ImageDto::from)
                .toList();
    }

    public ImageDto getById(Long id, Long userId) {
        Image image = imageRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found"));

        return ImageDto.from(image);
    }

    public ImageDto updateCategory(Long id, String category, Long userId) {
        Image image = imageRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found"));

        image.setCategory(category != null && !category.isBlank() ? category.trim() : null);

        return ImageDto.from(imageRepository.save(image));
    }

    public Path getImageFile(Long id, Long userId) {
        Image image = imageRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found"));

        return Paths.get(uploadPath, String.valueOf(userId), "originals", image.getStoredFileName());
    }

    public ImageDto saveProcessed(Long id, MultipartFile file, Long userId) {
        Image image = imageRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found"));

        Path processedDir = Paths.get(uploadPath, String.valueOf(userId), "processed");

        try {
            Files.createDirectories(processedDir);

            if (image.getProcessedFileName() != null) {
                Files.deleteIfExists(processedDir.resolve(image.getProcessedFileName()));
            }

            String storedName = UUID.randomUUID() + ".png";
            Files.copy(file.getInputStream(), processedDir.resolve(storedName));
            image.setProcessedFileName(storedName);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store processed file", e);
        }

        return ImageDto.from(imageRepository.save(image));
    }

    public Path getProcessedFile(Long id, Long userId) {
        Image image = imageRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found"));

        if (image.getProcessedFileName() == null) {
            throw new ResourceNotFoundException("No processed version found");
        }

        return Paths.get(uploadPath, String.valueOf(userId), "processed", image.getProcessedFileName());
    }

    public void deleteProcessed(Long id, Long userId) {
        Image image = imageRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found"));

        if (image.getProcessedFileName() == null) {
            return;
        }

        try {
            Files.deleteIfExists(
                    Paths.get(uploadPath, String.valueOf(userId), "processed", image.getProcessedFileName())
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete processed file", e);
        }

        image.setProcessedFileName(null);
        imageRepository.save(image);
    }

    public void deleteImage(Long id, Long userId) {
        Image image = imageRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found"));

        try {
            Files.deleteIfExists(
                    Paths.get(uploadPath, String.valueOf(userId), "originals", image.getStoredFileName())
            );

            if (image.getProcessedFileName() != null) {
                Files.deleteIfExists(
                        Paths.get(uploadPath, String.valueOf(userId), "processed", image.getProcessedFileName())
                );
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file", e);
        }

        imageRepository.delete(image);
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "bin";
        }

        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}