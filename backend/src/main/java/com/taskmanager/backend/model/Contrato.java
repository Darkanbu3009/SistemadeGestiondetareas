package com.taskmanager.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "contratos")
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquilino_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "user", "propiedad"})
    private Inquilino inquilino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "propiedad_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "user"})
    private Propiedad propiedad;

    @NotNull
    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @NotNull
    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @NotNull
    @Positive
    @Column(name = "renta_mensual", precision = 10, scale = 2)
    private BigDecimal rentaMensual;

    @NotNull
    @Size(max = 20)
    private String estado; // activo, por_vencer, finalizado, sin_firmar

    @Size(max = 500)
    @Column(name = "pdf_url")
    private String pdfUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "tasks", "password"})
    private User user;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Days threshold to consider contract as "por_vencer" (about to expire)
    private static final long DAYS_THRESHOLD_POR_VENCER = 30;

    public Contrato() {}

    public Contrato(Inquilino inquilino, Propiedad propiedad, LocalDate fechaInicio,
                    LocalDate fechaFin, BigDecimal rentaMensual) {
        this.inquilino = inquilino;
        this.propiedad = propiedad;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.rentaMensual = rentaMensual;
        this.estado = "sin_firmar";
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (estado == null) {
            estado = "sin_firmar";
        }
        updateEstado();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        updateEstado();
    }

    // Automatically update estado based on dates
    public void updateEstado() {
        if ("sin_firmar".equals(estado)) {
            return; // Don't auto-update if not signed yet
        }

        LocalDate today = LocalDate.now();

        if (today.isAfter(fechaFin)) {
            estado = "finalizado";
        } else if (today.isBefore(fechaInicio)) {
            // Contract not started yet, keep current estado
            if (!"sin_firmar".equals(estado)) {
                estado = "activo";
            }
        } else {
            // Contract is ongoing
            long daysUntilEnd = ChronoUnit.DAYS.between(today, fechaFin);
            if (daysUntilEnd <= DAYS_THRESHOLD_POR_VENCER) {
                estado = "por_vencer";
            } else {
                estado = "activo";
            }
        }
    }

    // Calculate days until contract ends
    public Long getDiasRestantes() {
        if (fechaFin == null) {
            return null;
        }
        LocalDate today = LocalDate.now();
        if (today.isAfter(fechaFin)) {
            return 0L;
        }
        return ChronoUnit.DAYS.between(today, fechaFin);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    // Expose inquilinoId for JSON serialization
    public Long getInquilinoId() {
        return inquilino != null ? inquilino.getId() : null;
    }

    // Expose propiedadId for JSON serialization
    public Long getPropiedadId() {
        return propiedad != null ? propiedad.getId() : null;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Inquilino getInquilino() {
        return inquilino;
    }

    public void setInquilino(Inquilino inquilino) {
        this.inquilino = inquilino;
    }

    public Propiedad getPropiedad() {
        return propiedad;
    }

    public void setPropiedad(Propiedad propiedad) {
        this.propiedad = propiedad;
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

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getPdfUrl() {
        return pdfUrl;
    }

    public void setPdfUrl(String pdfUrl) {
        this.pdfUrl = pdfUrl;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
