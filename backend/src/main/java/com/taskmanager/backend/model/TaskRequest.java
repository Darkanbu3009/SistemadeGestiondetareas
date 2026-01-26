package com.taskmanager.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class TaskRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private Boolean completed;

    @Min(value = 0, message = "Progress must be at least 0")
    @Max(value = 100, message = "Progress must be at most 100")
    private Integer progress;

    public TaskRequest() {
    }

    public TaskRequest(String title) {
        this.title = title;
        this.completed = false;
        this.progress = 0;
    }

    public TaskRequest(String title, Boolean completed, Integer progress) {
        this.title = title;
        this.completed = completed;
        this.progress = progress;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }
}
