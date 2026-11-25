package com.echogrove.garden;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GardenService {

    /** No 0/o, 1/l/i: share codes are easy to read aloud and type. */
    private static final String ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
    private static final int CODE_LENGTH = 8;
    private static final int MAX_RECENT = 50;

    private final GardenRepository repository;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public GardenResponse plant(GardenRequest request) {
        Garden garden = new Garden();
        garden.setCode(newCode());
        garden.setName(cleanName(request.name()));
        garden.setSeed(request.seed());
        garden.setDepth(request.depth());
        garden.setBranches(request.branches());
        garden.setSpread(request.spread());
        garden.setRatio(request.ratio());
        garden.setAsymmetry(request.asymmetry());
        garden.setSeason(request.season());
        garden.setTempo(request.tempo());
        garden.setWind(request.wind());
        garden.setMode(request.mode());
        garden.setCreatedAt(Instant.now());
        return GardenResponse.from(repository.save(garden));
    }

    @Transactional(readOnly = true)
    public GardenResponse find(String code) {
        return repository.findById(code.toLowerCase())
                .map(GardenResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Garden not found"));
    }

    @Transactional(readOnly = true)
    public List<GardenResponse> recent(int limit) {
        int size = Math.max(1, Math.min(limit, MAX_RECENT));
        return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, size)).stream()
                .map(GardenResponse::from)
                .toList();
    }

    private String cleanName(String name) {
        if (name == null || name.isBlank()) {
            return "Untitled garden";
        }
        return name.strip();
    }

    private String newCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            StringBuilder code = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            }
            if (!repository.existsById(code.toString())) {
                return code.toString();
            }
        }
        throw new IllegalStateException("Could not generate a unique garden code");
    }
}
