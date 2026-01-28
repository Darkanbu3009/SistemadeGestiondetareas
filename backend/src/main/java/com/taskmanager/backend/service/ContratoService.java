package com.taskmanager.backend.service;

import com.taskmanager.backend.model.Contrato;
import com.taskmanager.backend.model.Inquilino;
import com.taskmanager.backend.model.Propiedad;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.ContratoRepository;
import com.taskmanager.backend.repository.InquilinoRepository;
import com.taskmanager.backend.repository.PropiedadRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class ContratoService {

    private final ContratoRepository repository;
    private final InquilinoRepository inquilinoRepository;
    private final PropiedadRepository propiedadRepository;

    public ContratoService(ContratoRepository repository, InquilinoRepository inquilinoRepository,
                           PropiedadRepository propiedadRepository) {
        this.repository = repository;
        this.inquilinoRepository = inquilinoRepository;
        this.propiedadRepository = propiedadRepository;
    }

    public List<Contrato> getAllByUser(User user) {
        return repository.findByUserOrderByCreatedAtDesc(user);
    }

    public Page<Contrato> getAllByUserPaginated(User user, Pageable pageable) {
        return repository.findByUser(user, pageable);
    }

    public Contrato getById(Long id, User user) {
        return repository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Contrato no encontrado con id: " + id));
    }

    public Contrato create(Long inquilinoId, Long propiedadId, Contrato contrato, User user) {
        Inquilino inquilino = inquilinoRepository.findByIdAndUser(inquilinoId, user)
                .orElseThrow(() -> new RuntimeException("Inquilino no encontrado con id: " + inquilinoId));

        Propiedad propiedad = propiedadRepository.findByIdAndUser(propiedadId, user)
                .orElseThrow(() -> new RuntimeException("Propiedad no encontrada con id: " + propiedadId));

        // Check for overlapping contracts
        List<Contrato> overlapping = repository.findOverlappingContracts(
                propiedad, user, contrato.getFechaInicio(), contrato.getFechaFin());
        if (!overlapping.isEmpty()) {
            throw new RuntimeException("Ya existe un contrato activo para esta propiedad en las fechas especificadas");
        }

        contrato.setInquilino(inquilino);
        contrato.setPropiedad(propiedad);
        contrato.setUser(user);

        // Update tenant's contract status and property
        inquilino.setContratoEstado("activo");
        inquilino.setContratoFin(contrato.getFechaFin());
        inquilino.setPropiedad(propiedad);
        inquilinoRepository.save(inquilino);

        // Update property status
        propiedad.setEstado("ocupada");
        propiedadRepository.save(propiedad);

        return repository.save(contrato);
    }

    public Contrato update(Long id, Contrato contratoDetails, User user) {
        Contrato contrato = getById(id, user);

        if (contratoDetails.getFechaInicio() != null) {
            contrato.setFechaInicio(contratoDetails.getFechaInicio());
        }
        if (contratoDetails.getFechaFin() != null) {
            contrato.setFechaFin(contratoDetails.getFechaFin());
            // Update tenant's contract end date
            if (contrato.getInquilino() != null) {
                contrato.getInquilino().setContratoFin(contratoDetails.getFechaFin());
                inquilinoRepository.save(contrato.getInquilino());
            }
        }
        if (contratoDetails.getRentaMensual() != null) {
            contrato.setRentaMensual(contratoDetails.getRentaMensual());
        }
        if (contratoDetails.getPdfUrl() != null) {
            contrato.setPdfUrl(contratoDetails.getPdfUrl());
        }

        // Update estado
        contrato.updateEstado();

        return repository.save(contrato);
    }

    public Contrato firmar(Long id, User user) {
        Contrato contrato = getById(id, user);
        if (!"sin_firmar".equals(contrato.getEstado())) {
            throw new RuntimeException("El contrato ya ha sido firmado");
        }
        contrato.setEstado("activo");
        contrato.updateEstado(); // Will set correct status based on dates
        return repository.save(contrato);
    }

    public Contrato finalizar(Long id, User user) {
        Contrato contrato = getById(id, user);
        contrato.setEstado("finalizado");

        // Update tenant status
        Inquilino inquilino = contrato.getInquilino();
        if (inquilino != null) {
            inquilino.setContratoEstado("finalizado");
            inquilino.setPropiedad(null);
            inquilinoRepository.save(inquilino);
        }

        // Free up property
        Propiedad propiedad = contrato.getPropiedad();
        if (propiedad != null) {
            propiedad.setEstado("disponible");
            propiedadRepository.save(propiedad);
        }

        return repository.save(contrato);
    }

    public void delete(Long id, User user) {
        Contrato contrato = getById(id, user);

        // Update tenant status if contract was active
        if ("activo".equals(contrato.getEstado()) || "por_vencer".equals(contrato.getEstado())) {
            Inquilino inquilino = contrato.getInquilino();
            if (inquilino != null) {
                inquilino.setContratoEstado("sin_contrato");
                inquilino.setContratoFin(null);
                inquilino.setPropiedad(null);
                inquilinoRepository.save(inquilino);
            }

            // Free up property
            Propiedad propiedad = contrato.getPropiedad();
            if (propiedad != null) {
                propiedad.setEstado("disponible");
                propiedadRepository.save(propiedad);
            }
        }

        repository.deleteById(id);
    }

    public List<Contrato> getByEstado(User user, String estado) {
        return repository.findByUserAndEstado(user, estado);
    }

    public List<Contrato> getProximosAVencer(User user, int days) {
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(days);
        return repository.findProximosAVencer(user, today, futureDate);
    }

    public List<Contrato> getByInquilino(Inquilino inquilino, User user) {
        return repository.findByInquilinoAndUser(inquilino, user);
    }

    public List<Contrato> getByPropiedad(Propiedad propiedad, User user) {
        return repository.findByPropiedadAndUser(propiedad, user);
    }

    public Page<Contrato> search(User user, String search, Pageable pageable) {
        return repository.searchByUser(user, search, pageable);
    }

    public Long countByUser(User user) {
        return repository.countByUser(user);
    }

    public Long countByUserAndEstado(User user, String estado) {
        return repository.countByUserAndEstado(user, estado);
    }
}
