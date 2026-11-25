package com.echogrove.preset;

import com.echogrove.garden.ListenMode;
import com.echogrove.garden.Season;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/presets")
public class PresetController {

    private static final List<PresetResponse> PRESETS = List.of(
            new PresetResponse("morning-bonsai", "Morning Bonsai",
                    "A small, balanced tree at dawn. The default calm.",
                    1L, 6, 2, 25, 0.70, 0.2, Season.SPRING, 60, 0.3, ListenMode.BLOOM),
            new PresetResponse("willow-rain", "Willow Rain",
                    "Long, drooping branches and soft autumn rain.",
                    7L, 7, 2, 14, 0.78, 0.3, Season.AUTUMN, 54, 0.5, ListenMode.BLOOM),
            new PresetResponse("winter-pine", "Winter Pine",
                    "Three-way branching, sparse notes, long reverb.",
                    21L, 5, 3, 30, 0.62, 0.1, Season.WINTER, 50, 0.2, ListenMode.BLOOM),
            new PresetResponse("firefly-night", "Firefly Night",
                    "A wild, asymmetric tree under a deep blue sky.",
                    42L, 6, 2, 35, 0.68, 0.8, Season.NIGHT, 56, 0.15, ListenMode.BLOOM)
    );

    @GetMapping
    public List<PresetResponse> all() {
        return PRESETS;
    }
}
