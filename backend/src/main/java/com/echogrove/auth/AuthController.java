package com.echogrove.auth;

import com.echogrove.auth.AuthDtos.LoginRequest;
import com.echogrove.auth.AuthDtos.LoginResponse;
import com.echogrove.auth.AuthDtos.MessageResponse;
import com.echogrove.auth.AuthDtos.RegisterRequest;
import com.echogrove.auth.AuthDtos.ResendRequest;
import com.echogrove.auth.AuthDtos.VerifyRequest;
import com.echogrove.security.CurrentUser;
import com.echogrove.user.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private static final String CHECK_INBOX = "If this email can be used, we've sent a verification link. It works once and expires in 24 hours.";

    private final AuthService auth;

    @PostMapping("/api/auth/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MessageResponse register(@Valid @RequestBody RegisterRequest req) {
        auth.register(req);
        return new MessageResponse(CHECK_INBOX);
    }

    @PostMapping("/api/auth/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req.email(), req.password());
    }

    @PostMapping("/api/auth/verify-email")
    public MessageResponse verify(@Valid @RequestBody VerifyRequest req) {
        auth.verify(req.token());
        return new MessageResponse("Email verified. You can now save and publish gardens.");
    }

    @PostMapping("/api/auth/resend-verification")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MessageResponse resend(@Valid @RequestBody ResendRequest req) {
        auth.resend(req.email());
        return new MessageResponse(CHECK_INBOX);
    }

    @GetMapping("/api/me")
    public UserResponse me(@AuthenticationPrincipal CurrentUser me) {
        return auth.me(me.id());
    }
}
