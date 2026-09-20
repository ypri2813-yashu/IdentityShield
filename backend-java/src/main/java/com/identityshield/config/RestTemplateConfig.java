package com.identityshield.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * RestTemplate Configuration
 * Configures the HTTP client used to send multipart document image requests
 * to the Python FastAPI CNN/OCR microservice.
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        // Keep buffering enabled (true) to ensure reliable multipart/form-data upload
        // and avoid ProtocolException or Content-Length stream errors with Spring RestTemplate
        requestFactory.setBufferRequestBody(true);

        return builder
                .requestFactory(() -> requestFactory)
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(60))
                .build();
    }
}
