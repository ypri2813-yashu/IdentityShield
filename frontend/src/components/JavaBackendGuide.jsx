import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Server,
  FileCheck2,
  Cpu,
  ArrowRight,
  Terminal,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function JavaBackendGuide() {
  const [copiedId, setCopiedId] = useState(null);
  const [selectedSnippet, setSelectedSnippet] = useState('screeningService');

  function copyCode(id, code) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  const snippets = {
    screeningService: {
      title: 'MlScreeningService.java — Simplified 1-Line Java ML Bridge',
      desc: 'Clean, idiomatic Spring Boot service with automatic fallback. Call screen(bytes, fileName) without cumbersome boilerplate.',
      lang: 'java',
      code: `package com.identityshield.service;

import com.identityshield.model.MlScreeningResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Simplified ML Screening Service for Java Spring Boot.
 * Communicates with Python FastAPI and provides built-in fallback.
 */
@Service
public class MlScreeningService {

    private final RestTemplate restTemplate;

    @Value("\${identityshield.ml.service-url:http://localhost:8001/screen}")
    private String mlServiceUrl;

    public MlScreeningService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * One-line screening method:
     * mlScreeningService.screen(fileBytes, "aadhaar_card.jpg");
     */
    public MlScreeningResponse screen(byte[] fileBytes, String fileName) {
        try {
            // 1. Prepare clean multipart request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new NamedByteArrayResource(fileBytes, fileName));

            // 2. Call Python FastAPI CNN service
            ResponseEntity<MlScreeningResponse> res = restTemplate.postForEntity(
                mlServiceUrl,
                new HttpEntity<>(body, headers),
                MlScreeningResponse.class
            );

            if (res.getStatusCode().is2xxSuccessful() && res.getBody() != null) {
                return res.getBody();
            }
        } catch (Exception e) {
            // Log notice and gracefully use internal screening
            System.out.println("ML Service unavailable: " + e.getMessage() + ". Using fallback.");
        }

        // 3. Resilient Fallback: Built-in Verhoeff Aadhaar & PAN verification
        return performFallbackScreening(fileBytes, fileName);
    }
}`
    },
    controller: {
      title: 'DocumentController.java — Simplified REST Endpoint',
      desc: 'Clean Spring MVC endpoint accepting multipart uploads and returning JSON risk analysis.',
      lang: 'java',
      code: `@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    /**
     * Screen uploaded document:
     * POST /api/documents/{id}/screen
     */
    @PostMapping("/{id}/screen")
    public ResponseEntity<ScreeningResult> screenDocument(@PathVariable Long id) {
        ScreeningResult result = documentService.screenDocument(id);
        return ResponseEntity.ok(result);
    }
}`
    },
    verhoeff: {
      title: 'VerhoeffAlgorithm.java — Aadhaar Dihedral D5 Checksum',
      desc: 'Deterministic mathematical checksum engine verifying 12th check digit of Indian Aadhaar IDs.',
      lang: 'java',
      code: `public class VerhoeffAlgorithm {

    // Dihedral group D5 multiplication table
    private static final int[][] D = {
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
        {1, 2, 3, 4, 0, 6, 7, 8, 9, 5},
        {2, 3, 4, 0, 1, 7, 8, 9, 5, 6},
        {3, 4, 0, 1, 2, 8, 9, 5, 6, 7},
        {4, 0, 1, 2, 3, 9, 5, 6, 7, 8},
        {5, 6, 7, 8, 9, 0, 1, 2, 3, 4},
        {6, 7, 8, 9, 5, 1, 2, 3, 4, 0},
        {7, 8, 9, 5, 6, 2, 3, 4, 0, 1},
        {8, 9, 5, 6, 7, 3, 4, 0, 1, 2},
        {9, 5, 6, 7, 8, 4, 0, 1, 2, 3}
    };

    // Permutation table
    private static final int[][] P = {
        {0, 1, 2, 3, 4, 5, 6, 7, 8, 9},
        {1, 5, 7, 6, 2, 8, 3, 0, 9, 4},
        {5, 8, 0, 3, 7, 9, 6, 1, 4, 2},
        {8, 9, 1, 6, 0, 4, 3, 5, 2, 7},
        {9, 4, 5, 3, 1, 2, 6, 8, 7, 0},
        {4, 2, 8, 6, 5, 7, 3, 9, 0, 1},
        {2, 7, 9, 3, 8, 0, 6, 4, 1, 5},
        {7, 0, 4, 6, 9, 1, 3, 2, 5, 8}
    };

    public static boolean validate(String aadhaarNumber) {
        if (aadhaarNumber == null) return false;
        String digits = aadhaarNumber.replaceAll("\\\\D", "");
        if (digits.length() != 12 || digits.startsWith("0") || digits.startsWith("1")) {
            return false;
        }

        int checksum = 0;
        int len = digits.length();
        for (int i = 0; i < len; i++) {
            int digit = Character.getNumericValue(digits.charAt(len - 1 - i));
            checksum = D[checksum][P[i % 8][digit]];
        }
        return checksum == 0;
    }
}`
    },
    pythonService: {
      title: 'Python FastAPI ML Microservice (Port 8001)',
      desc: 'FastAPI microservice running CNN inference with baseline fallback weights.',
      lang: 'python',
      code: `# ml-service/main.py
from fastapi import FastAPI, File, UploadFile
import uvicorn
from cnn_model import get_model, predict_document_image

app = FastAPI(title="IdentityShield ML Service")

@app.post("/screen")
async def screen_document(file: UploadFile = File(...)):
    contents = await file.read()
    model, _ = get_model() # Auto-initializes baseline if weights missing
    
    # Run CNN inference + OpenCV optical signals
    pred, conf, raw_prob = predict_document_image(model, contents)
    
    return {
        "cnnPrediction": pred,
        "cnnConfidence": conf,
        "rawProbability": raw_prob,
        "riskScore": int(raw_prob * 100),
        "riskLevel": "HIGH" if raw_prob >= 0.6 else "LOW"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)`
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/20">
              DEVELOPER SPECIFICATION
            </span>
            <span className="text-xs text-slate-400">Spring Boot 3 + FastAPI ML Bridge</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center space-x-2">
            <span>Simplified Java Backend Syntax</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Intuitive, boilerplate-free Java 17 integration for ML document screening with automatic resilient fallback.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold">Syntax Optimized &amp; Resilient</span>
        </div>
      </div>

      {/* 3 Core Architectural Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
          <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm mb-1.5">
            <Zap className="h-4 w-4" />
            <span>1-Line Invocation</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Replaced complex anonymous inner classes and multipart builders with a clean <code className="text-rose-300 font-mono">mlScreeningService.screen(bytes, name)</code> API.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm mb-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span>Zero-Crash Fallback</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            If Python FastAPI or CNN weights are offline, Java seamlessly validates documents using built-in Verhoeff checksum &amp; PAN rules.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
          <div className="flex items-center space-x-2 text-sky-400 font-semibold text-sm mb-1.5">
            <Server className="h-4 w-4" />
            <span>Port 8001 Decoupling</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Moved ML microservice to port 8001, avoiding container port collisions with control plane and ensuring instant connection.
          </p>
        </div>
      </div>

      {/* Code Snippet Tabs */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0c101a] overflow-hidden shadow-2xl">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-4 py-2.5 gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedSnippet('screeningService')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedSnippet === 'screeningService'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              MlScreeningService.java
            </button>
            <button
              onClick={() => setSelectedSnippet('controller')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedSnippet === 'controller'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              DocumentController.java
            </button>
            <button
              onClick={() => setSelectedSnippet('verhoeff')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedSnippet === 'verhoeff'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              VerhoeffAlgorithm.java
            </button>
            <button
              onClick={() => setSelectedSnippet('pythonService')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedSnippet === 'pythonService'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              FastAPI main.py (Port 8001)
            </button>
          </div>

          <button
            onClick={() => copyCode(selectedSnippet, snippets[selectedSnippet].code)}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {copiedId === selectedSnippet ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Snippet Description */}
        <div className="px-5 py-3 bg-slate-900/30 border-b border-slate-800/60">
          <h3 className="text-sm font-semibold text-white">{snippets[selectedSnippet].title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{snippets[selectedSnippet].desc}</p>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto bg-[#080c14] font-mono text-xs text-slate-300 leading-relaxed max-h-[500px]">
          <pre className="whitespace-pre">
            <code>{snippets[selectedSnippet].code}</code>
          </pre>
        </div>
      </div>

      {/* Running Sequence Box */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-rose-400" />
          <span>Local Microservice Execution Commands</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
            <span className="text-[11px] font-semibold text-rose-400 block mb-1">Terminal 1 — Python ML Service:</span>
            <code className="text-slate-300 font-mono">cd ml-service && uvicorn main:app --port 8001 --reload</code>
          </div>
          <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
            <span className="text-[11px] font-semibold text-emerald-400 block mb-1">Terminal 2 — Java Spring Boot:</span>
            <code className="text-slate-300 font-mono">cd backend-java && mvn spring-boot:run</code>
          </div>
        </div>
      </div>
    </div>
  );
}
