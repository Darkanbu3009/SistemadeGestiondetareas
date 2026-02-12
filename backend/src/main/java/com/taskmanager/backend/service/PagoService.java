package com.taskmanager.backend.service;

import com.taskmanager.backend.model.Pago;
import com.taskmanager.backend.model.Inquilino;
import com.taskmanager.backend.model.Propiedad;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.PagoRepository;
import com.taskmanager.backend.repository.InquilinoRepository;
import com.taskmanager.backend.repository.PropiedadRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PagoService {

    private final PagoRepository repository;
    private final InquilinoRepository inquilinoRepository;
    private final PropiedadRepository propiedadRepository;

    public PagoService(PagoRepository repository, InquilinoRepository inquilinoRepository,
                       PropiedadRepository propiedadRepository) {
        this.repository = repository;
        this.inquilinoRepository = inquilinoRepository;
        this.propiedadRepository = propiedadRepository;
    }

    public List<Pago> getAllByUser(User user) {
        return repository.findByUserOrderByCreatedAtDesc(user);
    }

    public Page<Pago> getAllByUserPaginated(User user, Pageable pageable) {
        return repository.findByUser(user, pageable);
    }

    public Pago getById(Long id, User user) {
        return repository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado con id: " + id));
    }

    public Pago create(Long inquilinoId, Long propiedadId, Pago pago, User user) {
        Inquilino inquilino = inquilinoRepository.findByIdAndUser(inquilinoId, user)
                .orElseThrow(() -> new RuntimeException("Inquilino no encontrado con id: " + inquilinoId));

        Propiedad propiedad = propiedadRepository.findByIdAndUser(propiedadId, user)
                .orElseThrow(() -> new RuntimeException("Propiedad no encontrada con id: " + propiedadId));

        pago.setInquilino(inquilino);
        pago.setPropiedad(propiedad);
        pago.setUser(user);

        // Auto-set estado based on dates if not explicitly set
        if (pago.getEstado() == null || pago.getEstado().isEmpty()) {
            if (pago.getFechaPago() != null) {
                pago.setEstado("pagado");
            } else if (pago.getFechaVencimiento() != null && LocalDate.now().isAfter(pago.getFechaVencimiento())) {
                pago.setEstado("atrasado");
            } else {
                pago.setEstado("pendiente");
            }
        }

        return repository.save(pago);
    }

    public Pago update(Long id, Pago pagoDetails, User user) {
        Pago pago = getById(id, user);

        if (pagoDetails.getMonto() != null) {
            pago.setMonto(pagoDetails.getMonto());
        }
        if (pagoDetails.getFechaVencimiento() != null) {
            pago.setFechaVencimiento(pagoDetails.getFechaVencimiento());
        }
        if (pagoDetails.getComprobante() != null) {
            pago.setComprobante(pagoDetails.getComprobante());
        }
        
        // Actualizar estado
        if (pagoDetails.getEstado() != null && !pagoDetails.getEstado().isEmpty()) {
            pago.setEstado(pagoDetails.getEstado());
            
            // Si el estado es "pagado" y no tiene fecha de pago, asignar la fecha actual
            if ("pagado".equals(pagoDetails.getEstado()) && pago.getFechaPago() == null) {
                pago.setFechaPago(LocalDate.now());
            }
            
            // Si el estado no es "pagado", limpiar la fecha de pago
            if (!"pagado".equals(pagoDetails.getEstado())) {
                pago.setFechaPago(null);
            }
        }
        
        // Si se proporciona fecha de pago explícitamente, usarla
        if (pagoDetails.getFechaPago() != null) {
            pago.setFechaPago(pagoDetails.getFechaPago());
            pago.setEstado("pagado");
        }

        return repository.save(pago);
    }

    public Pago registrarPago(Long id, LocalDate fechaPago, String comprobante, User user) {
        Pago pago = getById(id, user);
        pago.setFechaPago(fechaPago != null ? fechaPago : LocalDate.now());
        pago.setEstado("pagado");
        if (comprobante != null) {
            pago.setComprobante(comprobante);
        }
        return repository.save(pago);
    }

    public void delete(Long id, User user) {
        if (!repository.existsByIdAndUser(id, user)) {
            throw new RuntimeException("Pago no encontrado con id: " + id);
        }
        repository.deleteById(id);
    }

    public List<Pago> getByEstado(User user, String estado) {
        return repository.findByUserAndEstado(user, estado);
    }

    public List<Pago> getAtrasados(User user) {
        return repository.findAtrasadosByUser(user);
    }

    public List<Pago> getAtrasados(User user, int month, int year) {
        return repository.findAtrasadosByUserAndMonth(user, month, year);
    }

    public List<Pago> getByInquilino(Inquilino inquilino, User user) {
        return repository.findByInquilinoAndUser(inquilino, user);
    }

    public List<Pago> getByPropiedad(Propiedad propiedad, User user) {
        return repository.findByPropiedadAndUser(propiedad, user);
    }

    public List<Pago> getByDateRange(User user, LocalDate startDate, LocalDate endDate) {
        return repository.findByUserAndDateRange(user, startDate, endDate);
    }

    public Page<Pago> search(User user, String search, Pageable pageable) {
        return repository.searchByUser(user, search, pageable);
    }

    public Long countByUser(User user) {
        return repository.countByUser(user);
    }

    public Long countByUserAndEstado(User user, String estado) {
        return repository.countByUserAndEstado(user, estado);
    }

    public Long countMorosos(User user) {
        return repository.countMorososByUser(user);
    }

    public Long countMorosos(User user, int month, int year) {
        return repository.countMorososByUserAndMonth(user, month, year);
    }

    public BigDecimal sumIngresosMes(User user, int month, int year) {
        return repository.sumPagadosByUserAndMonth(user, month, year);
    }

    public BigDecimal sumPendientes(User user) {
        return repository.sumPendientesByUser(user);
    }

    public BigDecimal sumPendientes(User user, int month, int year) {
        return repository.sumPendientesByUserAndMonth(user, month, year);
    }

    public Long countPropiedadesByMonth(User user, int month, int year) {
        return repository.countDistinctPropiedadesByUserAndMonth(user, month, year);
    }

    public Long countInquilinosByMonth(User user, int month, int year) {
        return repository.countDistinctInquilinosByUserAndMonth(user, month, year);
    }
}
