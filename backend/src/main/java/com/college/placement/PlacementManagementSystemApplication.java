package com.college.placement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PlacementManagementSystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(PlacementManagementSystemApplication.class, args);
    }
}
