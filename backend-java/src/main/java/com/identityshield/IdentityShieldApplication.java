package com.identityshield;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * IdentityShield - Main Spring Boot Application Entry Point
 *
 * IdentityShield is an AI-based identity and document screening system.
 * This Spring Boot application serves as the core orchestration backend,
 * communicating with MySQL for persistence, React for presentation,
 * and Python FastAPI for CNN visual model inference and OCR.
 */
@SpringBootApplication
public class IdentityShieldApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdentityShieldApplication.class, args);
        System.out.println("=================================================");
        System.out.println(" IdentityShield Spring Boot Backend is RUNNING!");
        System.out.println(" REST API URL : http://localhost:8080/api");
        System.out.println(" Database     : MySQL (identityshield)");
        System.out.println(" ML Service   : http://localhost:8000 (Python FastAPI)");
        System.out.println("=================================================");
    }
}
