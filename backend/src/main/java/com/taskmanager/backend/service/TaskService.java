package com.taskmanager.backend.service;

import com.taskmanager.backend.exception.TaskNotFoundException;
import com.taskmanager.backend.model.Task;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository repository;

    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    public List<Task> getAllTasksByUser(User user) {
        return repository.findByUserOrderByIdDesc(user);
    }

    public Task createTask(Task task, User user) {
        task.setCompleted(false);
        task.setUser(user);
        return repository.save(task);
    }

    public Task toggleTask(Long id, User user) {
        Task task = repository.findByIdAndUser(id, user)
                .orElseThrow(() -> new TaskNotFoundException(id));

        task.setCompleted(!task.isCompleted());
        return repository.save(task);
    }

    public void deleteTask(Long id, User user) {
        if (!repository.existsByIdAndUser(id, user)) {
            throw new TaskNotFoundException(id);
        }
        repository.deleteById(id);
    }
}
