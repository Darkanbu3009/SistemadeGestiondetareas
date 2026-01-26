package com.taskmanager.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private boolean completed;

    @Column(name = "progress", nullable = false, columnDefinition = "integer default 0")
    private int progress = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    public Task() {}

    public Task(String title, boolean completed) {
        this.title = title;
        this.completed = completed;
        this.progress = 0;
    }

    public Task(String title, boolean completed, User user) {
        this.title = title;
        this.completed = completed;
        this.user = user;
        this.progress = 0;
    }

    public Task(String title, boolean completed, int progress, User user) {
        this.title = title;
        this.completed = completed;
        this.progress = progress;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = Math.max(0, Math.min(100, progress));
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
