package com.college.placement.dto;

public class CompanyRecommendation {
    private Long companyId;
    private String companyName;
    private double score;
    private boolean eligible;

    public CompanyRecommendation(Long companyId, String companyName, double score, boolean eligible) {
        this.companyId = companyId;
        this.companyName = companyName;
        this.score = score;
        this.eligible = eligible;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public String getCompanyName() {
        return companyName;
    }

    public double getScore() {
        return score;
    }

    public boolean isEligible() {
        return eligible;
    }
}
