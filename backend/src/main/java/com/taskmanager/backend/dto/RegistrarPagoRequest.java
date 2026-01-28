package com.taskmanager.backend.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class RegistrarPagoRequest {

    private LocalDate fechaPago;

    @Size(max = 500, message = "La URL del comprobante no puede exceder 500 caracteres")
    private String comprobante;

    // Getters and Setters
    public LocalDate getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDate fechaPago) {
        this.fechaPago = fechaPago;
    }

    public String getComprobante() {
        return comprobante;
    }

    public void setComprobante(String comprobante) {
        this.comprobante = comprobante;
    }
}
