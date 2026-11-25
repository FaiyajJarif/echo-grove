package com.echogrove.garden;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.echogrove.user.User;

import java.time.Instant;

/**
 * A saved garden: only the parameters and the seed are stored.
 * The tree and its music are fully reproducible from these values in the browser.
 */
@Entity
@Table(name = "gardens", indexes = {
        @Index(name = "idx_gardens_created", columnList = "created_at"),
        @Index(name = "idx_gardens_owner", columnList = "owner_id")})
@Getter
@Setter
@NoArgsConstructor
public class Garden {

    /** Short share code, for example "k7m2qx9p". */
    @Id
    @Column(length = 8)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    private long seed;
    private int depth;
    private int branches;
    private double spread;
    private double ratio;
    private double asymmetry;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Season season;

    private int tempo;
    private double wind;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private ListenMode mode;

    @Column(nullable = false)
    private Instant createdAt;

    /** Who saved it. Null only for gardens created before accounts existed. */
    @ManyToOne(fetch = FetchType.LAZY)
    private User owner;

    /** Shown in the public gallery (requires a verified email). */
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean published;

    /** Hidden by an admin: removed from the gallery and from share codes. */
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean hidden;
}
