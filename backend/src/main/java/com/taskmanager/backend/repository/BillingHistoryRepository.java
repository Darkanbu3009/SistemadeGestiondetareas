package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.BillingHistory;
import com.taskmanager.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface BillingHistoryRepository extends JpaRepository<BillingHistory, Long> {

    Page<BillingHistory> findByUserOrderByFechaDesc(User user, Pageable pageable);

    Page<BillingHistory> findByUserAndFechaAfterOrderByFechaDesc(User user, LocalDate after, Pageable pageable);

    @Query("SELECT b FROM BillingHistory b WHERE b.user = :user AND " +
           "(LOWER(b.descripcion) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY b.fecha DESC")
    Page<BillingHistory> searchByUser(@Param("user") User user, @Param("search") String search, Pageable pageable);

    @Query("SELECT b FROM BillingHistory b WHERE b.user = :user AND b.fecha >= :after AND " +
           "(LOWER(b.descripcion) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY b.fecha DESC")
    Page<BillingHistory> searchByUserAndDateAfter(
            @Param("user") User user,
            @Param("search") String search,
            @Param("after") LocalDate after,
            Pageable pageable);

    long countByUser(User user);
}
