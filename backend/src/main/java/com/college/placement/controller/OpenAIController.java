package com.college.placement.controller;

import com.college.placement.service.OpenAIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/ai")
public class OpenAIController {

    private final OpenAIService openAIService;

    public OpenAIController(OpenAIService openAIService) {
        this.openAIService = openAIService;
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        try {
            openAIService.testConnection();
            return ResponseEntity.ok(Map.of("ok", true, "message", "OpenAI connection OK"));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("ok", false, "message", ex.getMessage()));
        }
    }
}
