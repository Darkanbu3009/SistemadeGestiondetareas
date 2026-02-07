package com.taskmanager.backend.dto;

public class UserPreferenceRequest {

    private String idioma;
    private String zonaHoraria;
    private Boolean notificacionesCorreo;
    private Boolean notificacionesSistema;
    private Integer elementosPorPagina;
    private Boolean recordatoriosPagos;
    private Boolean avisosVencimiento;
    private Boolean confirmacionesReservacion;
    private Boolean resumenMensual;

    // Getters and Setters
    public String getIdioma() { return idioma; }
    public void setIdioma(String idioma) { this.idioma = idioma; }

    public String getZonaHoraria() { return zonaHoraria; }
    public void setZonaHoraria(String zonaHoraria) { this.zonaHoraria = zonaHoraria; }

    public Boolean getNotificacionesCorreo() { return notificacionesCorreo; }
    public void setNotificacionesCorreo(Boolean notificacionesCorreo) { this.notificacionesCorreo = notificacionesCorreo; }

    public Boolean getNotificacionesSistema() { return notificacionesSistema; }
    public void setNotificacionesSistema(Boolean notificacionesSistema) { this.notificacionesSistema = notificacionesSistema; }

    public Integer getElementosPorPagina() { return elementosPorPagina; }
    public void setElementosPorPagina(Integer elementosPorPagina) { this.elementosPorPagina = elementosPorPagina; }

    public Boolean getRecordatoriosPagos() { return recordatoriosPagos; }
    public void setRecordatoriosPagos(Boolean recordatoriosPagos) { this.recordatoriosPagos = recordatoriosPagos; }

    public Boolean getAvisosVencimiento() { return avisosVencimiento; }
    public void setAvisosVencimiento(Boolean avisosVencimiento) { this.avisosVencimiento = avisosVencimiento; }

    public Boolean getConfirmacionesReservacion() { return confirmacionesReservacion; }
    public void setConfirmacionesReservacion(Boolean confirmacionesReservacion) { this.confirmacionesReservacion = confirmacionesReservacion; }

    public Boolean getResumenMensual() { return resumenMensual; }
    public void setResumenMensual(Boolean resumenMensual) { this.resumenMensual = resumenMensual; }
}
