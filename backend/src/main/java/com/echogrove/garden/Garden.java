package com.echogrove.garden;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A saved garden: only the parameters and the seed are stored.
 * The tree and its music are fully reproducible from these values in the browser.
 */
@Entity
@Table(name = "gardens")
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
}
