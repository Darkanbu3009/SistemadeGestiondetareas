package com.taskmanager.backend.dto;

public class UserPreferenceRequest {

    private String idioma;
    private String zonaHoraria;
    private Boolean notificacionesCorreo;
    private Boolean notificacionesSistema;
    private Integer elementosPorPagina;

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
}
