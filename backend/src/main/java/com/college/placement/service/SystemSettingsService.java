package com.college.placement.service;

import com.college.placement.model.SystemSettings;
import com.college.placement.repository.SystemSettingsRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class SystemSettingsService {

    private final SystemSettingsRepository settingsRepository;

    public SystemSettingsService(SystemSettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    public SystemSettings getSettings() {
        return settingsRepository.findAll().stream().findFirst().orElseGet(this::createDefaults);
    }

    public SystemSettings updateSettings(SystemSettings incoming) {
        SystemSettings existing = getSettings();
        existing.setDefaultMinCgpa(incoming.getDefaultMinCgpa());
        existing.setAllowedBranches(incoming.getAllowedBranches());
        existing.setOneStudentOneCompany(incoming.isOneStudentOneCompany());
        existing.setAiPredictionEnabled(incoming.isAiPredictionEnabled());
        existing.setAiRecommendationEnabled(incoming.isAiRecommendationEnabled());
        existing.setAiResumeEnabled(incoming.isAiResumeEnabled());
        existing.setAiQueryEnabled(incoming.isAiQueryEnabled());
        existing.setAiInsightsEnabled(incoming.isAiInsightsEnabled());
        existing.setTheme(incoming.getTheme());
        existing.setUpdatedAt(LocalDateTime.now());
        return settingsRepository.save(existing);
    }

    public boolean isBranchAllowed(String branch) {
        SystemSettings settings = getSettings();
        if (settings.getAllowedBranches() == null || settings.getAllowedBranches().isBlank()) {
            return true;
        }
        String[] parts = settings.getAllowedBranches().split(",");
        for (String p : parts) {
            if (p.trim().equalsIgnoreCase(branch)) {
                return true;
            }
        }
        return false;
    }

    private SystemSettings createDefaults() {
        SystemSettings settings = new SystemSettings();
        return settingsRepository.save(settings);
    }
}
