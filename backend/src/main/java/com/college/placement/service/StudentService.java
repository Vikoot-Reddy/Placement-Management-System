package com.college.placement.service;

import com.college.placement.model.Student;
import com.college.placement.repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Page<Student> findStudents(String name, String branch, String placed, Double cgpaMin, Double cgpaMax, String companyName, Pageable pageable) {
        Specification<Student> spec = Specification.where(null);

        if (name != null && !name.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
        }

        if (branch != null && !branch.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("branch")), "%" + branch.toLowerCase() + "%"));
        }

        if (placed != null && !placed.equalsIgnoreCase("all")) {
            boolean placedVal = placed.equalsIgnoreCase("yes") || placed.equalsIgnoreCase("true");
            spec = spec.and((root, query, cb) -> cb.equal(root.get("placed"), placedVal));
        }

        if (cgpaMin != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("cgpa"), cgpaMin));
        }

        if (cgpaMax != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("cgpa"), cgpaMax));
        }

        if (companyName != null && !companyName.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.join("company", jakarta.persistence.criteria.JoinType.LEFT).get("name")),
                            "%" + companyName.toLowerCase() + "%"));
        }

        return studentRepository.findAll(spec, pageable);
    }

    public Student saveStudent(Student student) {
        if (student.getId() == null) {
            student.setPlaced(false);
            student.setCompany(null);
            if (student.getBacklogs() == null) {
                student.setBacklogs(0);
            }
        }
        return studentRepository.save(student);
    }

    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }

    public Student updateStudent(Long id, Student updates) {
        Student existing = studentRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        existing.setName(updates.getName());
        existing.setEmail(updates.getEmail());
        existing.setBranch(updates.getBranch());
        existing.setCgpa(updates.getCgpa());
        existing.setBacklogs(updates.getBacklogs());
        return studentRepository.save(existing);
    }
}
