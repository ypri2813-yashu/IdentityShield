package com.identityshield.repository;

import com.identityshield.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * AuditLogRepository
 * Spring Data JPA repository for audit_logs table.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByCreatedAtDesc();

    List<AuditLog> findByCaseIdOrderByCreatedAtDesc(Long caseId);
}
