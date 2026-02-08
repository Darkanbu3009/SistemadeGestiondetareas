package com.taskmanager.backend.controller;

import com.taskmanager.backend.dto.ChangePasswordRequest;
import com.taskmanager.backend.dto.SubscriptionRequest;
import com.taskmanager.backend.dto.UserPreferenceRequest;
import com.taskmanager.backend.dto.UserProfileRequest;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.model.UserPreference;
import com.taskmanager.backend.model.UserSession;
import com.taskmanager.backend.model.UserSubscription;
import com.taskmanager.backend.model.BillingHistory;
import com.taskmanager.backend.repository.UserRepository;
import com.taskmanager.backend.service.FileStorageService;
import com.taskmanager.backend.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/perfil")
public class UserProfileController {

    private final UserProfileService service;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public UserProfileController(UserProfileService service, UserRepository userRepository, FileStorageService fileStorageService) {
        this.service = service;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    // ---- Profile ----
    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile() {
        User user = getCurrentUser();
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("apellido", user.getApellido());
        response.put("email", user.getEmail());
        response.put("telefono", user.getTelefono());
        response.put("avatar", user.getAvatar());
        response.put("role", user.getRole());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateProfile(@Valid @RequestBody UserProfileRequest request) {
        User user = getCurrentUser();
        User updated = service.updateProfile(user, request);
        Map<String, Object> response = new HashMap<>();
        response.put("id", updated.getId());
        response.put("name", updated.getName());
        response.put("apellido", updated.getApellido());
        response.put("email", updated.getEmail());
        response.put("telefono", updated.getTelefono());
        response.put("avatar", updated.getAvatar());
        response.put("role", updated.getRole());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/avatar")
    public ResponseEntity<Map<String, Object>> removeAvatar() {
        User user = getCurrentUser();
        User updated = service.removeAvatar(user);
        Map<String, Object> response = new HashMap<>();
        response.put("id", updated.getId());
        response.put("name", updated.getName());
        response.put("avatar", updated.getAvatar());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Upload to Supabase Storage
            String avatarUrl = fileStorageService.uploadFile(file, "avatars");

            user.setAvatar(avatarUrl);
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("avatar", avatarUrl);
            response.put("message", "Avatar uploaded successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error uploading avatar: " + e.getMessage()));
        }
    }

    // ---- Password ----
    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        User user = getCurrentUser();
        try {
            service.changePassword(user, request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Contraseña actualizada correctamente");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // ---- Preferences ----
    @GetMapping("/preferencias")
    public ResponseEntity<UserPreference> getPreferences() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getPreferences(user));
    }

    @PutMapping("/preferencias")
    public ResponseEntity<UserPreference> updatePreferences(@RequestBody UserPreferenceRequest request) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.updatePreferences(user, request));
    }

    // ---- Sessions ----
    @GetMapping("/sesiones")
    public ResponseEntity<List<UserSession>> getSessions() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getSessions(user));
    }

    @PutMapping("/sesiones/{id}/cerrar")
    public ResponseEntity<Map<String, String>> closeSession(@PathVariable Long id) {
        User user = getCurrentUser();
        service.closeSession(user, id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Sesión cerrada");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/sesiones/cerrar-todas")
    public ResponseEntity<Map<String, String>> closeAllSessions(@RequestParam(required = false) Long currentSessionId) {
        User user = getCurrentUser();
        service.closeAllOtherSessions(user, currentSessionId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Todas las demás sesiones han sido cerradas");
        return ResponseEntity.ok(response);
    }

    // ---- Subscription ----
    @GetMapping("/suscripcion")
    public ResponseEntity<UserSubscription> getSubscription() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getSubscription(user));
    }

    @PutMapping("/suscripcion")
    public ResponseEntity<UserSubscription> updateSubscription(@RequestBody SubscriptionRequest request) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.updateSubscription(user, request));
    }

    @PutMapping("/suscripcion/cancelar")
    public ResponseEntity<Map<String, String>> cancelSubscription() {
        User user = getCurrentUser();
        service.cancelSubscription(user);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Suscripción cancelada");
        return ResponseEntity.ok(response);
    }

    // ---- Billing History ----
    @GetMapping("/historial")
    public ResponseEntity<Page<BillingHistory>> getBillingHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String filter) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);

        LocalDate after = null;
        if ("30d".equals(filter)) {
            after = LocalDate.now().minusDays(30);
        } else if ("12m".equals(filter)) {
            after = LocalDate.now().minusMonths(12);
        } else if (filter != null && filter.matches("\\d{4}-\\d{2}-\\d{2}")) {
            after = LocalDate.parse(filter);
        }

        return ResponseEntity.ok(service.getBillingHistory(user, search, after, pageable));
    }

    // ---- Account ----
    @DeleteMapping("/cuenta")
    public ResponseEntity<Map<String, String>> deleteAccount() {
        User user = getCurrentUser();
        service.deleteAccount(user);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cuenta eliminada permanentemente");
        return ResponseEntity.ok(response);
    }
}
