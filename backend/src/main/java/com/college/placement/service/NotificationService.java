package com.college.placement.service;

import com.college.placement.model.Notification;
import com.college.placement.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification create(String title, String message) {
        Notification n = new Notification();
        n.setTitle(title);
        n.setMessage(message);
        n.setReadFlag(false);
        return notificationRepository.save(n);
    }

    public List<Notification> getAll() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Notification> getUnread() {
        return notificationRepository.findByReadFlagFalseOrderByCreatedAtDesc();
    }

    public Notification markRead(Long id) {
        Notification n = notificationRepository.findById(id).orElse(null);
        if (n == null) return null;
        n.setReadFlag(true);
        return notificationRepository.save(n);
    }
}
