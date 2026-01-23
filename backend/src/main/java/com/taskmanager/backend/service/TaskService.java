package com.taskmanager.backend.service;

import com.taskmanager.backend.exception.TaskNotFoundException;
import com.taskmanager.backend.model.Task;
import com.taskmanager.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository repository;

    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    public List<Task> getAllTasks() {
        return repository.findAll();
    }

    public Task createTask(Task task) {
        task.setCompleted(false);
        return repository.save(task);
    }

    public Task toggleTask(Long id) {
        Task task = repository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));

        task.setCompleted(!task.isCompleted());
        return repository.save(task);
    }

    public void deleteTask(Long id) {
        if (!repository.existsById(id)) {
            throw new TaskNotFoundException(id);
        }
        repository.deleteById(id);
    }
}