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
import java.util.Arrays;
import java.util.List;

@Service
@Transactional
public class ContratoService {

    private final ContratoRepository repository;
    private final InquilinoRepository inquilinoRepository;
    private final PropiedadRepository propiedadRepository;

    private static final List<String> VALID_ESTADOS = Arrays.asList(
        "sin_firmar", "en_proceso", "firmado", "activo", "por_vencer", "finalizado"
    );

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

    public Page<Contrato> getByEstadoPaginated(User user, String estado, Pageable pageable) {
        return repository.findByUserAndEstado(user, estado, pageable);
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

        List<Contrato> overlapping = repository.findOverlappingContracts(
                propiedad, user, contrato.getFechaInicio(), contrato.getFechaFin());
        if (!overlapping.isEmpty()) {
            throw new RuntimeException("Ya existe un contrato activo para esta propiedad en las fechas especificadas");
        }

        contrato.setInquilino(inquilino);
        contrato.setPropiedad(propiedad);
        contrato.setUser(user);

        String estado = contrato.getEstado();
        if (estado == null || estado.isEmpty()) {
            estado = "sin_firmar";
        }
        if (!VALID_ESTADOS.contains(estado)) {
            throw new RuntimeException("Estado inválido: " + estado);
        }
        contrato.setEstado(estado);

        // Sincronizar estado con inquilino
        syncInquilinoContratoEstado(inquilino, contrato);
        inquilino.setContratoFin(contrato.getFechaFin());
        inquilino.setPropiedad(propiedad);
        inquilinoRepository.save(inquilino);

        updatePropiedadEstado(propiedad, estado);
        propiedadRepository.save(propiedad);

        return repository.save(contrato);
    }

    public Contrato update(Long id, Contrato contratoDetails, Long inquilinoId, Long propiedadId, User user) {
        Contrato contrato = getById(id, user);

        if (inquilinoId != null && !inquilinoId.equals(contrato.getInquilino().getId())) {
            Inquilino oldInquilino = contrato.getInquilino();
            oldInquilino.setContratoEstado("sin_contrato");
            oldInquilino.setContratoFin(null);
            inquilinoRepository.save(oldInquilino);

            Inquilino newInquilino = inquilinoRepository.findByIdAndUser(inquilinoId, user)
                    .orElseThrow(() -> new RuntimeException("Inquilino no encontrado con id: " + inquilinoId));
            contrato.setInquilino(newInquilino);
        }

        if (propiedadId != null && !propiedadId.equals(contrato.getPropiedad().getId())) {
            Propiedad oldPropiedad = contrato.getPropiedad();
            oldPropiedad.setEstado("disponible");
            propiedadRepository.save(oldPropiedad);

            Propiedad newPropiedad = propiedadRepository.findByIdAndUser(propiedadId, user)
                    .orElseThrow(() -> new RuntimeException("Propiedad no encontrada con id: " + propiedadId));
            contrato.setPropiedad(newPropiedad);
            
            updatePropiedadEstado(newPropiedad, contrato.getEstado());
            propiedadRepository.save(newPropiedad);
        }

        if (contratoDetails.getFechaInicio() != null) {
            contrato.setFechaInicio(contratoDetails.getFechaInicio());
        }
        if (contratoDetails.getFechaFin() != null) {
            contrato.setFechaFin(contratoDetails.getFechaFin());
            if (contrato.getInquilino() != null) {
                contrato.getInquilino().setContratoFin(contratoDetails.getFechaFin());
            }
        }
        if (contratoDetails.getRentaMensual() != null) {
            contrato.setRentaMensual(contratoDetails.getRentaMensual());
        }
        if (contratoDetails.getPdfUrl() != null) {
            contrato.setPdfUrl(contratoDetails.getPdfUrl());
        }

        if (contratoDetails.getEstado() != null && !contratoDetails.getEstado().isEmpty()) {
            String newEstado = contratoDetails.getEstado();
            if (!VALID_ESTADOS.contains(newEstado)) {
                throw new RuntimeException("Estado inválido: " + newEstado);
            }
            contrato.setEstado(newEstado);
            
            syncInquilinoContratoEstado(contrato.getInquilino(), contrato);
            
            updatePropiedadEstado(contrato.getPropiedad(), newEstado);
            propiedadRepository.save(contrato.getPropiedad());
        }

        inquilinoRepository.save(contrato.getInquilino());

        return repository.save(contrato);
    }

