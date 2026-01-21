package com.taskmanager.backend.service;

import com.taskmanager.backend.exception.TaskNotFoundException;
import com.taskmanager.backend.model.Task;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class TaskService {

    private final List<Task> tasks = new ArrayList<>();
    private final AtomicLong idCounter = new AtomicLong(1);

    public List<Task> getAllTasks() {
        return new ArrayList<>(tasks);
    }

    public Task createTask(String title) {
        Task task = new Task();
        task.setId(idCounter.getAndIncrement());
        task.setTitle(title);
        task.setCompleted(false);
        tasks.add(task);
        return task;
    }

    public Task updateTask(Long id) {
        Task task = tasks.stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new TaskNotFoundException(id));

        task.setCompleted(!task.isCompleted());
        return task;
    }

    public void deleteTask(Long id) {
        Task task = tasks.stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new TaskNotFoundException(id));

        tasks.remove(task);
    }

    public Task getTaskById(Long id) {
        return tasks.stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new TaskNotFoundException(id));
    }
}
