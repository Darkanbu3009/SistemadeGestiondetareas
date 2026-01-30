package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.Inquilino;
import com.taskmanager.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InquilinoRepository extends JpaRepository<Inquilino, Long> {

    List<Inquilino> findByUserOrderByCreatedAtDesc(User user);

    Page<Inquilino> findByUser(User user, Pageable pageable);

    Optional<Inquilino> findByIdAndUser(Long id, User user);

    boolean existsByIdAndUser(Long id, User user);

    Optional<Inquilino> findByEmailAndUser(String email, User user);

    Optional<Inquilino> findByDocumentoAndUser(String documento, User user);

    List<Inquilino> findByUserAndContratoEstado(User user, String contratoEstado);

    List<Inquilino> findByPropiedadId(Long propiedadId);

    @Query("SELECT COUNT(i) FROM Inquilino i WHERE i.user = :user")
    Long countByUser(@Param("user") User user);

    @Query("SELECT COUNT(i) FROM Inquilino i WHERE i.user = :user AND i.contratoEstado = 'activo'")
    Long countActiveByUser(@Param("user") User user);

    @Query("SELECT i FROM Inquilino i WHERE i.user = :user AND " +
           "(LOWER(i.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.apellido) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.telefono) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Inquilino> searchByUser(@Param("user") User user, @Param("search") String search, Pageable pageable);

    @Query("SELECT i FROM Inquilino i WHERE i.user = :user AND i.propiedad IS NULL")
    List<Inquilino> findWithoutPropertyByUser(@Param("user") User user);
}
