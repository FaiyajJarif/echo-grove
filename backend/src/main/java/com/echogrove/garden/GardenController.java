package com.echogrove.garden;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/gardens")
@RequiredArgsConstructor
public class GardenController {

    private final GardenService service;

    /** Save a garden and get back its share code. */
    @PostMapping
    public ResponseEntity<GardenResponse> plant(@Valid @RequestBody GardenRequest request) {
        GardenResponse saved = service.plant(request);
        return ResponseEntity.created(URI.create("/api/gardens/" + saved.code())).body(saved);
    }

    /** Load a shared garden by its code. */
    @GetMapping("/{code}")
    public GardenResponse find(@PathVariable String code) {
        return service.find(code);
    }

    /** Most recently planted gardens, for the gallery. */
    @GetMapping
    public List<GardenResponse> recent(@RequestParam(defaultValue = "12") int limit) {
        return service.recent(limit);
    }
}
