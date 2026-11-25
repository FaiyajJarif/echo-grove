package com.echogrove.admin;

import com.echogrove.auth.AuthService;
import com.echogrove.user.Role;
import com.echogrove.user.User;
import com.echogrove.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

/** Creates the single admin account from ADMIN_EMAIL / ADMIN_PASSWORD at startup, never through the API. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    @Value("${echogrove.admin.email:}")
    private String email;

    @Value("${echogrove.admin.password:}")
    private String password;

    @Override
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.length() < 12) {
            log.info("No admin seeded (set ADMIN_EMAIL and an ADMIN_PASSWORD of 12+ characters to create one).");
            return;
        }
        String normalized = AuthService.normalize(email);
        if (users.existsByEmail(normalized)) {
            return;
        }
        User admin = new User();
        admin.setEmail(normalized);
        admin.setDisplayName("Grove Keeper");
        admin.setPasswordHash(encoder.encode(password));
        admin.setRole(Role.ADMIN);
        admin.setEmailVerified(true);
        admin.setCreatedAt(Instant.now());
        users.save(admin);
        log.info("Admin account created for {}", normalized);
    }
}
