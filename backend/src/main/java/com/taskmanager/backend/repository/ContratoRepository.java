package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.Contrato;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.model.Inquilino;
import com.taskmanager.backend.model.Propiedad;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {

    List<Contrato> findByUserOrderByCreatedAtDesc(User user);

    Page<Contrato> findByUser(User user, Pageable pageable);

    Optional<Contrato> findByIdAndUser(Long id, User user);

    boolean existsByIdAndUser(Long id, User user);

    List<Contrato> findByUserAndEstado(User user, String estado);

    List<Contrato> findByInquilinoAndUser(Inquilino inquilino, User user);

    List<Contrato> findByPropiedadAndUser(Propiedad propiedad, User user);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.user = :user")
    Long countByUser(@Param("user") User user);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.user = :user AND c.estado = :estado")
    Long countByUserAndEstado(@Param("user") User user, @Param("estado") String estado);

    // Get contracts about to expire (within 30 days)
    @Query("SELECT c FROM Contrato c WHERE c.user = :user AND c.estado = 'activo' " +
           "AND c.fechaFin BETWEEN :today AND :futureDate ORDER BY c.fechaFin ASC")
    List<Contrato> findProximosAVencer(@Param("user") User user,
                                        @Param("today") LocalDate today,
                                        @Param("futureDate") LocalDate futureDate);

    // Get active contract for a specific property
    @Query("SELECT c FROM Contrato c WHERE c.propiedad = :propiedad AND c.user = :user " +
           "AND c.estado IN ('activo', 'por_vencer') ORDER BY c.fechaFin DESC")
    Optional<Contrato> findActiveByPropiedadAndUser(@Param("propiedad") Propiedad propiedad,
                                                     @Param("user") User user);

    // Get active contract for a specific tenant
    @Query("SELECT c FROM Contrato c WHERE c.inquilino = :inquilino AND c.user = :user " +
           "AND c.estado IN ('activo', 'por_vencer') ORDER BY c.fechaFin DESC")
    Optional<Contrato> findActiveByInquilinoAndUser(@Param("inquilino") Inquilino inquilino,
                                                     @Param("user") User user);

    // Search contracts
    @Query("SELECT c FROM Contrato c JOIN c.inquilino i JOIN c.propiedad p WHERE c.user = :user AND " +
           "(LOWER(i.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.apellido) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.nombre) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Contrato> searchByUser(@Param("user") User user, @Param("search") String search, Pageable pageable);

    // Check for overlapping contracts on a property
    @Query("SELECT c FROM Contrato c WHERE c.propiedad = :propiedad AND c.user = :user " +
           "AND c.estado != 'finalizado' AND " +
           "((c.fechaInicio BETWEEN :startDate AND :endDate) OR " +
           "(c.fechaFin BETWEEN :startDate AND :endDate) OR " +
           "(c.fechaInicio <= :startDate AND c.fechaFin >= :endDate))")
    List<Contrato> findOverlappingContracts(@Param("propiedad") Propiedad propiedad,
                                             @Param("user") User user,
                                             @Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    // DELETE methods for cascade deletion
    @Modifying
    @Transactional
    @Query("DELETE FROM Contrato c WHERE c.inquilino.id = :inquilinoId")
    void deleteByInquilinoId(@Param("inquilinoId") Long inquilinoId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Contrato c WHERE c.propiedad.id = :propiedadId")
    void deleteByPropiedadId(@Param("propiedadId") Long propiedadId);
}
