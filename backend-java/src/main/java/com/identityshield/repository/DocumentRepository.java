package com.identityshield.repository;

import com.identityshield.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * DocumentRepository
 * Spring Data JPA repository for documents table.
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByScreeningCaseId(Long caseId);

    long count();
}
