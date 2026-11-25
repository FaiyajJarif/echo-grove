package com.echogrove.garden;

import com.echogrove.security.CurrentUser;
import com.echogrove.user.UserRepository;
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
    private static final int MAX_PAGE = 50;

    private final GardenRepository repository;
    private final UserRepository users;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public GardenResponse plant(GardenRequest request, CurrentUser me) {
        if (!me.emailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Verify your email to save gardens.");
        }
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
        garden.setPublished(Boolean.TRUE.equals(request.publish()));
        garden.setOwner(users.getReferenceById(me.id()));
        garden.setCreatedAt(Instant.now());
        return GardenResponse.from(repository.save(garden));
    }

    /** Share codes open any garden that isn't hidden, published or not. */
    @Transactional(readOnly = true)
    public GardenResponse find(String code) {
        return repository.findById(code.toLowerCase())
                .filter(g -> !g.isHidden())
                .map(GardenResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Garden not found"));
    }

    @Transactional(readOnly = true)
    public List<GardenResponse> gallery(int limit) {
        return repository.findByPublishedTrueAndHiddenFalseOrderByCreatedAtDesc(page(limit)).stream().map(GardenResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<GardenResponse> mine(CurrentUser me, int limit) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(me.id(), page(limit)).stream().map(GardenResponse::from).toList();
    }

    @Transactional
    public void delete(String code, CurrentUser me) {
        Garden g = repository.findById(code.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Garden not found"));
        boolean owner = g.getOwner() != null && g.getOwner().getId().equals(me.id());
        if (!owner && !me.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own gardens.");
        }
        repository.delete(g);
    }

    // ---- Admin ---------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<GardenResponse> all(int limit) {
        return repository.findAllByOrderByCreatedAtDesc(page(limit)).stream().map(GardenResponse::from).toList();
    }

    @Transactional
    public GardenResponse setHidden(String code, boolean hidden) {
        Garden g = repository.findById(code.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Garden not found"));
        g.setHidden(hidden);
        return GardenResponse.from(g);
    }

    private static PageRequest page(int limit) {
        return PageRequest.of(0, Math.max(1, Math.min(limit, MAX_PAGE)));
    }

    private String cleanName(String name) {
        return name == null || name.isBlank() ? "Untitled garden" : name.strip();
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
