package com.college.placement.controller;

import com.college.placement.service.SeedService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final SeedService seedService;
    private final com.college.placement.service.StatusService statusService;

    public AdminController(SeedService seedService, com.college.placement.service.StatusService statusService) {
        this.seedService = seedService;
        this.statusService = statusService;
    }

    @PostMapping("/refresh-dataset")
    public ResponseEntity<String> refreshDataset() {
        seedService.refreshDataset();
        return ResponseEntity.ok("Dataset refreshed");
    }

    @GetMapping("/status")
    public ResponseEntity<java.util.Map<String, Object>> status() {
        return ResponseEntity.ok(statusService.getStatus());
    }
}
