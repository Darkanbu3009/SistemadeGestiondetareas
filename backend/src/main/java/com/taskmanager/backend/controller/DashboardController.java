package com.taskmanager.backend.controller;

import com.taskmanager.backend.dto.DashboardStatsResponse;
import com.taskmanager.backend.model.Pago;
import com.taskmanager.backend.model.Contrato;
import com.taskmanager.backend.model.Propiedad;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.UserRepository;
import com.taskmanager.backend.service.PagoService;
import com.taskmanager.backend.service.ContratoService;
import com.taskmanager.backend.service.PropiedadService;
import com.taskmanager.backend.service.InquilinoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final PagoService pagoService;
    private final ContratoService contratoService;
    private final PropiedadService propiedadService;
    private final InquilinoService inquilinoService;
    private final UserRepository userRepository;

    public DashboardController(PagoService pagoService, ContratoService contratoService,
                               PropiedadService propiedadService, InquilinoService inquilinoService,
                               UserRepository userRepository) {
        this.pagoService = pagoService;
        this.contratoService = contratoService;
        this.propiedadService = propiedadService;
        this.inquilinoService = inquilinoService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        User user = getCurrentUser();
        LocalDate now = LocalDate.now();

        // Get current month income
        BigDecimal ingresosMes = pagoService.sumIngresosMes(user, now.getMonthValue(), now.getYear());

        // Get previous month income for variation calculation
        LocalDate previousMonth = now.minusMonths(1);
        BigDecimal ingresosMesAnterior = pagoService.sumIngresosMes(user,
                previousMonth.getMonthValue(), previousMonth.getYear());

        // Calculate variation percentage
        BigDecimal variacion = BigDecimal.ZERO;
        if (ingresosMesAnterior.compareTo(BigDecimal.ZERO) > 0) {
            variacion = ingresosMes.subtract(ingresosMesAnterior)
                    .divide(ingresosMesAnterior, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(1, RoundingMode.HALF_UP);
        }

        // Get pending rents
        BigDecimal rentasPendientes = pagoService.sumPendientes(user);

        // Get total properties
        Long totalPropiedades = propiedadService.countByUser(user);

        // Get active tenants
        Long inquilinosActivos = inquilinoService.countActiveByUser(user);

        // Get delinquent tenants count
        Long morosos = pagoService.countMorosos(user);

        DashboardStatsResponse stats = new DashboardStatsResponse(
                ingresosMes,
                variacion,
                rentasPendientes,
                totalPropiedades,
                inquilinosActivos,
                morosos
        );

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/rentas-pendientes")
    public ResponseEntity<List<Pago>> getRentasPendientes() {
        User user = getCurrentUser();
        return ResponseEntity.ok(pagoService.getAtrasados(user));
    }

    @GetMapping("/contratos-proximos-vencer")
    public ResponseEntity<List<Contrato>> getContratosProximosVencer() {
        User user = getCurrentUser();
        return ResponseEntity.ok(contratoService.getProximosAVencer(user, 30));
    }

    @GetMapping("/propiedades-destacadas")
    public ResponseEntity<List<Propiedad>> getPropiedadesDestacadas() {
        User user = getCurrentUser();
        return ResponseEntity.ok(propiedadService.getDisponibles(user));
    }
}
