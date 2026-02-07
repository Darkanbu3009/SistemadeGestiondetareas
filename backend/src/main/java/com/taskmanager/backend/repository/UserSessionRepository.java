package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.User;
import com.taskmanager.backend.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserOrderByFechaInicioDesc(User user);
    List<UserSession> findByUserAndActiva(User user, Boolean activa);
    void deleteByUserAndActivaFalse(User user);
}
