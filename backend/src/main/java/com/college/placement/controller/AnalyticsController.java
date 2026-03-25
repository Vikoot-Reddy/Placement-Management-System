package com.college.placement.controller;

import com.college.placement.service.AnalyticsService;
import com.college.placement.service.SystemSettingsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final SystemSettingsService settingsService;

    public AnalyticsController(AnalyticsService analyticsService,
                               SystemSettingsService settingsService) {
        this.analyticsService = analyticsService;
        this.settingsService = settingsService;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        Map<String, Object> res = new HashMap<>();
        res.put("averageCgpa", analyticsService.averageCgpa());
        res.put("placement", analyticsService.placementPercentage());
        return res;
    }

    @GetMapping("/students-per-branch")
    public List<Object[]> studentsPerBranch() {
        return analyticsService.studentsPerBranch();
    }

    @GetMapping("/placed-per-company")
    public List<Object[]> placedPerCompany() {
        return analyticsService.placedPerCompany();
    }

    @GetMapping("/insights")
    public Map<String, Object> insights() {
        if (!settingsService.getSettings().isAiInsightsEnabled()) {
            return Map.of("disabled", true);
        }
        return analyticsService.aiInsights();
    }
}
