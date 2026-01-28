package com.taskmanager.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class PropiedadRequest {

    @NotBlank(message = "El nombre es requerido")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;

    @NotBlank(message = "La dirección es requerida")
    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String direccion;

    @NotBlank(message = "La ciudad es requerida")
    @Size(max = 100, message = "La ciudad no puede exceder 100 caracteres")
    private String ciudad;

    @NotBlank(message = "El país es requerido")
    @Size(max = 100, message = "El país no puede exceder 100 caracteres")
    private String pais;

    @NotBlank(message = "El tipo es requerido")
    @Size(max = 50, message = "El tipo no puede exceder 50 caracteres")
    private String tipo; // apartamento, casa, local, oficina, otro

    @NotNull(message = "La renta mensual es requerida")
    @Positive(message = "La renta mensual debe ser positiva")
    private BigDecimal rentaMensual;

    @NotBlank(message = "El estado es requerido")
    @Size(max = 20, message = "El estado no puede exceder 20 caracteres")
    private String estado; // disponible, ocupada, mantenimiento

    @Size(max = 500, message = "La URL de imagen no puede exceder 500 caracteres")
    private String imagen;

    // Getters and Setters
    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public String getPais() {
        return pais;
    }

    public void setPais(String pais) {
        this.pais = pais;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
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

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }
}
