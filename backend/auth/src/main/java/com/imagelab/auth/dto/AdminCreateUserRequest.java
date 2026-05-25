package com.imagelab.auth.dto;

import lombok.Data;

@Data
public class AdminCreateUserRequest {
    private String name;
    private String email;
    private String password;
    private String role;
}