package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.Propiedad;
import com.taskmanager.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PropiedadRepository extends JpaRepository<Propiedad, Long> {

    List<Propiedad> findByUserOrderByCreatedAtDesc(User user);

    Page<Propiedad> findByUser(User user, Pageable pageable);

    Optional<Propiedad> findByIdAndUser(Long id, User user);

    boolean existsByIdAndUser(Long id, User user);

    List<Propiedad> findByUserAndEstado(User user, String estado);

    @Query("SELECT COUNT(p) FROM Propiedad p WHERE p.user = :user")
    Long countByUser(@Param("user") User user);

    @Query("SELECT COUNT(p) FROM Propiedad p WHERE p.user = :user AND p.estado = :estado")
    Long countByUserAndEstado(@Param("user") User user, @Param("estado") String estado);

    @Query("SELECT p FROM Propiedad p WHERE p.user = :user AND " +
           "(LOWER(p.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.direccion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.ciudad) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Propiedad> searchByUser(@Param("user") User user, @Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM Propiedad p WHERE p.user = :user AND p.estado = 'disponible'")
    List<Propiedad> findDisponiblesByUser(@Param("user") User user);
}
