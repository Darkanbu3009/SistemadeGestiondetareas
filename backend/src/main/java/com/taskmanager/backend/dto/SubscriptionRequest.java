package com.taskmanager.backend.dto;

public class SubscriptionRequest {

    private String plan;
    private String tarjetaUltimos4;
    private String tarjetaExpiracion;

    // Getters and Setters
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public String getTarjetaUltimos4() { return tarjetaUltimos4; }
    public void setTarjetaUltimos4(String tarjetaUltimos4) { this.tarjetaUltimos4 = tarjetaUltimos4; }

    public String getTarjetaExpiracion() { return tarjetaExpiracion; }
    public void setTarjetaExpiracion(String tarjetaExpiracion) { this.tarjetaExpiracion = tarjetaExpiracion; }
}
