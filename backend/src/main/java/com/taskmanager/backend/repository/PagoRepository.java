package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.Pago;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findByUserOrderByCreatedAtDesc(User user);

    Page<Pago> findByUser(User user, Pageable pageable);

    Optional<Pago> findByIdAndUser(Long id, User user);

    boolean existsByIdAndUser(Long id, User user);

    List<Pago> findByUserAndEstado(User user, String estado);

    List<Pago> findByInquilinoAndUser(Inquilino inquilino, User user);

    List<Pago> findByPropiedadAndUser(Propiedad propiedad, User user);

    @Query("SELECT COUNT(p) FROM Pago p WHERE p.user = :user")
    Long countByUser(@Param("user") User user);

    @Query("SELECT COUNT(p) FROM Pago p WHERE p.user = :user AND p.estado = :estado")
    Long countByUserAndEstado(@Param("user") User user, @Param("estado") String estado);

    // Sum of payments in a given month
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.user = :user AND p.estado = 'pagado' " +
           "AND MONTH(p.fechaPago) = :month AND YEAR(p.fechaPago) = :year")
    BigDecimal sumPagadosByUserAndMonth(@Param("user") User user, @Param("month") int month, @Param("year") int year);

    // Sum of pending payments
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.user = :user AND p.estado IN ('pendiente', 'atrasado')")
    BigDecimal sumPendientesByUser(@Param("user") User user);

    // Sum of pending payments filtered by month/year
    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.user = :user AND p.estado IN ('pendiente', 'atrasado') " +
           "AND MONTH(p.fechaVencimiento) = :month AND YEAR(p.fechaVencimiento) = :year")
    BigDecimal sumPendientesByUserAndMonth(@Param("user") User user, @Param("month") int month, @Param("year") int year);

    // Get overdue payments (morosos)
    @Query("SELECT p FROM Pago p WHERE p.user = :user AND p.estado = 'atrasado' ORDER BY p.fechaVencimiento ASC")
    List<Pago> findAtrasadosByUser(@Param("user") User user);

    // Get overdue payments filtered by month/year
    @Query("SELECT p FROM Pago p WHERE p.user = :user AND p.estado = 'atrasado' " +
           "AND MONTH(p.fechaVencimiento) = :month AND YEAR(p.fechaVencimiento) = :year ORDER BY p.fechaVencimiento ASC")
    List<Pago> findAtrasadosByUserAndMonth(@Param("user") User user, @Param("month") int month, @Param("year") int year);

    // Count distinct tenants with overdue payments
    @Query("SELECT COUNT(DISTINCT p.inquilino) FROM Pago p WHERE p.user = :user AND p.estado = 'atrasado'")
    Long countMorososByUser(@Param("user") User user);

    // Count distinct tenants with overdue payments filtered by month/year
    @Query("SELECT COUNT(DISTINCT p.inquilino) FROM Pago p WHERE p.user = :user AND p.estado = 'atrasado' " +
           "AND MONTH(p.fechaVencimiento) = :month AND YEAR(p.fechaVencimiento) = :year")
    Long countMorososByUserAndMonth(@Param("user") User user, @Param("month") int month, @Param("year") int year);

    // Get payments by date range
    @Query("SELECT p FROM Pago p WHERE p.user = :user AND p.fechaVencimiento BETWEEN :startDate AND :endDate")
    List<Pago> findByUserAndDateRange(@Param("user") User user,
                                       @Param("startDate") LocalDate startDate,
                                       @Param("endDate") LocalDate endDate);

    // Search payments
    @Query("SELECT p FROM Pago p JOIN p.inquilino i WHERE p.user = :user AND " +
           "(LOWER(i.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.apellido) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Pago> searchByUser(@Param("user") User user, @Param("search") String search, Pageable pageable);

    // Count distinct properties with payments in a given month/year
    @Query("SELECT COUNT(DISTINCT p.propiedad) FROM Pago p WHERE p.user = :user " +
           "AND MONTH(p.fechaVencimiento) = :month AND YEAR(p.fechaVencimiento) = :year")
    Long countDistinctPropiedadesByUserAndMonth(@Param("user") User user, @Param("month") int month, @Param("year") int year);

    // Count distinct tenants with payments in a given month/year
    @Query("SELECT COUNT(DISTINCT p.inquilino) FROM Pago p WHERE p.user = :user " +
           "AND MONTH(p.fechaVencimiento) = :month AND YEAR(p.fechaVencimiento) = :year")
    Long countDistinctInquilinosByUserAndMonth(@Param("user") User user, @Param("month") int month, @Param("year") int year);

    // DELETE methods for cascade deletion
    @Modifying
    @Transactional
    @Query("DELETE FROM Pago p WHERE p.inquilino.id = :inquilinoId")
    void deleteByInquilinoId(@Param("inquilinoId") Long inquilinoId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Pago p WHERE p.propiedad.id = :propiedadId")
    void deleteByPropiedadId(@Param("propiedadId") Long propiedadId);
}
