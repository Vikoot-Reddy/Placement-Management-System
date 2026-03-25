package com.college.placement.service;

import com.college.placement.dto.CompanyRecommendation;
import com.college.placement.model.Company;
import com.college.placement.model.Student;
import com.college.placement.repository.CompanyRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RecommendationService {

    private final CompanyRepository companyRepository;
    private final SystemSettingsService settingsService;

    public RecommendationService(CompanyRepository companyRepository,
                                 SystemSettingsService settingsService) {
        this.companyRepository = companyRepository;
        this.settingsService = settingsService;
    }

    public List<CompanyRecommendation> recommendForStudent(Student student) {
        List<CompanyRecommendation> results = new ArrayList<>();
        double cgpa = student.getCgpa() == null ? 0 : student.getCgpa();
        int backlogs = student.getBacklogs() == null ? 0 : student.getBacklogs();

        if (!settingsService.isBranchAllowed(student.getBranch())) {
            return results;
        }

        for (Company c : companyRepository.findAll()) {
            boolean branchOk = isBranchEligible(c, student.getBranch());
            boolean backlogOk = backlogs <= (c.getMaxBacklogs() == null ? 0 : c.getMaxBacklogs());
            boolean cgpaOk = cgpa >= (c.getMinCgpa() == null ? 0 : c.getMinCgpa());
            boolean eligible = branchOk && backlogOk && cgpaOk;

            double score = (cgpa - (c.getMinCgpa() == null ? 0 : c.getMinCgpa()))
                    - (backlogs * 0.2);
            if (!eligible) {
                score -= 2.0;
            }

            results.add(new CompanyRecommendation(c.getId(), c.getName(), score, eligible));
        }

        results.sort(Comparator.comparingDouble(CompanyRecommendation::getScore).reversed());
        return results;
    }

    private boolean isBranchEligible(Company c, String branch) {
        if (c.getEligibleBranches() == null || c.getEligibleBranches().isBlank()) {
            return true;
        }
        for (String b : c.getEligibleBranches().split(",")) {
            if (b.trim().equalsIgnoreCase(branch)) {
                return true;
            }
        }
        return false;
    }
}
