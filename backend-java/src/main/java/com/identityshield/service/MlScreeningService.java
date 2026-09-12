package com.identityshield.service;

import com.identityshield.model.MlScreeningResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * MlScreeningService
 * Handles communication between Java Spring Boot and the Python FastAPI ML microservice.
 * Sends document image bytes via HTTP multipart/form-data to POST http://localhost:8000/screen
 * and receives the JSON response containing CNN prediction, OpenCV signals, and OCR text.
 */
@Service
public class MlScreeningService {

    private final RestTemplate restTemplate;

    @Value("${identityshield.ml.service-url:http://localhost:8000/screen}")
    private String mlServiceUrl;

    @Value("${identityshield.ml.health-url:http://localhost:8000/health}")
    private String mlHealthUrl;

    public MlScreeningService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Checks if the Python FastAPI microservice is online and accessible.
     */
    public boolean isPythonServiceHealthy() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(mlHealthUrl, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Calls Python FastAPI /screen endpoint with the image bytes as multipart/form-data.
     */
    public MlScreeningResponse callPythonScreening(byte[] fileBytes, String fileName) {
        try {
            // Set multipart/form-data headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Wrap bytes in ByteArrayResource with filename so FastAPI recognizes it as an UploadFile
            ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return (fileName != null && !fileName.trim().isEmpty()) ? fileName : "document.jpg";
                }
            };

            // Build multipart request body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // POST to Python FastAPI endpoint
            ResponseEntity<MlScreeningResponse> response = restTemplate.postForEntity(
                    mlServiceUrl,
                    requestEntity,
                    MlScreeningResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("Python ML service returned status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to communicate with Python ML Service at " + mlServiceUrl + ": " + e.getMessage(), e);
        }
    }
}
