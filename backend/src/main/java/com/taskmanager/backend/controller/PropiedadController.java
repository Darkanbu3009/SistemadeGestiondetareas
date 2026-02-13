package com.taskmanager.backend.controller;

import com.taskmanager.backend.dto.PropiedadRequest;
import com.taskmanager.backend.model.Propiedad;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.UserRepository;
import com.taskmanager.backend.service.FileStorageService;
import com.taskmanager.backend.service.PropiedadService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/propiedades")
public class PropiedadController {

    private final PropiedadService service;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public PropiedadController(PropiedadService service, UserRepository userRepository, FileStorageService fileStorageService) {
        this.service = service;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @GetMapping
    public ResponseEntity<Page<Propiedad>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String estado) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Propiedad> result;
        if (search != null && !search.isEmpty()) {
            result = service.search(user, search, pageable);
        } else {
            result = service.getAllByUserPaginated(user, pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Propiedad>> getAllList() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getAllByUser(user));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<Propiedad>> getDisponibles() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getDisponibles(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Propiedad> getById(@PathVariable Long id) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.getById(id, user));
    }

    @PostMapping
    public ResponseEntity<Propiedad> create(@Valid @RequestBody PropiedadRequest request) {
        User user = getCurrentUser();

        Propiedad propiedad = new Propiedad();
        propiedad.setNombre(request.getNombre());
        propiedad.setDireccion(request.getDireccion());
        propiedad.setCiudad(request.getCiudad());
        propiedad.setPais(request.getPais());
        propiedad.setTipo(request.getTipo());
        propiedad.setRentaMensual(request.getRentaMensual());
        propiedad.setEstado(request.getEstado());
        propiedad.setImagen(request.getImagen());

        Propiedad created = service.create(propiedad, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Propiedad> update(@PathVariable Long id, @Valid @RequestBody PropiedadRequest request) {
        User user = getCurrentUser();

        Propiedad propiedad = new Propiedad();
        propiedad.setNombre(request.getNombre());
        propiedad.setDireccion(request.getDireccion());
        propiedad.setCiudad(request.getCiudad());
        propiedad.setPais(request.getPais());
        propiedad.setTipo(request.getTipo());
        propiedad.setRentaMensual(request.getRentaMensual());
        propiedad.setEstado(request.getEstado());
        propiedad.setImagen(request.getImagen());

        Propiedad updated = service.update(id, propiedad, user);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        User user = getCurrentUser();
        service.delete(id, user);
    }

    @GetMapping("/stats/count")
    public ResponseEntity<Long> count() {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.countByUser(user));
    }

    @GetMapping("/stats/count/{estado}")
    public ResponseEntity<Long> countByEstado(@PathVariable String estado) {
        User user = getCurrentUser();
        return ResponseEntity.ok(service.countByUserAndEstado(user, estado));
    }

    @PostMapping("/{id}/upload-imagen")
    public ResponseEntity<Propiedad> uploadImagen(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        User user = getCurrentUser();
        Propiedad propiedad = service.getById(id, user);

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Solo se permiten archivos de imagen");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("El archivo no puede superar los 5MB");
        }

        // Delete old image if exists
        if (propiedad.getImagen() != null && !propiedad.getImagen().isEmpty()) {
            fileStorageService.deleteFile(propiedad.getImagen());
        }

        String imagenUrl = fileStorageService.uploadFile(file, "imagenes-propiedades");
        propiedad.setImagen(imagenUrl);
        return ResponseEntity.ok(service.save(propiedad));
    }
}
