package com.college.placement.config;

import com.college.placement.model.Role;
import com.college.placement.model.SystemSettings;
import com.college.placement.model.User;
import com.college.placement.repository.SystemSettingsRepository;
import com.college.placement.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SystemSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      SystemSettingsRepository settingsRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            userRepository.save(createUser("admin", "admin123", Role.ADMIN));
            userRepository.save(createUser("officer", "officer123", Role.PLACEMENT_OFFICER));
            userRepository.save(createUser("student", "student123", Role.STUDENT));
        }

        if (settingsRepository.count() == 0) {
            settingsRepository.save(new SystemSettings());
        }
    }

    private User createUser(String username, String rawPassword, Role role) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setRole(role);
        return u;
    }
}
