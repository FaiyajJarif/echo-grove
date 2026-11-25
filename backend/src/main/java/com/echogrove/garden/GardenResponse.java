package com.echogrove.garden;

import java.time.Instant;

public record GardenResponse(
        String code,
        String name,
        long seed,
        int depth,
        int branches,
        double spread,
        double ratio,
        double asymmetry,
        Season season,
        int tempo,
        double wind,
        ListenMode mode,
        Instant createdAt,
        boolean published,
        boolean hidden,
        String ownerName
) {

    public static GardenResponse from(Garden g) {
        return new GardenResponse(
                g.getCode(), g.getName(), g.getSeed(), g.getDepth(), g.getBranches(),
                g.getSpread(), g.getRatio(), g.getAsymmetry(), g.getSeason(),
                g.getTempo(), g.getWind(), g.getMode(), g.getCreatedAt(),
                g.isPublished(), g.isHidden(), g.getOwner() == null ? null : g.getOwner().getDisplayName());
    }
}
