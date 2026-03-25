package com.college.placement.controller;

import com.college.placement.model.SystemSettings;
import com.college.placement.service.SystemSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings")
public class SystemSettingsController {

    private final SystemSettingsService settingsService;

    public SystemSettingsController(SystemSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public SystemSettings getSettings() {
        return settingsService.getSettings();
    }

    @PutMapping
    public ResponseEntity<SystemSettings> updateSettings(@RequestBody SystemSettings settings) {
        return ResponseEntity.ok(settingsService.updateSettings(settings));
    }
}
