package com.imagelab.image.dto;

import com.imagelab.image.entity.Image;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ImageDto {
    private Long id;
    private String originalFileName;
    private LocalDateTime uploadDate;
    private String category;
    private String notes;
    private boolean favorite;
    private boolean hasProcessed;

    public static ImageDto from(Image image) {
        return ImageDto.builder()
                .id(image.getId())
                .originalFileName(image.getOriginalFileName())
                .uploadDate(image.getUploadDate())
                .category(image.getCategory())
                .notes(image.getNotes())
                .favorite(image.isFavorite())
                .hasProcessed(image.getProcessedFileName() != null)
                .build();
    }
}
