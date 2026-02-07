package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.User;
import com.taskmanager.backend.model.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {
    Optional<UserPreference> findByUser(User user);
}
