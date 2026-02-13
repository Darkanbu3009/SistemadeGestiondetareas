package com.taskmanager.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquilinos")
public class Inquilino {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    private String nombre;

    @NotBlank
    @Size(max = 50)
    private String apellido;

    @NotBlank
    @Email
    @Size(max = 100)
    private String email;

    @NotBlank
    @Size(max = 20)
    private String telefono;

    @NotBlank
    @Size(max = 50)
    private String documento; // DNI, passport, etc.

    @Size(max = 500)
    private String avatar;

    @Size(max = 500)
    @Column(name = "direccion_contacto")
    private String direccionContacto;

    @Size(max = 500)
    @Column(name = "documento_identidad_url")
    private String documentoIdentidadUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "propiedad_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "user"})
    private Propiedad propiedad;

    @Size(max = 20)
    @Column(name = "contrato_estado")
    private String contratoEstado; // activo, finalizado, sin_contrato

    @Column(name = "contrato_fin")
    private LocalDate contratoFin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "tasks", "password"})
    private User user;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Inquilino() {}

    public Inquilino(String nombre, String apellido, String email, String telefono, String documento) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.telefono = telefono;
        this.documento = documento;
        this.contratoEstado = "sin_contrato";
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (contratoEstado == null) {
            contratoEstado = "sin_contrato";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getDireccionContacto() {
        return direccionContacto;
    }

    public void setDireccionContacto(String direccionContacto) {
        this.direccionContacto = direccionContacto;
    }

    public String getDocumentoIdentidadUrl() {
        return documentoIdentidadUrl;
    }

    public void setDocumentoIdentidadUrl(String documentoIdentidadUrl) {
        this.documentoIdentidadUrl = documentoIdentidadUrl;
    }

    public Propiedad getPropiedad() {
        return propiedad;
    }

    public void setPropiedad(Propiedad propiedad) {
        this.propiedad = propiedad;
    }

    public String getContratoEstado() {
        return contratoEstado;
    }

    public void setContratoEstado(String contratoEstado) {
        this.contratoEstado = contratoEstado;
    }

    public LocalDate getContratoFin() {
        return contratoFin;
    }

    public void setContratoFin(LocalDate contratoFin) {
        this.contratoFin = contratoFin;
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

    // Helper method to get full name
    public String getNombreCompleto() {
        return nombre + " " + apellido;
    }
}
