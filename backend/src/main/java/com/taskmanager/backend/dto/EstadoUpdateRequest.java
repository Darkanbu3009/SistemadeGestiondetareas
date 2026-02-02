package com.taskmanager.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EstadoUpdateRequest {

    @NotBlank(message = "El estado es requerido")
    @Size(max = 20, message = "El estado no puede exceder 20 caracteres")
    private String estado;

    public EstadoUpdateRequest() {}

    public EstadoUpdateRequest(String estado) {
        this.estado = estado;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
