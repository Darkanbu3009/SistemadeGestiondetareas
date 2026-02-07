package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.User;
import com.taskmanager.backend.model.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    Optional<UserSubscription> findByUser(User user);
}
