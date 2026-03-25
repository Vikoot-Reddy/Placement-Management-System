package com.college.placement.controller;

import com.college.placement.model.Resume;
import com.college.placement.service.ResumeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/resumes")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Resume> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "studentId", required = false) Long studentId
    ) throws Exception {
        Resume resume = resumeService.analyzeAndSave(studentId, file.getOriginalFilename(), file.getContentType(), file.getBytes());
        return ResponseEntity.ok(resume);
    }
}
