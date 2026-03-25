package com.college.placement.controller;

import com.college.placement.dto.PlacementAssignRequest;
import com.college.placement.model.Placement;
import com.college.placement.model.Student;
import com.college.placement.service.PlacementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PlacementController {

    private final PlacementService placementService;

    public PlacementController(PlacementService placementService) {
        this.placementService = placementService;
    }

    @GetMapping("/placement/run/{companyId}")
    public int runPlacement(@PathVariable Long companyId) {
        return placementService.runPlacement(companyId);
    }

    @GetMapping("/placement/placed")
    public List<Student> placedStudents() {
        return placementService.getPlacedStudents();
    }

    @PostMapping("/placement/assign")
    public ResponseEntity<Placement> assign(@RequestBody PlacementAssignRequest request) {
        try {
            Placement placement = placementService.assignPlacement(request);
            if (placement == null) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(placement);
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/placement/all")
    public List<Placement> allPlacements() {
        return placementService.getAllPlacements();
    }

    @PostMapping("/placement/smart-run")
    public ResponseEntity<Integer> smartPlacement() {
        int count = placementService.runSmartPlacement();
        return ResponseEntity.ok(count);
    }
}
