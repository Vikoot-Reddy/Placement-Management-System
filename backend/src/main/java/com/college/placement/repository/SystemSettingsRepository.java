package com.college.placement.repository;

import com.college.placement.model.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Long> {
}
