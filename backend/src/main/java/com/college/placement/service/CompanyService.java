package com.college.placement.service;

import com.college.placement.model.Company;
import com.college.placement.repository.CompanyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final NotificationService notificationService;
    private final PlacementService placementService;

    public CompanyService(CompanyRepository companyRepository, NotificationService notificationService, PlacementService placementService) {
        this.companyRepository = companyRepository;
        this.notificationService = notificationService;
        this.placementService = placementService;
    }

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public Page<Company> findCompanies(String name, Double minCgpa, Pageable pageable) {
        Specification<Company> spec = Specification.where(null);

        if (name != null && !name.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
        }

        if (minCgpa != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("minCgpa"), minCgpa));
        }

        return companyRepository.findAll(spec, pageable);
    }

    public Company saveCompany(Company company) {
        if (company.getMaxBacklogs() == null) {
            company.setMaxBacklogs(0);
        }
        Company saved = companyRepository.save(company);
        notificationService.create("New Company Added", "Company " + saved.getName() + " added with role " + saved.getRole());
        int eligibleCount = placementService.eligibleStudentsForCompany(saved).size();
        notificationService.create("Eligibility Update", eligibleCount + " students eligible for " + saved.getName());
        return saved;
    }

    public Company getCompanyById(Long id) {
        return companyRepository.findById(id).orElse(null);
    }

    public Company updateCompany(Long id, Company updates) {
        Company existing = companyRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        existing.setName(updates.getName());
        existing.setRole(updates.getRole());
        existing.setMinCgpa(updates.getMinCgpa());
        existing.setEligibleBranches(updates.getEligibleBranches());
        existing.setMaxBacklogs(updates.getMaxBacklogs());
        return companyRepository.save(existing);
    }
}
