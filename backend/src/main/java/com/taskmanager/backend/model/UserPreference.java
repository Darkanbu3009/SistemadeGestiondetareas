package com.taskmanager.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 10, columnDefinition = "varchar(10) default 'es'")
    private String idioma = "es";

    @Column(length = 30, columnDefinition = "varchar(30) default 'UTC-06:00'")
    private String zonaHoraria = "UTC-06:00";

    @Column(columnDefinition = "boolean default true")
    private Boolean notificacionesCorreo = true;

    @Column(columnDefinition = "boolean default true")
    private Boolean notificacionesSistema = true;

    @Column(columnDefinition = "integer default 10")
    private Integer elementosPorPagina = 10;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public UserPreference() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
