package com.college.placement.repository;

import com.college.placement.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long>, JpaSpecificationExecutor<Student> {
    List<Student> findByPlacedFalseAndCgpaGreaterThanEqual(Double cgpa);
    List<Student> findByPlacedTrue();
}
