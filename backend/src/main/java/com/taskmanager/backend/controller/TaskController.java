package com.taskmanager.backend.controller;

import com.taskmanager.backend.model.Task;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.UserRepository;
import com.taskmanager.backend.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService service;
    private final UserRepository userRepository;

    public TaskController(TaskService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public List<Task> getTasks() {
        User user = getCurrentUser();
        return service.getAllTasksByUser(user);
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        User user = getCurrentUser();
        Task created = service.createTask(task, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> toggleTask(@PathVariable Long id) {
        User user = getCurrentUser();
        Task updated = service.toggleTask(id, user);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable Long id) {
        User user = getCurrentUser();
        service.deleteTask(id, user);
    }
}
