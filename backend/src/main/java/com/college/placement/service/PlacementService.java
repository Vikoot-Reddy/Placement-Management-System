package com.college.placement.service;

import com.college.placement.dto.PlacementAssignRequest;
import com.college.placement.model.*;
import com.college.placement.repository.CompanyRepository;
import com.college.placement.repository.PlacementRepository;
import com.college.placement.repository.StudentRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class PlacementService {

    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final PlacementRepository placementRepository;
    private final NotificationService notificationService;
    private final SystemSettingsService settingsService;
    private final RecommendationService recommendationService;
    private final PlacementPredictorService predictorService;

    public PlacementService(StudentRepository studentRepository,
                            CompanyRepository companyRepository,
                            PlacementRepository placementRepository,
                            NotificationService notificationService,
                            SystemSettingsService settingsService,
                            RecommendationService recommendationService,
                            PlacementPredictorService predictorService) {
        this.studentRepository = studentRepository;
        this.companyRepository = companyRepository;
        this.placementRepository = placementRepository;
        this.notificationService = notificationService;
        this.settingsService = settingsService;
        this.recommendationService = recommendationService;
        this.predictorService = predictorService;
    }

    public int runPlacement(Long companyId) {
        Company company = companyRepository.findById(companyId).orElse(null);
        if (company == null) {
            return 0;
        }

        List<Student> eligibleStudents = eligibleStudentsForCompany(company);
        List<Placement> placements = new ArrayList<>();

        for (Student student : eligibleStudents) {
            student.setPlaced(true);
            student.setCompany(company);
            Placement placement = new Placement();
            placement.setStudent(student);
            placement.setCompany(company);
            placement.setOfferStatus(OfferStatus.OFFERED);
            placement.setPackageAmount(null);
            placement.setPlacementDate(LocalDate.now());
            placements.add(placement);
        }

        studentRepository.saveAll(eligibleStudents);
        placementRepository.saveAll(placements);

        if (!eligibleStudents.isEmpty()) {
            notificationService.create("Placement Results", "Placement run completed for " + company.getName() + ". Placed: " + eligibleStudents.size());
        }
        return eligibleStudents.size();
    }

    public List<Student> eligibleStudentsForCompany(Company company) {
        double defaultMin = settingsService.getSettings().getDefaultMinCgpa() == null ? 0 : settingsService.getSettings().getDefaultMinCgpa();
        double minCgpa = Math.max(defaultMin, company.getMinCgpa() == null ? 0 : company.getMinCgpa());
        String branches = company.getEligibleBranches();
        List<String> eligibleBranches = new ArrayList<>();
        if (branches != null && !branches.isBlank()) {
            for (String b : branches.split(",")) {
                eligibleBranches.add(b.trim().toLowerCase());
            }
        }

        List<Student> candidates = studentRepository.findByPlacedFalseAndCgpaGreaterThanEqual(minCgpa);
        List<Student> result = new ArrayList<>();
        for (Student s : candidates) {
            if (!settingsService.isBranchAllowed(s.getBranch())) {
                continue;
            }
            boolean branchOk = eligibleBranches.isEmpty() || eligibleBranches.contains(s.getBranch().toLowerCase());
            boolean backlogOk = s.getBacklogs() != null && s.getBacklogs() <= company.getMaxBacklogs();
            if (branchOk && backlogOk) {
                result.add(s);
            }
        }
        return result;
    }

    public Placement assignPlacement(PlacementAssignRequest req) {
        Student student = studentRepository.findById(req.getStudentId()).orElse(null);
        Company company = companyRepository.findById(req.getCompanyId()).orElse(null);
        if (student == null || company == null) {
            return null;
        }
        if (settingsService.getSettings().isOneStudentOneCompany() && student.isPlaced()) {
            throw new IllegalStateException("Student already placed.");
        }

        Placement placement = new Placement();
        placement.setStudent(student);
        placement.setCompany(company);
        placement.setOfferStatus(req.getOfferStatus() == null ? OfferStatus.OFFERED : req.getOfferStatus());
        placement.setPackageAmount(req.getPackageAmount());
        placement.setPlacementDate(req.getPlacementDate() == null ? LocalDate.now() : req.getPlacementDate());

        student.setPlaced(true);
        student.setCompany(company);
        studentRepository.save(student);

        Placement saved = placementRepository.save(placement);
        notificationService.create("Placement Assigned", "Student " + student.getName() + " placed in " + company.getName());
        return saved;
    }

    public int runSmartPlacement() {
        List<Student> students = studentRepository.findByPlacedFalseAndCgpaGreaterThanEqual(
                settingsService.getSettings().getDefaultMinCgpa() == null ? 0 : settingsService.getSettings().getDefaultMinCgpa()
        );
        List<Student> eligible = new ArrayList<>();
        for (Student s : students) {
            if (settingsService.isBranchAllowed(s.getBranch())) {
                eligible.add(s);
            }
        }

        eligible.sort((a, b) -> {
            double pa = predictorService.predictProbability(a);
            double pb = predictorService.predictProbability(b);
            return Double.compare(pb, pa);
        });

        List<Placement> placements = new ArrayList<>();
        int placedCount = 0;

        for (Student s : eligible) {
            if (settingsService.getSettings().isOneStudentOneCompany() && s.isPlaced()) {
                continue;
            }
            var recommendations = recommendationService.recommendForStudent(s);
            Company chosen = null;
            for (var rec : recommendations) {
                if (rec.isEligible()) {
                    chosen = companyRepository.findById(rec.getCompanyId()).orElse(null);
                    if (chosen != null) break;
                }
            }
            if (chosen == null) {
                continue;
            }
            s.setPlaced(true);
            s.setCompany(chosen);

            Placement placement = new Placement();
            placement.setStudent(s);
            placement.setCompany(chosen);
            placement.setOfferStatus(OfferStatus.OFFERED);
            placement.setPackageAmount(null);
            placement.setPlacementDate(LocalDate.now());
            placements.add(placement);
            placedCount++;
        }

        studentRepository.saveAll(eligible);
        placementRepository.saveAll(placements);

        if (placedCount > 0) {
            notificationService.create("Smart Placement", "Smart placement completed. Placed: " + placedCount);
        }
        return placedCount;
    }

    public List<Placement> getAllPlacements() {
        return placementRepository.findAll();
    }

    public List<Student> getPlacedStudents() {
        return studentRepository.findByPlacedTrue();
    }
}
