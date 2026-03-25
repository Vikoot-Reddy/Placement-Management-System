package com.college.placement.controller;

import com.college.placement.dto.AiQueryRequest;
import com.college.placement.dto.AiQueryResponse;
import com.college.placement.dto.CompanyRecommendation;
import com.college.placement.dto.PredictionResponse;
import com.college.placement.model.Student;
import com.college.placement.repository.StudentRepository;
import com.college.placement.service.AiQueryService;
import com.college.placement.service.PlacementPredictorService;
import com.college.placement.service.RecommendationService;
import com.college.placement.service.ResumeService;
import com.college.placement.service.SystemSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/ai")
public class AIController {

    private final StudentRepository studentRepository;
    private final PlacementPredictorService predictorService;
    private final RecommendationService recommendationService;
    private final ResumeService resumeService;
    private final AiQueryService aiQueryService;
    private final SystemSettingsService settingsService;

    public AIController(StudentRepository studentRepository,
                        PlacementPredictorService predictorService,
                        RecommendationService recommendationService,
                        ResumeService resumeService,
                        AiQueryService aiQueryService,
                        SystemSettingsService settingsService) {
        this.studentRepository = studentRepository;
        this.predictorService = predictorService;
        this.recommendationService = recommendationService;
        this.resumeService = resumeService;
        this.aiQueryService = aiQueryService;
        this.settingsService = settingsService;
    }

    @GetMapping("/predict/{studentId}")
    public ResponseEntity<PredictionResponse> predict(@PathVariable Long studentId) {
        if (!settingsService.getSettings().isAiPredictionEnabled()) {
            return ResponseEntity.status(403).build();
        }
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        var prediction = predictorService.predictAndStore(student);
        return ResponseEntity.ok(new PredictionResponse(studentId, prediction.getProbability(), prediction.getTag()));
    }

    @GetMapping("/recommend/{studentId}")
    public ResponseEntity<List<CompanyRecommendation>> recommend(@PathVariable Long studentId) {
        if (!settingsService.getSettings().isAiRecommendationEnabled()) {
            return ResponseEntity.status(403).build();
        }
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(recommendationService.recommendForStudent(student));
    }

    @PostMapping("/analyze-resume")
    public ResponseEntity<?> analyzeResume(@RequestParam("file") MultipartFile file,
                                           @RequestParam(value = "studentId", required = false) Long studentId) throws Exception {
        if (!settingsService.getSettings().isAiResumeEnabled()) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(resumeService.analyzeAndSave(studentId, file.getOriginalFilename(), file.getContentType(), file.getBytes()));
    }

    @PostMapping("/query")
    public ResponseEntity<AiQueryResponse> query(@RequestBody AiQueryRequest request) {
        if (!settingsService.getSettings().isAiQueryEnabled()) {
            return ResponseEntity.status(403).build();
        }
        AiQueryResponse response = aiQueryService.handleQuery(request.getQuery(), request.getLimit());
        return ResponseEntity.ok(response);
    }
}
