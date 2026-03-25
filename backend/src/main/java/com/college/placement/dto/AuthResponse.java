package com.college.placement.dto;

import com.college.placement.model.Role;

public class AuthResponse {
    private String token;
    private Role role;
    private String username;

    public AuthResponse(String token, Role role, String username) {
        this.token = token;
        this.role = role;
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public Role getRole() {
        return role;
    }

    public String getUsername() {
        return username;
    }
}
