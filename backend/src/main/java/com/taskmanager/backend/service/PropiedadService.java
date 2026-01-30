package com.taskmanager.backend.service;

import com.taskmanager.backend.model.Propiedad;
import com.taskmanager.backend.model.Inquilino;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.ContratoRepository;
import com.taskmanager.backend.repository.InquilinoRepository;
import com.taskmanager.backend.repository.PagoRepository;
import com.taskmanager.backend.repository.PropiedadRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PropiedadService {

    private final PropiedadRepository repository;
    private final InquilinoRepository inquilinoRepository;
    private final ContratoRepository contratoRepository;
    private final PagoRepository pagoRepository;

    public PropiedadService(PropiedadRepository repository,
                           InquilinoRepository inquilinoRepository,
                           ContratoRepository contratoRepository,
                           PagoRepository pagoRepository) {
        this.repository = repository;
        this.inquilinoRepository = inquilinoRepository;
        this.contratoRepository = contratoRepository;
        this.pagoRepository = pagoRepository;
    }

    public List<Propiedad> getAllByUser(User user) {
        return repository.findByUserOrderByCreatedAtDesc(user);
    }

    public Page<Propiedad> getAllByUserPaginated(User user, Pageable pageable) {
        return repository.findByUser(user, pageable);
    }

    public Propiedad getById(Long id, User user) {
        return repository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Propiedad no encontrada con id: " + id));
    }

    public Propiedad create(Propiedad propiedad, User user) {
        propiedad.setUser(user);
        return repository.save(propiedad);
    }

    public Propiedad update(Long id, Propiedad propiedadDetails, User user) {
        Propiedad propiedad = getById(id, user);

        if (propiedadDetails.getNombre() != null) {
            propiedad.setNombre(propiedadDetails.getNombre());
        }
        if (propiedadDetails.getDireccion() != null) {
            propiedad.setDireccion(propiedadDetails.getDireccion());
        }
        if (propiedadDetails.getCiudad() != null) {
            propiedad.setCiudad(propiedadDetails.getCiudad());
        }
        if (propiedadDetails.getPais() != null) {
            propiedad.setPais(propiedadDetails.getPais());
        }
        if (propiedadDetails.getTipo() != null) {
            propiedad.setTipo(propiedadDetails.getTipo());
        }
        if (propiedadDetails.getRentaMensual() != null) {
            propiedad.setRentaMensual(propiedadDetails.getRentaMensual());
        }
        if (propiedadDetails.getEstado() != null) {
            propiedad.setEstado(propiedadDetails.getEstado());
        }
        if (propiedadDetails.getImagen() != null) {
            propiedad.setImagen(propiedadDetails.getImagen());
        }

        return repository.save(propiedad);
    }

    public void delete(Long id, User user) {
        Propiedad propiedad = getById(id, user);

        // Delete associated payments first
        if (pagoRepository != null) {
            pagoRepository.deleteByPropiedadId(id);
        }

        // Delete associated contracts first
        if (contratoRepository != null) {
            contratoRepository.deleteByPropiedadId(id);
        }

        // Unassign any inquilinos from this property
        List<Inquilino> inquilinos = inquilinoRepository.findByPropiedadId(id);
        for (Inquilino inquilino : inquilinos) {
            inquilino.setPropiedad(null);
            inquilino.setContratoEstado("sin_contrato");
            inquilinoRepository.save(inquilino);
        }

        repository.deleteById(id);
    }

    public List<Propiedad> getByEstado(User user, String estado) {
        return repository.findByUserAndEstado(user, estado);
    }

    public List<Propiedad> getDisponibles(User user) {
        return repository.findDisponiblesByUser(user);
    }

    public Page<Propiedad> search(User user, String search, Pageable pageable) {
        return repository.searchByUser(user, search, pageable);
    }

    public Long countByUser(User user) {
        return repository.countByUser(user);
    }

    public Long countByUserAndEstado(User user, String estado) {
        return repository.countByUserAndEstado(user, estado);
    }
}
