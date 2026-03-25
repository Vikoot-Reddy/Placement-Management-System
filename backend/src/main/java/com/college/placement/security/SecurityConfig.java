package com.college.placement.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/analytics/**", "/reports/**", "/notifications/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/students/**", "/companies/**", "/placement/**", "/analytics/**", "/reports/**", "/notifications/**", "/ai/**", "/resumes/**", "/admin/**", "/settings/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/ai/analyze-resume", "/ai/query", "/resumes/**")
                    .authenticated()
                .requestMatchers(HttpMethod.POST, "/students/**", "/companies/**", "/placement/**", "/notifications/**", "/ai/**", "/admin/**")
                    .hasAnyRole("ADMIN", "PLACEMENT_OFFICER")
                .requestMatchers(HttpMethod.PUT, "/settings/**")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/students/**", "/companies/**")
                    .hasAnyRole("ADMIN", "PLACEMENT_OFFICER")
                .requestMatchers(HttpMethod.DELETE, "/students/**", "/companies/**")
                    .hasAnyRole("ADMIN", "PLACEMENT_OFFICER")
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
