package com.college.placement.service;

import com.college.placement.model.Resume;
import com.college.placement.model.Student;
import com.college.placement.repository.ResumeRepository;
import com.college.placement.repository.StudentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final StudentRepository studentRepository;
    private final OpenAIService openAIService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeService(ResumeRepository resumeRepository, StudentRepository studentRepository,
                         OpenAIService openAIService, NotificationService notificationService) {
        this.resumeRepository = resumeRepository;
        this.studentRepository = studentRepository;
        this.openAIService = openAIService;
        this.notificationService = notificationService;
    }

    public Resume analyzeAndSave(Long studentId, String filename, String contentType, byte[] data) throws Exception {
        String text = new String(data);
        String analysis = openAIService.analyzeResumeText(text);

        Resume resume = new Resume();
        resume.setFilename(filename);
        resume.setContentType(contentType);
        resume.setData(data);
        resume.setAnalysis(analysis);
        populateFieldsFromAnalysis(resume, analysis);

        if (studentId != null) {
            Student student = studentRepository.findById(studentId).orElse(null);
            resume.setStudent(student);
        }

        Resume saved = resumeRepository.save(resume);
        notificationService.create("Resume Analyzed", "Resume analyzed for " + filename);
        return saved;
    }

    private void populateFieldsFromAnalysis(Resume resume, String analysis) {
        try {
            JsonNode node = objectMapper.readTree(analysis);
            resume.setDetectedSkills(asText(node.path("skills")));
            resume.setMissingSkills(asText(node.path("missingSkills")));
            resume.setSuggestions(asText(node.path("suggestions")));
            if (node.path("placementChance").isNumber()) {
                resume.setPlacementChance(node.path("placementChance").asDouble());
            }
        } catch (Exception ignore) {
            // Keep raw analysis in analysis field if JSON parsing fails.
        }
    }

    private String asText(JsonNode node) {
        if (node.isArray()) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < node.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(node.get(i).asText());
            }
            return sb.toString();
        }
        return node.isMissingNode() ? null : node.asText();
    }
}
