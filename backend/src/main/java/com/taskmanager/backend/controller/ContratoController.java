package com.taskmanager.backend.controller;

import com.taskmanager.backend.dto.ContratoRequest;
import com.taskmanager.backend.model.Contrato;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.UserRepository;
import com.taskmanager.backend.service.ContratoService;
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
@RequestMapping("/api/contratos")
public class ContratoController {

    private final ContratoService service;
    private final UserRepository userRepository;

    public ContratoController(ContratoService service, UserRepository userRepository) {
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
    public ResponseEntity<Page<Contrato>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String estado) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Contrato> result;
        if (search != null && !search.isEmpty()) {
            result = service.search(user, search, pageable);
        } else {
            result = service.getAllByUserPaginated(user, pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Contrato>> getAllList() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getAllByUser(user));
    }

    @GetMapping("/proximos-a-vencer")
    public ResponseEntity<List<Contrato>> getProximosAVencer(@RequestParam(defaultValue = "30") int days) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getProximosAVencer(user, days));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Contrato>> getByEstado(@PathVariable String estado) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getByEstado(user, estado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contrato> getById(@PathVariable Long id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getById(id, user));
    }

    @PostMapping
    public ResponseEntity<Contrato> create(@Valid @RequestBody ContratoRequest request) {
        User user = getCurrentUser();

        Contrato contrato = new Contrato();
        contrato.setFechaInicio(request.getFechaInicio());
        contrato.setFechaFin(request.getFechaFin());
        contrato.setRentaMensual(request.getRentaMensual());
        contrato.setPdfUrl(request.getPdfUrl());
        contrato.setEstado("sin_firmar");

        Contrato created = service.create(request.getInquilinoId(), request.getPropiedadId(), contrato, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contrato> update(@PathVariable Long id, @Valid @RequestBody ContratoRequest request) {
        User user = getCurrentUser();

        Contrato contrato = new Contrato();
        contrato.setFechaInicio(request.getFechaInicio());
        contrato.setFechaFin(request.getFechaFin());
        contrato.setRentaMensual(request.getRentaMensual());
        contrato.setPdfUrl(request.getPdfUrl());

        Contrato updated = service.update(id, contrato, user);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/firmar")
    public ResponseEntity<Contrato> firmar(@PathVariable Long id) {
        User user = getCurrentUser();
        Contrato updated = service.firmar(id, user);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/finalizar")
    public ResponseEntity<Contrato> finalizar(@PathVariable Long id) {
        User user = getCurrentUser();
        Contrato updated = service.finalizar(id, user);
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

    @GetMapping("/stats/count/{estado}")
    public ResponseEntity<Long> countByEstado(@PathVariable String estado) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.countByUserAndEstado(user, estado));
    }
}
