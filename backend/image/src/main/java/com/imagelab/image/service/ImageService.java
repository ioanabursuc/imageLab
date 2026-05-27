package com.imagelab.image.service;

import com.imagelab.config.ResourceNotFoundException;
import com.imagelab.image.dto.ImageDto;
import com.imagelab.image.entity.Image;
import com.imagelab.image.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
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
            "image/jpeg",
            "image/png"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    @Value("${upload.path}")
    private String uploadPath;

    private final ImageRepository imageRepository;
    private final OpenCvProcessorService openCvProcessorService;

    public ImageDto upload(MultipartFile file, String category, Long userId) {

        validateImageFile(file);

        String originalFileName = file.getOriginalFilename();

        String ext = getExtension(originalFileName);

        String storedFileName =
                UUID.randomUUID() + "." + ext;

        Path dir = Paths.get(
                uploadPath,
                String.valueOf(userId),
                "originals"
        );

        try {

            Files.createDirectories(dir);

            Files.copy(
                    file.getInputStream(),
                    dir.resolve(storedFileName)
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to store file",
                    e
            );
        }

        Image image = Image.builder()
                .originalFileName(originalFileName)
                .storedFileName(storedFileName)
                .uploadDate(LocalDateTime.now())
                .category(
                        category != null && !category.isBlank()
                                ? category.trim()
                                : null
                )
                .userId(userId)
                .build();

        return ImageDto.from(
                imageRepository.save(image)
        );
    }

    public List<ImageDto> getUserImages(Long userId) {

        return imageRepository.findByUserId(userId)
                .stream()
                .map(ImageDto::from)
                .toList();
    }

    public ImageDto getById(Long id, Long userId) {

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        return ImageDto.from(image);
    }

    public ImageDto updateCategory(
            Long id,
            String category,
            Long userId
    ) {

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        image.setCategory(
                category != null && !category.isBlank()
                        ? category.trim()
                        : null
        );

        return ImageDto.from(
                imageRepository.save(image)
        );
    }

    public Path getImageFile(Long id, Long userId) {

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        return Paths.get(
                uploadPath,
                String.valueOf(userId),
                "originals",
                image.getStoredFileName()
        );
    }

    public ImageDto saveProcessed(
            Long id,
            MultipartFile file,
            Long userId
    ) {

        validateImageFile(file);

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        Path processedDir = Paths.get(
                uploadPath,
                String.valueOf(userId),
                "processed"
        );

        try {

            Files.createDirectories(processedDir);

            if (image.getProcessedFileName() != null) {

                Files.deleteIfExists(
                        processedDir.resolve(
                                image.getProcessedFileName()
                        )
                );
            }

            String storedName =
                    UUID.randomUUID()
                            + "."
                            + getExtension(
                            file.getOriginalFilename()
                    );

            Files.copy(
                    file.getInputStream(),
                    processedDir.resolve(storedName)
            );

            image.setProcessedFileName(storedName);

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to store processed file",
                    e
            );
        }

        return ImageDto.from(
                imageRepository.save(image)
        );
    }

    public Path getProcessedFile(Long id, Long userId) {

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        if (image.getProcessedFileName() == null) {

            throw new ResourceNotFoundException(
                    "No processed version found"
            );
        }

        return Paths.get(
                uploadPath,
                String.valueOf(userId),
                "processed",
                image.getProcessedFileName()
        );
    }

    public void deleteProcessed(Long id, Long userId) {

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        if (image.getProcessedFileName() == null) {
            return;
        }

        try {

            Files.deleteIfExists(
                    Paths.get(
                            uploadPath,
                            String.valueOf(userId),
                            "processed",
                            image.getProcessedFileName()
                    )
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to delete processed file",
                    e
            );
        }

        image.setProcessedFileName(null);

        imageRepository.save(image);
    }

    public ImageDto processWithOpenCv(
            Long id,
            String algorithm,
            Integer removeCols,
            Integer removeRows,
            Long userId
    ) {

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        if (algorithm == null || algorithm.isBlank()) {

            throw new IllegalArgumentException(
                    "Algorithm is required"
            );
        }

        String normalizedAlgorithm =
                algorithm.trim().toLowerCase();

        Path originalPath;

        if (image.getProcessedFileName() != null) {

            originalPath = Paths.get(
                    uploadPath,
                    String.valueOf(userId),
                    "processed",
                    image.getProcessedFileName()
            );

        } else {

            originalPath = Paths.get(
                    uploadPath,
                    String.valueOf(userId),
                    "originals",
                    image.getStoredFileName()
            );
        }

        Path processedDir = Paths.get(
                uploadPath,
                String.valueOf(userId),
                "processed"
        );

        try {

            Files.createDirectories(processedDir);

            if (image.getProcessedFileName() != null) {

                Files.deleteIfExists(
                        processedDir.resolve(
                                image.getProcessedFileName()
                        )
                );
            }

            String processedFileName =
                    UUID.randomUUID() + ".png";

            Path outputPath =
                    processedDir.resolve(processedFileName);

            switch (normalizedAlgorithm) {

                case "seam" ->
                        openCvProcessorService.runSeamCarving(
                                originalPath,
                                outputPath,
                                removeCols != null
                                        ? removeCols
                                        : 50,
                                removeRows != null
                                        ? removeRows
                                        : 0
                        );

                default ->
                        throw new IllegalArgumentException(
                                "Unsupported OpenCV algorithm: "
                                        + algorithm
                        );
            }

            image.setProcessedFileName(processedFileName);

            return ImageDto.from(
                    imageRepository.save(image)
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to prepare processed image file",
                    e
            );
        }
    }

    public ImageDto processWithOpenCvMask(
            Long id,
            String algorithm,
            Integer removeCols,
            Integer removeRows,
            Integer patchRadius,
            MultipartFile maskFile,
            Long userId
    ) {

        validateImageFile(maskFile);

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        if (algorithm == null || algorithm.isBlank()) {

            throw new IllegalArgumentException(
                    "Algorithm is required"
            );
        }

        String normalizedAlgorithm =
                algorithm.trim().toLowerCase();

        Path originalPath;

        if (image.getProcessedFileName() != null) {

            originalPath = Paths.get(
                    uploadPath,
                    String.valueOf(userId),
                    "processed",
                    image.getProcessedFileName()
            );

        } else {

            originalPath = Paths.get(
                    uploadPath,
                    String.valueOf(userId),
                    "originals",
                    image.getStoredFileName()
            );
        }

        Path processedDir = Paths.get(
                uploadPath,
                String.valueOf(userId),
                "processed"
        );

        Path masksDir = Paths.get(
                uploadPath,
                String.valueOf(userId),
                "masks"
        );

        try {

            Files.createDirectories(processedDir);
            Files.createDirectories(masksDir);

            if (image.getProcessedFileName() != null) {

                Files.deleteIfExists(
                        processedDir.resolve(
                                image.getProcessedFileName()
                        )
                );
            }

            String maskFileName =
                    UUID.randomUUID() + ".png";

            Path maskPath =
                    masksDir.resolve(maskFileName);

            Files.copy(
                    maskFile.getInputStream(),
                    maskPath
            );

            String processedFileName =
                    UUID.randomUUID() + ".png";

            Path outputPath =
                    processedDir.resolve(processedFileName);

            switch (normalizedAlgorithm) {

                case "seam_protect" ->
                        openCvProcessorService
                                .runProtectedSeamCarving(
                                        originalPath,
                                        outputPath,
                                        removeCols != null
                                                ? removeCols
                                                : 50,
                                        removeRows != null
                                                ? removeRows
                                                : 0,
                                        maskPath
                                );

                case "criminisi" ->
                        openCvProcessorService
                                .runCriminisi(
                                        originalPath,
                                        outputPath,
                                        maskPath,
                                        patchRadius != null
                                                ? patchRadius
                                                : 5
                                );

                default ->
                        throw new IllegalArgumentException(
                                "Unsupported OpenCV mask algorithm: "
                                        + algorithm
                        );
            }

            image.setProcessedFileName(processedFileName);

            return ImageDto.from(
                    imageRepository.save(image)
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to prepare mask processing files",
                    e
            );
        }
    }

    public ImageDto processPoisson(
            Long id,
            Integer centerX,
            Integer centerY,
            String mode,
            MultipartFile sourceFile,
            MultipartFile maskFile,
            Long userId
    ) {

        validateImageFile(sourceFile);
        validateImageFile(maskFile);

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        Path inputPath;

        if (image.getProcessedFileName() != null) {

            inputPath = Paths.get(
                    uploadPath,
                    String.valueOf(userId),
                    "processed",
                    image.getProcessedFileName()
            );

        } else {

            inputPath = Paths.get(
                    uploadPath,
                    String.valueOf(userId),
                    "originals",
                    image.getStoredFileName()
            );
        }

        Path processedDir = Paths.get(
                uploadPath,
                String.valueOf(userId),
                "processed"
        );

        Path poissonDir = Paths.get(
                uploadPath,
                String.valueOf(userId),
                "poisson"
        );

        try {

            Files.createDirectories(processedDir);
            Files.createDirectories(poissonDir);

            Path sourcePath =
                    poissonDir.resolve(
                            UUID.randomUUID()
                                    + "_source.png"
                    );

            Path maskPath =
                    poissonDir.resolve(
                            UUID.randomUUID()
                                    + "_mask.png"
                    );

            Files.copy(
                    sourceFile.getInputStream(),
                    sourcePath
            );

            Files.copy(
                    maskFile.getInputStream(),
                    maskPath
            );

            if (image.getProcessedFileName() != null) {

                Files.deleteIfExists(
                        processedDir.resolve(
                                image.getProcessedFileName()
                        )
                );
            }

            String processedFileName =
                    UUID.randomUUID() + ".png";

            Path outputPath =
                    processedDir.resolve(processedFileName);

            openCvProcessorService.runPoissonEditing(
                    inputPath,
                    outputPath,
                    sourcePath,
                    maskPath,
                    centerX,
                    centerY,
                    mode
            );

            image.setProcessedFileName(processedFileName);

            return ImageDto.from(
                    imageRepository.save(image)
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to process Poisson editing",
                    e
            );
        }
    }

    public void deleteImage(Long id, Long userId) {

        Image image = imageRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Image not found"
                        )
                );

        try {

            Files.deleteIfExists(
                    Paths.get(
                            uploadPath,
                            String.valueOf(userId),
                            "originals",
                            image.getStoredFileName()
                    )
            );

            if (image.getProcessedFileName() != null) {

                Files.deleteIfExists(
                        Paths.get(
                                uploadPath,
                                String.valueOf(userId),
                                "processed",
                                image.getProcessedFileName()
                        )
                );
            }

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to delete file",
                    e
            );
        }

        imageRepository.delete(image);
    }

    private void validateImageFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {

            throw new IllegalArgumentException(
                    "Image file is required"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {

            throw new IllegalArgumentException(
                    "Image file must not exceed 10MB"
            );
        }

        String contentType = file.getContentType();

        if (
                contentType == null ||
                        (
                                !ALLOWED_TYPES.contains(
                                        contentType.toLowerCase()
                                )
                                        &&
                                        !contentType.equalsIgnoreCase(
                                                "application/octet-stream"
                                        )
                        )
        ) {

            throw new IllegalArgumentException(
                    "Invalid image type"
            );
        }

        try {

            BufferedImage image =
                    ImageIO.read(file.getInputStream());

            if (image == null) {

                throw new IllegalArgumentException(
                        "Uploaded file is not a valid image"
                );
            }

            if (
                    image.getWidth() <= 0 ||
                            image.getHeight() <= 0
            ) {

                throw new IllegalArgumentException(
                        "Invalid image dimensions"
                );
            }

        } catch (IOException e) {

            throw new IllegalArgumentException(
                    "Could not read uploaded image"
            );
        }
    }

    private String getExtension(String fileName) {

        if (
                fileName == null ||
                        !fileName.contains(".")
        ) {

            throw new IllegalArgumentException(
                    "Image file must have a valid extension"
            );
        }

        String extension =
                fileName.substring(
                                fileName.lastIndexOf('.') + 1
                        )
                        .toLowerCase();

        if (
                !Set.of(
                        "jpg",
                        "jpeg",
                        "png"
                ).contains(extension)
        ) {

            throw new IllegalArgumentException(
                    "Only .jpg, .jpeg and .png extensions are allowed"
            );
        }

        return extension;
    }
}