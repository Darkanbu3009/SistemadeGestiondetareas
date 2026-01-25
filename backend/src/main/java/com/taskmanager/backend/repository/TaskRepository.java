package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.Task;
import com.taskmanager.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {
    
    List<Task> findByUserOrderByIdDesc(User user);
    
    Optional<Task> findByIdAndUser(Long id, User user);
    
    boolean existsByIdAndUser(Long id, User user);
}
