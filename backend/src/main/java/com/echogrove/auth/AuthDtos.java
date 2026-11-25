package com.echogrove.auth;

import com.echogrove.user.UserResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request and response bodies for /api/auth. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = "^[\\p{L}\\p{N} .,'!?-]{2,40}$", message = "2 to 40 letters, numbers or simple punctuation") String displayName,
            @NotBlank @Size(min = 8, max = 72, message = "Use 8 to 72 characters") String password) {
    }

    public record LoginRequest(@NotBlank @Email @Size(max = 254) String email, @NotBlank @Size(max = 72) String password) {
    }

    public record VerifyRequest(@NotBlank @Size(max = 100) String token) {
    }

    public record ResendRequest(@NotBlank @Email @Size(max = 254) String email) {
    }

    public record LoginResponse(String token, UserResponse user) {
    }

    public record MessageResponse(String message) {
    }
}
