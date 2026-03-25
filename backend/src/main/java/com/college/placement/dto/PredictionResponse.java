package com.college.placement.dto;

public class PredictionResponse {
    private Long studentId;
    private double probability;
    private String tag;

    public PredictionResponse(Long studentId, double probability, String tag) {
        this.studentId = studentId;
        this.probability = probability;
        this.tag = tag;
    }

    public Long getStudentId() {
        return studentId;
    }

    public double getProbability() {
        return probability;
    }

    public String getTag() {
        return tag;
    }
}
