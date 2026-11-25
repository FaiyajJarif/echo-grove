package com.echogrove.user;

import java.time.Instant;

public record UserResponse(Long id, String email, String displayName, Role role, boolean emailVerified, boolean enabled, Instant createdAt) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.getRole(), u.isEmailVerified(), u.isEnabled(), u.getCreatedAt());
    }
}
