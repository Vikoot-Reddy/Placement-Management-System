package com.college.placement.controller;

import com.college.placement.model.Notification;
import com.college.placement.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Notification> getAll() {
        return notificationService.getAll();
    }

    @GetMapping("/unread")
    public List<Notification> getUnread() {
        return notificationService.getUnread();
    }

    @PostMapping("/mark-read/{id}")
    public ResponseEntity<Notification> markRead(@PathVariable Long id) {
        Notification n = notificationService.markRead(id);
        if (n == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(n);
    }
}
