package com.echogrove.preset;

import com.echogrove.garden.ListenMode;
import com.echogrove.garden.Season;

public record PresetResponse(
        String id,
        String name,
        String description,
        long seed,
        int depth,
        int branches,
        double spread,
        double ratio,
        double asymmetry,
        Season season,
        int tempo,
        double wind,
        ListenMode mode
) {
}
