package com.college.placement.service;

import com.college.placement.dto.AiQueryResponse;
import com.college.placement.model.Company;
import com.college.placement.model.Student;
import com.college.placement.repository.CompanyRepository;
import com.college.placement.repository.StudentRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiQueryService {

    private final StudentService studentService;
    private final CompanyRepository companyRepository;
    private final SystemSettingsService settingsService;

    private static final String[] BRANCHES = {"CSE", "ECE", "IT", "EEE", "ME", "CIVIL"};

    public AiQueryService(StudentService studentService,
                          CompanyRepository companyRepository,
                          SystemSettingsService settingsService) {
        this.studentService = studentService;
        this.companyRepository = companyRepository;
        this.settingsService = settingsService;
    }

    public AiQueryResponse handleQuery(String rawQuery, Integer limitOverride) {
        String query = rawQuery == null ? "" : rawQuery.toLowerCase();

        String branch = "";
        String placed = "all";
        Double cgpaMin = null;
        Double cgpaMax = null;
        String companyName = "";
        int limit = limitOverride != null ? limitOverride : 10;

        if (query.contains("unplaced") || query.contains("not placed")) {
            placed = "false";
        } else if (query.contains("placed")) {
            placed = "true";
        }

        for (String b : BRANCHES) {
            if (query.contains(b.toLowerCase())) {
                branch = b;
                break;
            }
        }

        Pattern cgpaPattern = Pattern.compile("cgpa\\s*(>=|>|<=|<)\\s*(\\d+(?:\\.\\d+)?)");
        Matcher matcher = cgpaPattern.matcher(query);
        if (matcher.find()) {
            String op = matcher.group(1);
            double value = Double.parseDouble(matcher.group(2));
            if (op.equals(">") || op.equals(">=")) {
                cgpaMin = value;
            } else {
                cgpaMax = value;
            }
        }

        if (query.contains("top")) {
            limit = Math.min(limit, 10);
        }

        for (Company c : companyRepository.findAll()) {
            if (query.contains(c.getName().toLowerCase())) {
                companyName = c.getName();
                break;
            }
        }

        if (!branch.isBlank() && !settingsService.isBranchAllowed(branch)) {
            return new AiQueryResponse(rawQuery, Map.of("branch", branch, "blockedBySettings", true), List.of());
        }

        Sort sort = query.contains("top") ? Sort.by("cgpa").descending() : Sort.by("id").ascending();
        List<Student> results = studentService
                .findStudents("", branch, placed, cgpaMin, cgpaMax, companyName, PageRequest.of(0, limit, sort))
                .getContent();

        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("branch", branch);
        filters.put("placed", placed);
        filters.put("cgpaMin", cgpaMin);
        filters.put("cgpaMax", cgpaMax);
        filters.put("companyName", companyName);
        filters.put("limit", limit);
        return new AiQueryResponse(rawQuery, filters, results);
    }
}
