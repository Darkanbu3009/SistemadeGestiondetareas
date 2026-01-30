package com.taskmanager.backend.service;

import com.taskmanager.backend.model.Inquilino;
import com.taskmanager.backend.model.Propiedad;
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
public class InquilinoService {

    private final InquilinoRepository repository;
    private final PropiedadRepository propiedadRepository;
    private final ContratoRepository contratoRepository;
    private final PagoRepository pagoRepository;

    public InquilinoService(InquilinoRepository repository, 
                           PropiedadRepository propiedadRepository,
                           ContratoRepository contratoRepository,
                           PagoRepository pagoRepository) {
        this.repository = repository;
        this.propiedadRepository = propiedadRepository;
        this.contratoRepository = contratoRepository;
        this.pagoRepository = pagoRepository;
    }

    public List<Inquilino> getAllByUser(User user) {
        return repository.findByUserOrderByCreatedAtDesc(user);
    }

    public Page<Inquilino> getAllByUserPaginated(User user, Pageable pageable) {
        return repository.findByUser(user, pageable);
    }

    public Inquilino getById(Long id, User user) {
        return repository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Inquilino no encontrado con id: " + id));
    }

    public Inquilino create(Inquilino inquilino, Long propiedadId, User user) {
        // Check if email is unique for this user
        if (repository.findByEmailAndUser(inquilino.getEmail(), user).isPresent()) {
            throw new RuntimeException("Ya existe un inquilino con este email");
        }

        // Check if documento is unique for this user
        if (repository.findByDocumentoAndUser(inquilino.getDocumento(), user).isPresent()) {
            throw new RuntimeException("Ya existe un inquilino con este documento");
        }

        inquilino.setUser(user);

        // Assign property if provided
        if (propiedadId != null) {
            Propiedad propiedad = propiedadRepository.findByIdAndUser(propiedadId, user)
                    .orElseThrow(() -> new RuntimeException("Propiedad no encontrada con id: " + propiedadId));
            inquilino.setPropiedad(propiedad);
            // Update property status
            propiedad.setEstado("ocupada");
            propiedadRepository.save(propiedad);
        }

        return repository.save(inquilino);
    }

    public Inquilino update(Long id, Inquilino inquilinoDetails, Long propiedadId, User user) {
        Inquilino inquilino = getById(id, user);

        if (inquilinoDetails.getNombre() != null) {
            inquilino.setNombre(inquilinoDetails.getNombre());
        }
        if (inquilinoDetails.getApellido() != null) {
            inquilino.setApellido(inquilinoDetails.getApellido());
        }
        if (inquilinoDetails.getEmail() != null && !inquilinoDetails.getEmail().equals(inquilino.getEmail())) {
            // Check if new email is unique
            if (repository.findByEmailAndUser(inquilinoDetails.getEmail(), user).isPresent()) {
                throw new RuntimeException("Ya existe un inquilino con este email");
            }
            inquilino.setEmail(inquilinoDetails.getEmail());
        }
        if (inquilinoDetails.getTelefono() != null) {
            inquilino.setTelefono(inquilinoDetails.getTelefono());
        }
        if (inquilinoDetails.getDocumento() != null && !inquilinoDetails.getDocumento().equals(inquilino.getDocumento())) {
            // Check if new documento is unique
            if (repository.findByDocumentoAndUser(inquilinoDetails.getDocumento(), user).isPresent()) {
                throw new RuntimeException("Ya existe un inquilino con este documento");
            }
            inquilino.setDocumento(inquilinoDetails.getDocumento());
        }
        // Always update avatar (even if null or empty to allow clearing it)
        inquilino.setAvatar(inquilinoDetails.getAvatar());
        
        if (inquilinoDetails.getContratoEstado() != null) {
            inquilino.setContratoEstado(inquilinoDetails.getContratoEstado());
        }
        if (inquilinoDetails.getContratoFin() != null) {
            inquilino.setContratoFin(inquilinoDetails.getContratoFin());
        }

        // Handle property assignment changes
        Long currentPropiedadId = inquilino.getPropiedad() != null ? inquilino.getPropiedad().getId() : null;
        
        // If propiedadId changed
        if ((propiedadId == null && currentPropiedadId != null) || 
            (propiedadId != null && !propiedadId.equals(currentPropiedadId))) {
            
            // Free up old property if exists
            if (inquilino.getPropiedad() != null) {
                Propiedad oldPropiedad = inquilino.getPropiedad();
                oldPropiedad.setEstado("disponible");
                propiedadRepository.save(oldPropiedad);
                inquilino.setPropiedad(null);
            }

            // Assign new property if provided
            if (propiedadId != null) {
                Propiedad newPropiedad = propiedadRepository.findByIdAndUser(propiedadId, user)
                        .orElseThrow(() -> new RuntimeException("Propiedad no encontrada con id: " + propiedadId));
                inquilino.setPropiedad(newPropiedad);
                newPropiedad.setEstado("ocupada");
                propiedadRepository.save(newPropiedad);
            }
        }

        return repository.save(inquilino);
    }

    public void delete(Long id, User user) {
        Inquilino inquilino = getById(id, user);

        // Delete associated payments first
        if (pagoRepository != null) {
            pagoRepository.deleteByInquilinoId(id);
        }

        // Delete associated contracts first
        if (contratoRepository != null) {
            contratoRepository.deleteByInquilinoId(id);
        }

        // Free up property if assigned
        if (inquilino.getPropiedad() != null) {
            Propiedad propiedad = inquilino.getPropiedad();
            propiedad.setEstado("disponible");
            propiedadRepository.save(propiedad);
        }

        repository.deleteById(id);
    }

    public List<Inquilino> getByContratoEstado(User user, String contratoEstado) {
        return repository.findByUserAndContratoEstado(user, contratoEstado);
    }

    public List<Inquilino> getWithoutProperty(User user) {
        return repository.findWithoutPropertyByUser(user);
    }

    public Page<Inquilino> search(User user, String search, Pageable pageable) {
        return repository.searchByUser(user, search, pageable);
    }

    public Long countByUser(User user) {
        return repository.countByUser(user);
    }

    public Long countActiveByUser(User user) {
        return repository.countActiveByUser(user);
    }
}
