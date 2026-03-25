package com.college.placement.repository;

import com.college.placement.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByStudentId(Long studentId);
}