    public Contrato update(Long id, Contrato contratoDetails, User user) {
        Contrato existing = getById(id, user);
        return update(id, contratoDetails, existing.getInquilino().getId(), existing.getPropiedad().getId(), user);
    }

    public Contrato updateEstado(Long id, String estado, User user) {
        Contrato contrato = getById(id, user);
        
        if (!VALID_ESTADOS.contains(estado)) {
            throw new RuntimeException("Estado inválido: " + estado);
        }

        contrato.setEstado(estado);

        Inquilino inquilino = contrato.getInquilino();
        if (inquilino != null) {
            syncInquilinoContratoEstado(inquilino, contrato);
            inquilinoRepository.save(inquilino);
        }

        Propiedad propiedad = contrato.getPropiedad();
        if (propiedad != null) {
            updatePropiedadEstado(propiedad, estado);
            propiedadRepository.save(propiedad);
        }

        return repository.save(contrato);
    }

    public Contrato updatePdfUrl(Long id, String pdfUrl, User user) {
        Contrato contrato = getById(id, user);
        contrato.setPdfUrl(pdfUrl);
        return repository.save(contrato);
    }

    public Contrato firmar(Long id, User user) {
        return updateEstado(id, "firmado", user);
    }

    public Contrato finalizar(Long id, User user) {
        Contrato contrato = getById(id, user);
        contrato.setEstado("finalizado");

        Inquilino inquilino = contrato.getInquilino();
        if (inquilino != null) {
            inquilino.setContratoEstado("finalizado");
            inquilino.setPropiedad(null);
            inquilinoRepository.save(inquilino);
        }

        Propiedad propiedad = contrato.getPropiedad();
        if (propiedad != null) {
            propiedad.setEstado("disponible");
            propiedadRepository.save(propiedad);
        }

        return repository.save(contrato);
    }

    public void delete(Long id, User user) {
        Contrato contrato = getById(id, user);

        String estado = contrato.getEstado();
        if ("activo".equals(estado) || "por_vencer".equals(estado) || 
            "firmado".equals(estado) || "en_proceso".equals(estado)) {
            Inquilino inquilino = contrato.getInquilino();
            if (inquilino != null) {
                inquilino.setContratoEstado("sin_contrato");
                inquilino.setContratoFin(null);
                inquilino.setPropiedad(null);
                inquilinoRepository.save(inquilino);
            }

            Propiedad propiedad = contrato.getPropiedad();
            if (propiedad != null) {
                propiedad.setEstado("disponible");
                propiedadRepository.save(propiedad);
            }
        }

        repository.deleteById(id);
    }

    public List<Contrato> getByEstado(User user, String estado) {
        return repository.findByUserAndEstadoList(user, estado);
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

    /**
     * Sincroniza el estado del contrato con el campo contrato_estado del inquilino
     */
    private void syncInquilinoContratoEstado(Inquilino inquilino, Contrato contrato) {
        if (inquilino == null || contrato == null) {
            return;
        }

        String contratoEstado = contrato.getEstado();
        String inquilinoEstado;

        switch (contratoEstado) {
            case "sin_firmar":
            case "en_proceso":
                inquilinoEstado = "en_proceso";
                break;
            case "firmado":
            case "activo":
            case "por_vencer":
                inquilinoEstado = "activo";
                break;
            case "finalizado":
                inquilinoEstado = "finalizado";
                break;
            default:
                inquilinoEstado = "sin_contrato";
        }

        inquilino.setContratoEstado(inquilinoEstado);
    }

    /**
     * Actualiza el estado de la propiedad según el estado del contrato
     */
    private void updatePropiedadEstado(Propiedad propiedad, String contratoEstado) {
        if (propiedad == null) {
            return;
        }

        switch (contratoEstado) {
            case "finalizado":
                propiedad.setEstado("disponible");
                break;
            case "sin_firmar":
            case "en_proceso":
                propiedad.setEstado("reservada");
                break;
            case "firmado":
            case "activo":
            case "por_vencer":
                propiedad.setEstado("ocupada");
                break;
            default:
                break;
        }
    }
}
