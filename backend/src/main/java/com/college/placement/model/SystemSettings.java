package com.college.placement.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
public class SystemSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double defaultMinCgpa = 6.0;

    @Column(length = 500)
    private String allowedBranches = "CSE,ECE,IT,EEE,ME,CIVIL";

    private boolean oneStudentOneCompany = true;

    private boolean aiPredictionEnabled = true;
    private boolean aiRecommendationEnabled = true;
    private boolean aiResumeEnabled = true;
    private boolean aiQueryEnabled = true;
    private boolean aiInsightsEnabled = true;

    @Column(length = 10)
    private String theme = "DARK";

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getDefaultMinCgpa() {
        return defaultMinCgpa;
    }

    public void setDefaultMinCgpa(Double defaultMinCgpa) {
        this.defaultMinCgpa = defaultMinCgpa;
    }

    public String getAllowedBranches() {
        return allowedBranches;
    }

    public void setAllowedBranches(String allowedBranches) {
        this.allowedBranches = allowedBranches;
    }

    public boolean isOneStudentOneCompany() {
        return oneStudentOneCompany;
    }

    public void setOneStudentOneCompany(boolean oneStudentOneCompany) {
        this.oneStudentOneCompany = oneStudentOneCompany;
    }

    public boolean isAiPredictionEnabled() {
        return aiPredictionEnabled;
    }

    public void setAiPredictionEnabled(boolean aiPredictionEnabled) {
        this.aiPredictionEnabled = aiPredictionEnabled;
    }

    public boolean isAiRecommendationEnabled() {
        return aiRecommendationEnabled;
    }

    public void setAiRecommendationEnabled(boolean aiRecommendationEnabled) {
        this.aiRecommendationEnabled = aiRecommendationEnabled;
    }

    public boolean isAiResumeEnabled() {
        return aiResumeEnabled;
    }

    public void setAiResumeEnabled(boolean aiResumeEnabled) {
        this.aiResumeEnabled = aiResumeEnabled;
    }

    public boolean isAiQueryEnabled() {
        return aiQueryEnabled;
    }

    public void setAiQueryEnabled(boolean aiQueryEnabled) {
        this.aiQueryEnabled = aiQueryEnabled;
    }

    public boolean isAiInsightsEnabled() {
        return aiInsightsEnabled;
    }

    public void setAiInsightsEnabled(boolean aiInsightsEnabled) {
        this.aiInsightsEnabled = aiInsightsEnabled;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
