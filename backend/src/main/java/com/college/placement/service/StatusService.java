package com.college.placement.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class StatusService {

    private final JdbcTemplate jdbcTemplate;
    private final OpenAIService openAIService;
    private final SeedService seedService;

    public StatusService(JdbcTemplate jdbcTemplate, OpenAIService openAIService, SeedService seedService) {
        this.jdbcTemplate = jdbcTemplate;
        this.openAIService = openAIService;
        this.seedService = seedService;
    }

    public Map<String, Object> getStatus() {
        Map<String, Object> map = new HashMap<>();
        boolean dbOk;
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            dbOk = true;
        } catch (Exception ex) {
            dbOk = false;
        }
        map.put("database", dbOk);
        map.put("openaiKeyConfigured", openAIService.isConfigured());
        long last = seedService.getLastRefreshEpochMs();
        map.put("lastSeedRefresh", last == 0 ? null : Instant.ofEpochMilli(last).toString());
        return map;
    }
}
