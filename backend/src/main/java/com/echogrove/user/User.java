package com.echogrove.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stored lower-case and trimmed. */
    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(nullable = false, length = 40)
    private String displayName;

    /** BCrypt hash only; the password itself is never stored. */
    @Column(nullable = false, length = 72)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role = Role.USER;

    private boolean emailVerified;
    private boolean enabled = true;
    private int failedAttempts;
    private Instant lockedUntil;

    @Column(nullable = false)
    private Instant createdAt;
}
