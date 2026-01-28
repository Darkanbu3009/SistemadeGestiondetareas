package com.taskmanager.backend.dto;

import java.math.BigDecimal;

public class DashboardStatsResponse {

    private BigDecimal ingresosMes;
    private BigDecimal ingresosVariacion;
    private BigDecimal rentasPendientes;
    private Long totalPropiedades;
    private Long inquilinosActivos;
    private Long morosos;

    public DashboardStatsResponse() {}

    public DashboardStatsResponse(BigDecimal ingresosMes, BigDecimal ingresosVariacion,
                                  BigDecimal rentasPendientes, Long totalPropiedades,
                                  Long inquilinosActivos, Long morosos) {
        this.ingresosMes = ingresosMes;
        this.ingresosVariacion = ingresosVariacion;
        this.rentasPendientes = rentasPendientes;
        this.totalPropiedades = totalPropiedades;
        this.inquilinosActivos = inquilinosActivos;
        this.morosos = morosos;
    }

    // Getters and Setters
    public BigDecimal getIngresosMes() {
        return ingresosMes;
    }

    public void setIngresosMes(BigDecimal ingresosMes) {
        this.ingresosMes = ingresosMes;
    }

    public BigDecimal getIngresosVariacion() {
        return ingresosVariacion;
    }

    public void setIngresosVariacion(BigDecimal ingresosVariacion) {
        this.ingresosVariacion = ingresosVariacion;
    }

    public BigDecimal getRentasPendientes() {
        return rentasPendientes;
    }

    public void setRentasPendientes(BigDecimal rentasPendientes) {
        this.rentasPendientes = rentasPendientes;
    }

    public Long getTotalPropiedades() {
        return totalPropiedades;
    }

    public void setTotalPropiedades(Long totalPropiedades) {
        this.totalPropiedades = totalPropiedades;
    }

    public Long getInquilinosActivos() {
        return inquilinosActivos;
    }

    public void setInquilinosActivos(Long inquilinosActivos) {
        this.inquilinosActivos = inquilinosActivos;
    }

    public Long getMorosos() {
        return morosos;
    }

    public void setMorosos(Long morosos) {
        this.morosos = morosos;
    }
}
