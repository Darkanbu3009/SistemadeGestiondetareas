package com.taskmanager.backend.dto;

import jakarta.validation.constraints.Size;

public class UserProfileRequest {

    @Size(max = 50)
    private String name;

    @Size(max = 50)
    private String apellido;

    @Size(max = 20)
    private String telefono;

    @Size(max = 500)
    private String avatar;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
}
