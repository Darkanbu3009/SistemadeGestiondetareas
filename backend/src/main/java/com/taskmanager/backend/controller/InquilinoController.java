package com.taskmanager.backend.controller;

import com.taskmanager.backend.dto.InquilinoRequest;
import com.taskmanager.backend.model.Inquilino;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.UserRepository;
import com.taskmanager.backend.service.InquilinoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquilinos")
public class InquilinoController {

    private final InquilinoService service;
    private final UserRepository userRepository;

    public InquilinoController(InquilinoService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @GetMapping
    public ResponseEntity<Page<Inquilino>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String contratoEstado) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Inquilino> result;
        if (search != null && !search.isEmpty()) {
            result = service.search(user, search, pageable);
        } else {
            result = service.getAllByUserPaginated(user, pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Inquilino>> getAllList() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getAllByUser(user));
    }

    @GetMapping("/sin-propiedad")
    public ResponseEntity<List<Inquilino>> getWithoutProperty() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getWithoutProperty(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inquilino> getById(@PathVariable Long id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getById(id, user));
    }

    @PostMapping
    public ResponseEntity<Inquilino> create(@Valid @RequestBody InquilinoRequest request) {
        User user = getCurrentUser();

        Inquilino inquilino = new Inquilino();
        inquilino.setNombre(request.getNombre());
        inquilino.setApellido(request.getApellido());
        inquilino.setEmail(request.getEmail());
        inquilino.setTelefono(request.getTelefono());
        inquilino.setDocumento(request.getDocumento());
        inquilino.setAvatar(request.getAvatar());

        Inquilino created = service.create(inquilino, request.getPropiedadId(), user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inquilino> update(@PathVariable Long id, @Valid @RequestBody InquilinoRequest request) {
        User user = getCurrentUser();

        Inquilino inquilino = new Inquilino();
        inquilino.setNombre(request.getNombre());
        inquilino.setApellido(request.getApellido());
        inquilino.setEmail(request.getEmail());
        inquilino.setTelefono(request.getTelefono());
        inquilino.setDocumento(request.getDocumento());
        inquilino.setAvatar(request.getAvatar());

        Inquilino updated = service.update(id, inquilino, request.getPropiedadId(), user);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        User user = getCurrentUser();
        service.delete(id, user);
    }

    @GetMapping("/stats/count")
    public ResponseEntity<Long> count() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.countByUser(user));
    }

    @GetMapping("/stats/count/activos")
    public ResponseEntity<Long> countActivos() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.countActiveByUser(user));
    }
}
