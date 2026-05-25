package com.imagelab.auth.dto;

import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private String name;
    private String email;
    private String role;
}