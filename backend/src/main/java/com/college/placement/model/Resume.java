package com.college.placement.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resume_data")
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String filename;
    private String contentType;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] data;

    @Lob
    @Column(length = 10000)
    private String analysis;

    @Lob
    @Column(length = 5000)
    private String detectedSkills;

    @Lob
    @Column(length = 5000)
    private String missingSkills;

    @Lob
    @Column(length = 5000)
    private String suggestions;

    private Double placementChance;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public byte[] getData() {
        return data;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

    public String getAnalysis() {
        return analysis;
    }

    public void setAnalysis(String analysis) {
        this.analysis = analysis;
    }

    public String getDetectedSkills() {
        return detectedSkills;
    }

    public void setDetectedSkills(String detectedSkills) {
        this.detectedSkills = detectedSkills;
    }

    public String getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(String missingSkills) {
        this.missingSkills = missingSkills;
    }

    public String getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(String suggestions) {
        this.suggestions = suggestions;
    }

    public Double getPlacementChance() {
        return placementChance;
    }

    public void setPlacementChance(Double placementChance) {
        this.placementChance = placementChance;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }
}
