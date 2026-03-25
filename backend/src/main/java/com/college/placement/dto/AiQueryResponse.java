package com.college.placement.dto;

import com.college.placement.model.Student;

import java.util.List;
import java.util.Map;

public class AiQueryResponse {
    private String normalizedQuery;
    private Map<String, Object> filters;
    private List<Student> results;

    public AiQueryResponse(String normalizedQuery, Map<String, Object> filters, List<Student> results) {
        this.normalizedQuery = normalizedQuery;
        this.filters = filters;
        this.results = results;
    }

    public String getNormalizedQuery() {
        return normalizedQuery;
    }

    public Map<String, Object> getFilters() {
        return filters;
    }

    public List<Student> getResults() {
        return results;
    }
}
