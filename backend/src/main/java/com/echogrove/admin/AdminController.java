package com.echogrove.admin;

import com.echogrove.garden.GardenRepository;
import com.echogrove.garden.GardenResponse;
import com.echogrove.garden.GardenService;
import com.echogrove.security.CurrentUser;
import com.echogrove.user.Role;
import com.echogrove.user.User;
import com.echogrove.user.UserRepository;
import com.echogrove.user.UserResponse;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** Moderation. Every route here requires the ADMIN role (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final GardenService gardens;
    private final GardenRepository gardenRepo;
    private final UserRepository users;

    public record Stats(long users, long verifiedUsers, long gardens, long publishedGardens, long hiddenGardens) {
    }

    public record HiddenRequest(@NotNull Boolean hidden) {
    }

    public record EnabledRequest(@NotNull Boolean enabled) {
    }

    @GetMapping("/stats")
    public Stats stats() {
        return new Stats(users.count(), users.countByEmailVerifiedTrue(), gardenRepo.count(), gardenRepo.countByPublishedTrue(), gardenRepo.countByHiddenTrue());
    }

    @GetMapping("/gardens")
    public List<GardenResponse> gardens(@RequestParam(defaultValue = "50") int limit) {
        return gardens.all(limit);
    }

    @PatchMapping("/gardens/{code}")
    public GardenResponse hide(@PathVariable String code, @RequestBody HiddenRequest req) {
        return gardens.setHidden(code, Boolean.TRUE.equals(req.hidden()));
    }

    @GetMapping("/users")
    public List<UserResponse> users(@RequestParam(defaultValue = "50") int limit) {
        return users.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.max(1, Math.min(limit, 50)))).stream().map(UserResponse::from).toList();
    }

    @PatchMapping("/users/{id}")
    @Transactional
    public UserResponse enable(@PathVariable Long id, @RequestBody EnabledRequest req, @AuthenticationPrincipal CurrentUser me) {
        User u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (u.getId().equals(me.id()) || u.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin accounts can't be disabled here.");
        }
        u.setEnabled(Boolean.TRUE.equals(req.enabled()));
        return UserResponse.from(u);
    }
}
