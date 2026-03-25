package com.college.placement.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final EntityManager entityManager;

    public AnalyticsService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public List<Object[]> studentsPerBranch() {
        return entityManager.createQuery("select s.branch, count(s) from Student s group by s.branch", Object[].class)
                .getResultList();
    }

    public double averageCgpa() {
        Double avg = entityManager.createQuery("select avg(s.cgpa) from Student s", Double.class).getSingleResult();
        return avg == null ? 0.0 : avg;
    }

    public Map<String, Object> placementPercentage() {
        Long total = entityManager.createQuery("select count(s) from Student s", Long.class).getSingleResult();
        Long placed = entityManager.createQuery("select count(s) from Student s where s.placed = true", Long.class).getSingleResult();
        double percent = total == 0 ? 0.0 : (placed * 100.0) / total;
        Map<String, Object> map = new HashMap<>();
        map.put("total", total);
        map.put("placed", placed);
        map.put("percentage", percent);
        return map;
    }

    public List<Object[]> placedPerCompany() {
        return entityManager.createQuery("select c.name, count(s) from Student s join s.company c where s.placed = true group by c.name", Object[].class)
                .getResultList();
    }
}
