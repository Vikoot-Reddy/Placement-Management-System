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

    public PlacementService(StudentRepository studentRepository,
                            CompanyRepository companyRepository,
                            PlacementRepository placementRepository,
                            NotificationService notificationService) {
        this.studentRepository = studentRepository;
        this.companyRepository = companyRepository;
        this.placementRepository = placementRepository;
        this.notificationService = notificationService;
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
        String branches = company.getEligibleBranches();
        List<String> eligibleBranches = new ArrayList<>();
        if (branches != null && !branches.isBlank()) {
            for (String b : branches.split(",")) {
                eligibleBranches.add(b.trim().toLowerCase());
            }
        }

        List<Student> candidates = studentRepository.findByPlacedFalseAndCgpaGreaterThanEqual(company.getMinCgpa());
        List<Student> result = new ArrayList<>();
        for (Student s : candidates) {
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

    public List<Placement> getAllPlacements() {
        return placementRepository.findAll();
    }

    public List<Student> getPlacedStudents() {
        return studentRepository.findByPlacedTrue();
    }
}
