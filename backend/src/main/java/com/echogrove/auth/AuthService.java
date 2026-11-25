package com.echogrove.auth;

import com.echogrove.auth.AuthDtos.LoginResponse;
import com.echogrove.auth.AuthDtos.RegisterRequest;
import com.echogrove.security.JwtService;
import com.echogrove.user.Role;
import com.echogrove.user.User;
import com.echogrove.user.UserRepository;
import com.echogrove.user.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class AuthService {

    private static final int MAX_FAILED = 5;
    private static final Duration LOCK = Duration.ofMinutes(15);
    private static final Duration TOKEN_TTL = Duration.ofHours(24);

    private final UserRepository users;
    private final EmailTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final MailService mail;
    private final SecureRandom random = new SecureRandom();
    /** Compared against when the email is unknown, so response time doesn't reveal which emails exist. */
    private final String dummyHash;

    public AuthService(UserRepository users, EmailTokenRepository tokens, PasswordEncoder encoder, JwtService jwt, MailService mail) {
        this.users = users;
        this.tokens = tokens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.mail = mail;
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    public static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /** Always looks the same to the caller, whether or not the email was already registered. */
    @Transactional
    public void register(RegisterRequest req) {
        String email = normalize(req.email());
        if (users.existsByEmail(email)) {
            return;
        }
        User u = new User();
        u.setEmail(email);
        u.setDisplayName(req.displayName().strip());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole(Role.USER);
        u.setCreatedAt(Instant.now());
        users.save(u);
        issueVerification(u);
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public LoginResponse login(String rawEmail, String password) {
        User u = users.findByEmail(normalize(rawEmail)).orElse(null);
        if (u == null) {
            encoder.matches(password, dummyHash);
            throw invalid();
        }
        Instant now = Instant.now();
        if (u.getLockedUntil() != null && u.getLockedUntil().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed attempts. Try again in 15 minutes.");
        }
        if (!encoder.matches(password, u.getPasswordHash()) || !u.isEnabled()) {
            u.setFailedAttempts(u.getFailedAttempts() + 1);
            if (u.getFailedAttempts() >= MAX_FAILED) {
                u.setLockedUntil(now.plus(LOCK));
                u.setFailedAttempts(0);
            }
            throw invalid();
        }
        u.setFailedAttempts(0);
        u.setLockedUntil(null);
        return new LoginResponse(jwt.issue(u), UserResponse.from(u));
    }

    @Transactional
    public void verify(String rawToken) {
        EmailToken t = tokens.findByTokenHash(sha256(rawToken))
                .filter(x -> x.getUsedAt() == null && x.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "This link has expired or was already used."));
        t.setUsedAt(Instant.now());
        t.getUser().setEmailVerified(true);
    }

    @Transactional
    public void resend(String rawEmail) {
        users.findByEmail(normalize(rawEmail))
                .filter(u -> !u.isEmailVerified() && u.isEnabled())
                .ifPresent(this::issueVerification);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long id) {
        return users.findById(id).map(UserResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in first."));
    }

    private void issueVerification(User u) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        EmailToken t = new EmailToken();
        t.setTokenHash(sha256(raw));
        t.setUser(u);
        t.setExpiresAt(Instant.now().plus(TOKEN_TTL));
        tokens.save(t);
        mail.sendVerification(u.getEmail(), u.getDisplayName(), raw);
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
    }

    static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
