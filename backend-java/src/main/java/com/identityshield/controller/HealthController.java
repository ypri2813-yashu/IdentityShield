package com.identityshield.controller;

import com.identityshield.service.MlScreeningService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * HealthController
 * Provides real-time health and connection diagnostics across the 3-tier architecture:
 *  - Spring Boot Backend (self)
 *  - Python FastAPI ML Service
 *  - Database status
 */
@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "*")
public class HealthController {

    private final MlScreeningService mlScreeningService;

    public HealthController(MlScreeningService mlScreeningService) {
        this.mlScreeningService = mlScreeningService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("service", "IdentityShield Java Spring Boot Backend");
        health.put("timestamp", LocalDateTime.now());

        boolean pythonHealthy = mlScreeningService.isPythonServiceHealthy();
        health.put("pythonMlServiceConnected", pythonHealthy);
        health.put("pythonMlServiceStatus", pythonHealthy ? "ONLINE (http://localhost:8000)" : "OFFLINE (Start with: uvicorn main:app --port 8000)");

        return ResponseEntity.ok(health);
    }
}
