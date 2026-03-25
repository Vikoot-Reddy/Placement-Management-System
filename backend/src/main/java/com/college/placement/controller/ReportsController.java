package com.college.placement.controller;

import com.college.placement.service.AnalyticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
public class ReportsController {

    private final AnalyticsService analyticsService;

    public ReportsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/placement-stats.csv")
    public ResponseEntity<String> placementStatsCsv() {
        Map<String, Object> placement = analyticsService.placementPercentage();
        StringBuilder sb = new StringBuilder();
        sb.append("Total,Placed,Percentage").append('\n');
        sb.append(placement.get("total")).append(',')
          .append(placement.get("placed")).append(',')
          .append(placement.get("percentage")).append('\n');
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=placement-stats.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(sb.toString());
    }

    @GetMapping("/company-wise.csv")
    public ResponseEntity<String> companyWiseCsv() {
        List<Object[]> rows = analyticsService.placedPerCompany();
        StringBuilder sb = new StringBuilder();
        sb.append("Company,Placed").append('\n');
        for (Object[] r : rows) {
            sb.append(r[0]).append(',').append(r[1]).append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=company-wise.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(sb.toString());
    }

    @GetMapping("/branch-wise.csv")
    public ResponseEntity<String> branchWiseCsv() {
        List<Object[]> rows = analyticsService.studentsPerBranch();
        StringBuilder sb = new StringBuilder();
        sb.append("Branch,Total").append('\n');
        for (Object[] r : rows) {
            sb.append(r[0]).append(',').append(r[1]).append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=branch-wise.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(sb.toString());
    }
}
