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
    public ResponseEntity<DashboardStatsResponse> getStats(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        User user = getCurrentUser();
        LocalDate now = LocalDate.now();

        int targetMonth = month != null ? month : now.getMonthValue();
        int targetYear = year != null ? year : now.getYear();

        // Get selected month income
        BigDecimal ingresosMes = pagoService.sumIngresosMes(user, targetMonth, targetYear);

        // Get previous month income for variation calculation
        LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);
        LocalDate previousMonth = targetDate.minusMonths(1);
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

        // Get pending rents filtered by month/year
        BigDecimal rentasPendientes = pagoService.sumPendientes(user, targetMonth, targetYear);

        // Get total properties filtered by month/year (properties with payments in that month)
        Long totalPropiedades = pagoService.countPropiedadesByMonth(user, targetMonth, targetYear);

        // Get active tenants filtered by month/year (tenants with payments in that month)
        Long inquilinosActivos = pagoService.countInquilinosByMonth(user, targetMonth, targetYear);

        // Get delinquent tenants count filtered by month/year
        Long morosos = pagoService.countMorosos(user, targetMonth, targetYear);

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
    public ResponseEntity<List<Pago>> getRentasPendientes(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        User user = getCurrentUser();
        if (month != null && year != null) {
            return ResponseEntity.ok(pagoService.getAtrasados(user, month, year));
        }
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
