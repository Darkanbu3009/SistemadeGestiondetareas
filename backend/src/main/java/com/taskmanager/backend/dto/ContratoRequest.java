package com.taskmanager.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public class ContratoRequest {

    @NotNull(message = "El inquilino es requerido")
    private Long inquilinoId;

    @NotNull(message = "La propiedad es requerida")
    private Long propiedadId;

    @NotNull(message = "La fecha de inicio es requerida")
    private LocalDate fechaInicio;

    @NotNull(message = "La fecha de fin es requerida")
    private LocalDate fechaFin;

    @NotNull(message = "La renta mensual es requerida")
    @Positive(message = "La renta mensual debe ser positiva")
    private BigDecimal rentaMensual;

    @Size(max = 500, message = "La URL del PDF no puede exceder 500 caracteres")
    private String pdfUrl;

    // Getters and Setters
    public Long getInquilinoId() {
        return inquilinoId;
    }

    public void setInquilinoId(Long inquilinoId) {
        this.inquilinoId = inquilinoId;
    }

    public Long getPropiedadId() {
        return propiedadId;
    }

    public void setPropiedadId(Long propiedadId) {
        this.propiedadId = propiedadId;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public BigDecimal getRentaMensual() {
        return rentaMensual;
    }

    public void setRentaMensual(BigDecimal rentaMensual) {
        this.rentaMensual = rentaMensual;
    }

    public String getPdfUrl() {
        return pdfUrl;
    }

    public void setPdfUrl(String pdfUrl) {
        this.pdfUrl = pdfUrl;
    }
}
