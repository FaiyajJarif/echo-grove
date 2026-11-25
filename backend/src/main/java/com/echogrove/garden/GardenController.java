package com.echogrove.garden;

import com.echogrove.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
public class GardenController {

    private final GardenService service;

    /** Save a garden (signed in, verified email) and get back its share code. */
    @PostMapping("/api/gardens")
    public ResponseEntity<GardenResponse> plant(@Valid @RequestBody GardenRequest request, @AuthenticationPrincipal CurrentUser me) {
        GardenResponse saved = service.plant(request, me);
        return ResponseEntity.created(URI.create("/api/gardens/" + saved.code())).body(saved);
    }

    /** Open a garden by its share code. */
    @GetMapping("/api/gardens/{code}")
    public GardenResponse find(@PathVariable String code) {
        return service.find(code);
    }

    /** Public gallery, cached for 30 seconds. */
    @GetMapping("/api/gardens")
    public ResponseEntity<List<GardenResponse>> gallery(@RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic()).body(service.gallery(limit));
    }

    @GetMapping("/api/me/gardens")
    public List<GardenResponse> mine(@AuthenticationPrincipal CurrentUser me, @RequestParam(defaultValue = "50") int limit) {
        return service.mine(me, limit);
    }

    @DeleteMapping("/api/gardens/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code, @AuthenticationPrincipal CurrentUser me) {
        service.delete(code, me);
        return ResponseEntity.noContent().build();
    }
}
