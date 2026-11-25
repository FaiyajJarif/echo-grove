package com.echogrove.garden;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Parameters sent by the frontend when a user saves a garden. Ranges match the UI sliders. */
public record GardenRequest(
        @Size(max = 60) String name,
        @NotNull Long seed,
        @NotNull @Min(1) @Max(8) Integer depth,
        @NotNull @Min(2) @Max(3) Integer branches,
        @NotNull @DecimalMin("10") @DecimalMax("60") Double spread,
        @NotNull @DecimalMin("0.55") @DecimalMax("0.80") Double ratio,
        @NotNull @DecimalMin("0") @DecimalMax("1") Double asymmetry,
        @NotNull Season season,
        @NotNull @Min(48) @Max(80) Integer tempo,
        @NotNull @DecimalMin("0") @DecimalMax("1") Double wind,
        @NotNull ListenMode mode
) {

    /** Same safety cap as the frontend: at most 700 recursive calls per tree. */
    public static final int MAX_CALLS = 700;

    @AssertTrue(message = "Tree too large: lower the depth or the branches (max " + MAX_CALLS + " calls)")
    public boolean isWithinCallCap() {
        if (depth == null || branches == null) {
            return true; // @NotNull reports these
        }
        return totalCalls(branches, depth) <= MAX_CALLS;
    }

    /** Calls made by grow(): 1 + b + b^2 + ... + b^depth. */
    public static long totalCalls(int branches, int depth) {
        long total = 0;
        long level = 1;
        for (int d = 0; d <= depth; d++) {
            total += level;
            level *= branches;
        }
        return total;
    }
}
