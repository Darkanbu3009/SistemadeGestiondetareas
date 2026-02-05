package com.taskmanager.backend.controller;

import com.taskmanager.backend.dto.PagoRequest;
import com.taskmanager.backend.dto.RegistrarPagoRequest;
import com.taskmanager.backend.model.Pago;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.UserRepository;
import com.taskmanager.backend.service.PagoService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService service;
    private final UserRepository userRepository;

    public PagoController(PagoService service, UserRepository userRepository) {
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
    public ResponseEntity<Page<Pago>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String estado) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Pago> result;
        if (search != null && !search.isEmpty()) {
            result = service.search(user, search, pageable);
        } else {
            result = service.getAllByUserPaginated(user, pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Pago>> getAllList() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getAllByUser(user));
    }

    @GetMapping("/atrasados")
    public ResponseEntity<List<Pago>> getAtrasados() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getAtrasados(user));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Pago>> getByEstado(@PathVariable String estado) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getByEstado(user, estado));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pago> getById(@PathVariable Long id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getById(id, user));
    }

    @PostMapping
    public ResponseEntity<Pago> create(@Valid @RequestBody PagoRequest request) {
        User user = getCurrentUser();

        Pago pago = new Pago();
        pago.setMonto(request.getMonto());
        pago.setFechaVencimiento(request.getFechaVencimiento());
        pago.setFechaPago(request.getFechaPago());
        pago.setComprobante(request.getComprobante());
        if (request.getEstado() != null) {
            pago.setEstado(request.getEstado());
        }

        Pago created = service.create(request.getInquilinoId(), request.getPropiedadId(), pago, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pago> update(@PathVariable Long id, @Valid @RequestBody PagoRequest request) {
        User user = getCurrentUser();

        Pago pago = new Pago();
        pago.setMonto(request.getMonto());
        pago.setFechaVencimiento(request.getFechaVencimiento());
        pago.setComprobante(request.getComprobante());
        pago.setEstado(request.getEstado());
        pago.setFechaPago(request.getFechaPago());

        Pago updated = service.update(id, pago, user);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/registrar")
    public ResponseEntity<Pago> registrarPago(@PathVariable Long id, @RequestBody RegistrarPagoRequest request) {
        User user = getCurrentUser();
        Pago updated = service.registrarPago(id, request.getFechaPago(), request.getComprobante(), user);
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

    @GetMapping("/stats/morosos")
    public ResponseEntity<Long> countMorosos() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.countMorosos(user));
    }

    @GetMapping("/stats/ingresos-mes")
    public ResponseEntity<Map<String, BigDecimal>> getIngresosMes(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        User user = getCurrentUser();

        LocalDate now = LocalDate.now();
        int currentMonth = month != null ? month : now.getMonthValue();
        int currentYear = year != null ? year : now.getYear();

        BigDecimal ingresos = service.sumIngresosMes(user, currentMonth, currentYear);
        BigDecimal pendientes = service.sumPendientes(user);

        return ResponseEntity.ok(Map.of(
                "ingresosMes", ingresos,
                "rentasPendientes", pendientes
        ));
    }
}
