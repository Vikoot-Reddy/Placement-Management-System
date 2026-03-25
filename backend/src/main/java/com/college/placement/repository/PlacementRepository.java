package com.college.placement.repository;

import com.college.placement.model.Placement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlacementRepository extends JpaRepository<Placement, Long> {
    List<Placement> findByCompanyId(Long companyId);
    List<Placement> findByStudentId(Long studentId);
}
