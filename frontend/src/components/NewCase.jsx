import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Play,
  FileCheck2,
  AlertCircle,
  FolderPlus,
  CheckCircle2,
  Loader2,
  Layers,
  ArrowRight
} from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import ScreeningResult from './ScreeningResult';
import { api } from '../api';

export default function NewCase({ setActiveTab, setSelectedCaseId }) {
  const [caseName, setCaseName] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [documentType, setDocumentType] = useState('PASSPORT');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeCase, setActiveCase] = useState(null);
  const [screeningResults, setScreeningResults] = useState([]);
  const [activeResultDocId, setActiveResultDocId] = useState(null);

  // Quick preset loader to let user test immediately without looking for files on their computer
  function loadDemoScenario(type) {
    if (type === 'mismatch') {
      setCaseName('Cross-Doc Inconsistency Case - Jane Smith');
      setApplicantName('Jane E. Smith');
      // Create synthetic sample files
      const file1 = new File(['[SAMPLE PASSPORT SCAN DATA]'], 'jane_smith_passport.jpg', { type: 'image/jpeg' });
      const file2 = new File(['[SAMPLE UTILITY BILL DATA]'], 'jane_smith_electric_bill.png', { type: 'image/png' });

      setStagedFiles([
        { file: file1, documentType: 'PASSPORT', id: 1 },
        { file: file2, documentType: 'UTILITY_BILL', id: 2 }
      ]);
    } else {
      setCaseName('Executive Verification - David Chen');
      setApplicantName('David Chen');
      const file1 = new File(['[SAMPLE NATIONAL ID SCAN]'], 'david_chen_national_id.jpg', { type: 'image/jpeg' });
      setStagedFiles([
        { file: file1, documentType: 'NATIONAL_ID', id: 3 }
      ]);
    }
  }

  function handleFileSelected(file) {
    if (!file) return;
    const newEntry = {
      file,
      documentType,
      id: Date.now() + Math.random()
    };
    setStagedFiles(prev => [...prev, newEntry]);
  }

  function removeStagedFile(id) {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  }

  async function handleCreateAndScreen() {
    if (!caseName.trim()) {
      alert('Please enter a case name.');
      return;
    }
    if (stagedFiles.length === 0) {
      alert('Please attach at least one document to screen.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Step 1/3: Registering case in Spring Boot & MySQL...');

    try {
      // 1. Create case in backend
      const createdCase = await api.createCase({
        caseName,
        applicantName: applicantName || 'Unspecified Applicant'
      });
      setActiveCase(createdCase);

      const results = [];

      // 2. Upload documents
      for (let i = 0; i < stagedFiles.length; i++) {
        const item = stagedFiles[i];
        setProcessingStatus(`Step 2/3: Uploading document ${i + 1}/${stagedFiles.length} (${item.documentType})...`);

        const uploadedDoc = await api.uploadDocument(createdCase.id, item.file, item.documentType);

        // 3. Screen document with CNN + OpenCV + Tesseract OCR
        setProcessingStatus(`Step 3/3: Running CNN Visual Classifier + OpenCV + OCR on ${item.file.name}...`);
        const result = await api.screenDocument(uploadedDoc.id, createdCase.id);
        results.push({ ...result, docName: item.file.name, docType: item.documentType });
      }

      setScreeningResults(results);
      if (results.length > 0) {
        setActiveResultDocId(results[0].documentId || results[0].id);
      }
      setProcessingStatus('Screening Completed!');
    } catch (err) {
      console.error("Screening failed:", err);
      alert('Error during screening: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>New Identity Screening Case</span>
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
              Multi-Document
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register applicant details, attach multiple identity and proof documents, and initiate automated AI screening.
          </p>
        </div>

        {/* Demo Preset Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => loadDemoScenario('clear')}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            Demo: Standard ID
          </button>
          <button
            type="button"
            onClick={() => loadDemoScenario('mismatch')}
            className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition"
          >
            Demo: Inconsistency Case
          </button>
        </div>
      </div>

      {/* Case Details Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Case Name / Purpose <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Account Opening - Sarah Connor"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Applicant Full Legal Name
          </label>
          <input
            type="text"
            placeholder="e.g. Sarah J. Connor"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
          />
        </div>
      </div>

      {/* Multi-Document Upload Section */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Attach Identity &amp; Supporting Documents
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            You can upload multiple documents (e.g. Passport + Utility Bill). The system cross-verifies demographic consistency across all attached items.
          </p>
        </div>

        {/* Upload Component */}
        <DocumentUpload
          onFileSelected={handleFileSelected}
          documentType={documentType}
          setDocumentType={setDocumentType}
        />

        {/* Staged Documents List */}
        {stagedFiles.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-slate-300">
              Attached Documents ({stagedFiles.length}):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stagedFiles.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="h-9 w-9 rounded-lg bg-rose-950/30 border border-rose-900/40 flex items-center justify-center text-rose-400 shrink-0">
                      <FileCheck2 className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">{item.file.name}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-rose-300 font-medium">
                          {item.documentType}
                        </span>
                        <span>{(item.file.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeStagedFile(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                    title="Remove document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Trigger */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {stagedFiles.length} document(s) staged for AI inspection
          </span>

          <button
            type="button"
            disabled={isProcessing || stagedFiles.length === 0}
            onClick={handleCreateAndScreen}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/50 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Screening Pipeline Active...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Initiate AI Document Screening</span>
              </>
            )}
          </button>
        </div>

        {/* Processing State Indicator */}
        {isProcessing && (
          <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 space-y-3">
            <div className="flex items-center space-x-3 text-xs font-semibold text-rose-300">
              <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
              <span>{processingStatus}</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-400 animate-scan-line" />
            </div>
          </div>
        )}
      </div>

      {/* Screening Results Section */}
      {screeningResults.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Screening Results</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  {screeningResults.length} Evaluated
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Case: {activeCase?.caseNumber} — {activeCase?.caseName}
              </p>
            </div>

            {/* Document Selector Pills if multiple */}
            {screeningResults.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {screeningResults.map((r, i) => {
                  const pSusp = r.suspiciousProbability !== undefined
                    ? Number(r.suspiciousProbability)
                    : (r.cnnPrediction === 'Suspicious' ? Number(r.cnnConfidence || 0.75) : Number((1 - (r.cnnConfidence || 0.5)).toFixed(4)));
                  const isSusp = (r.cnnPrediction === 'Suspicious') || pSusp >= 0.5;

                  return (
                    <button
                      key={i}
                      onClick={() => setActiveResultDocId(r.documentId || r.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center space-x-2 ${
                        (r.documentId || r.id) === activeResultDocId
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-950/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Doc #{i + 1} ({r.docType || 'DOC'})</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                        isSusp ? 'bg-rose-950 text-rose-400 border border-rose-800/60' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      }`}>
                        P(Susp): {(pSusp * 100).toFixed(0)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Result Card */}
          {(() => {
            const activeResult = screeningResults.find(r => (r.documentId || r.id) === activeResultDocId) || screeningResults[0];
            return <ScreeningResult result={activeResult} />;
          })()}

          {/* Navigation to Full Case View */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                if (activeCase) {
                  setSelectedCaseId(activeCase.id);
                  setActiveTab('cases');
                }
              }}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
            >
              <span>Inspect Case Record in Registry</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
