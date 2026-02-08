package com.taskmanager.backend.service;

import com.taskmanager.backend.dto.ChangePasswordRequest;
import com.taskmanager.backend.dto.SubscriptionRequest;
import com.taskmanager.backend.dto.UserPreferenceRequest;
import com.taskmanager.backend.dto.UserProfileRequest;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.model.UserPreference;
import com.taskmanager.backend.model.UserSession;
import com.taskmanager.backend.model.UserSubscription;
import com.taskmanager.backend.model.BillingHistory;
import com.taskmanager.backend.repository.BillingHistoryRepository;
import com.taskmanager.backend.repository.UserPreferenceRepository;
import com.taskmanager.backend.repository.UserRepository;
import com.taskmanager.backend.repository.UserSessionRepository;
import com.taskmanager.backend.repository.UserSubscriptionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final UserSessionRepository sessionRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final BillingHistoryRepository billingHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileService(
            UserRepository userRepository,
            UserPreferenceRepository preferenceRepository,
            UserSessionRepository sessionRepository,
            UserSubscriptionRepository subscriptionRepository,
            BillingHistoryRepository billingHistoryRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.sessionRepository = sessionRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.billingHistoryRepository = billingHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ---- Profile ----
    public User getProfile(User user) {
        return user;
    }

    public User updateProfile(User user, UserProfileRequest request) {
        if (request.getName() != null) user.setName(request.getName());
        if (request.getApellido() != null) user.setApellido(request.getApellido());
        if (request.getTelefono() != null) user.setTelefono(request.getTelefono());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
        return userRepository.save(user);
    }

    public User removeAvatar(User user) {
        user.setAvatar(null);
        return userRepository.save(user);
    }

    // ---- Password ----
    public void changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ---- Preferences ----
    public UserPreference getPreferences(User user) {
        return preferenceRepository.findByUser(user)
                .orElseGet(() -> {
                    UserPreference pref = new UserPreference();
                    pref.setUser(user);
                    return preferenceRepository.save(pref);
                });
    }

    public UserPreference updatePreferences(User user, UserPreferenceRequest request) {
        UserPreference pref = getPreferences(user);
        if (request.getIdioma() != null) pref.setIdioma(request.getIdioma());
        if (request.getZonaHoraria() != null) pref.setZonaHoraria(request.getZonaHoraria());
        if (request.getNotificacionesCorreo() != null) pref.setNotificacionesCorreo(request.getNotificacionesCorreo());
        if (request.getNotificacionesSistema() != null) pref.setNotificacionesSistema(request.getNotificacionesSistema());
        if (request.getElementosPorPagina() != null) pref.setElementosPorPagina(request.getElementosPorPagina());
        if (request.getRecordatoriosPagos() != null) pref.setRecordatoriosPagos(request.getRecordatoriosPagos());
        if (request.getAvisosVencimiento() != null) pref.setAvisosVencimiento(request.getAvisosVencimiento());
        if (request.getConfirmacionesReservacion() != null) pref.setConfirmacionesReservacion(request.getConfirmacionesReservacion());
        if (request.getResumenMensual() != null) pref.setResumenMensual(request.getResumenMensual());
        return preferenceRepository.save(pref);
    }

    // ---- Sessions ----
    public List<UserSession> getSessions(User user) {
        return sessionRepository.findByUserOrderByFechaInicioDesc(user);
    }

    @Transactional
    public void closeSession(User user, Long sessionId) {
        UserSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Sesión no encontrada"));
        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("No autorizado");
        }
        session.setActiva(false);
        sessionRepository.save(session);
    }

    @Transactional
    public void closeAllOtherSessions(User user, Long currentSessionId) {
        List<UserSession> sessions = sessionRepository.findByUserAndActiva(user, true);
        for (UserSession session : sessions) {
            if (!session.getId().equals(currentSessionId)) {
                session.setActiva(false);
                sessionRepository.save(session);
            }
        }
    }

    // ---- Subscription ----
    public UserSubscription getSubscription(User user) {
        return subscriptionRepository.findByUser(user)
                .orElseGet(() -> {
                    UserSubscription sub = new UserSubscription();
                    sub.setUser(user);
                    sub.setPlan("basico");
                    sub.setEstado("activa");
                    return subscriptionRepository.save(sub);
                });
    }

    public UserSubscription updateSubscription(User user, SubscriptionRequest request) {
        UserSubscription sub = getSubscription(user);
        if (request.getPlan() != null) sub.setPlan(request.getPlan());
        if (request.getTarjetaUltimos4() != null) sub.setTarjetaUltimos4(request.getTarjetaUltimos4());
        if (request.getTarjetaExpiracion() != null) sub.setTarjetaExpiracion(request.getTarjetaExpiracion());
        if ("profesional".equals(request.getPlan()) || "empresarial".equals(request.getPlan())) {
            sub.setProximoPago(LocalDate.now().plusMonths(1));
        }
        return subscriptionRepository.save(sub);
    }

    public UserSubscription cancelSubscription(User user) {
        UserSubscription sub = getSubscription(user);
        sub.setPlan("basico");
        sub.setEstado("cancelada");
        sub.setProximoPago(null);
        return subscriptionRepository.save(sub);
    }

    // ---- Billing History ----
    public Page<BillingHistory> getBillingHistory(User user, String search, LocalDate after, Pageable pageable) {
        if (search != null && !search.isEmpty() && after != null) {
            return billingHistoryRepository.searchByUserAndDateAfter(user, search, after, pageable);
        } else if (search != null && !search.isEmpty()) {
            return billingHistoryRepository.searchByUser(user, search, pageable);
        } else if (after != null) {
            return billingHistoryRepository.findByUserAndFechaAfterOrderByFechaDesc(user, after, pageable);
        }
        return billingHistoryRepository.findByUserOrderByFechaDesc(user, pageable);
    }

    public long countBillingHistory(User user) {
        return billingHistoryRepository.countByUser(user);
    }

    // ---- Account ----
    @Transactional
    public void deleteAccount(User user) {
        preferenceRepository.findByUser(user).ifPresent(preferenceRepository::delete);
        subscriptionRepository.findByUser(user).ifPresent(subscriptionRepository::delete);
        sessionRepository.findByUserOrderByFechaInicioDesc(user).forEach(sessionRepository::delete);
        billingHistoryRepository.deleteByUser(user);
        userRepository.delete(user);
    }
}
