package com.identityshield.model;

/**
 * RiskLevel Enum
 * Standardized risk classification levels across the IdentityShield ecosystem:
 * - LOW    : Score 0 - 29 (Standard processing eligible)
 * - MEDIUM : Score 30 - 59 (Review recommended)
 * - HIGH   : Score 60 - 100 (Further verification recommended)
 */
public enum RiskLevel {
    LOW,
    MEDIUM,
    HIGH
}
