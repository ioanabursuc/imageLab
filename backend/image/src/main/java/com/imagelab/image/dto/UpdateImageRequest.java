package com.imagelab.image.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateImageRequest {

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;
}