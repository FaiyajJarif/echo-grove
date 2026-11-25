package com.echogrove.security;

import com.echogrove.user.Role;
import com.echogrove.user.User;

/** The signed-in user, available in controllers via @AuthenticationPrincipal. */
public record CurrentUser(Long id, String email, String displayName, Role role, boolean emailVerified) {

    public static CurrentUser from(User u) {
        return new CurrentUser(u.getId(), u.getEmail(), u.getDisplayName(), u.getRole(), u.isEmailVerified());
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
