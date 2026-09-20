import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X } from 'lucide-react';

export default function DocumentUpload({ onFileSelected, documentType, setDocumentType }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const inputRef = useRef(null);

  const documentTypes = [
    { value: 'INDIAN_AADHAAR', label: '🇮🇳 Aadhaar Card (UIDAI — India)' },
    { value: 'INDIAN_PAN', label: '🇮🇳 PAN Card (Income Tax Dept — India)' },
    { value: 'INDIAN_DRIVING_LICENCE', label: '🇮🇳 Indian Driving Licence (MoRTH / Parivahan)' },
    { value: 'INDIAN_PASSPORT', label: '🇮🇳 Indian Passport (Republic of India)' },
    { value: 'INDIAN_VOTER_ID', label: '🇮🇳 Voter ID / EPIC Card (Election Commission of India)' },
    { value: 'PASSPORT', label: '🌐 International Passport (ICAO Doc 9303)' },
    { value: 'NATIONAL_ID', label: '🪪 National Identity Card / State ID' },
    { value: 'DRIVING_LICENSE', label: '🚗 Driving License (DMV / International)' },
    { value: 'UTILITY_BILL', label: '⚡ Utility Bill (Electricity / Water / Gas — Address Proof)' },
    { value: 'BANK_STATEMENT', label: '🏦 Bank Statement / Financial Record' },
    { value: 'BIRTH_CERTIFICATE', label: '📜 Birth Certificate / Academic Transcript' },
    { value: 'SUPPORTING_DOC', label: '📄 General Purpose Document / Supporting File' }
  ];

  const [documentCondition, setDocumentCondition] = useState('AUTO');
  const [currentFile, setCurrentFile] = useState(null);

  function updateCondition(newCond) {
    setDocumentCondition(newCond);
    if (currentFile) {
      currentFile.documentCondition = newCond;
    }
  }

  function handleFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.endsWith('.pdf')) {
      alert('Please upload an image document (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB limit.');
      return;
    }

    setSelectedFileName(file.name);
    const objectUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setPreviewUrl(objectUrl);
    // Attach document condition flag to file object
    file.documentCondition = documentCondition;
    setCurrentFile(file);
    onFileSelected(file, documentCondition, documentType);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function clearSelection(e) {
    e.stopPropagation();
    setPreviewUrl(null);
    setSelectedFileName(null);
    setCurrentFile(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileSelected(null);
  }

  return (
    <div className="space-y-4">
      {/* Document Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Document Classification Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-200 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
          >
            {documentTypes.map((t) => (
              <option key={t.value} value={t.value} className="bg-slate-900 text-slate-200">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Integrity Evaluation Mode</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              documentCondition === 'FAKE'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                : documentCondition === 'VALID'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                : 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
            }`}>
              {documentCondition === 'FAKE' ? '🚨 Testing Fraud Engine (Fake)' : documentCondition === 'VALID' ? '🇮🇳 Genuine Credential' : '🔍 Auto-Forensic'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => updateCondition('FAKE')}
              className={`px-2 py-2 text-[11px] font-bold rounded-lg transition text-center ${
                documentCondition === 'FAKE'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/60'
              }`}
            >
              🚨 Suspected Fake
            </button>
            <button
              type="button"
              onClick={() => updateCondition('VALID')}
              className={`px-2 py-2 text-[11px] font-bold rounded-lg transition text-center ${
                documentCondition === 'VALID'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60'
              }`}
            >
              🇮🇳 Authentic / Valid
            </button>
            <button
              type="button"
              onClick={() => updateCondition('AUTO')}
              className={`px-2 py-2 text-[11px] font-bold rounded-lg transition text-center ${
                documentCondition === 'AUTO'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/60'
              }`}
            >
              🔍 Auto-Detect
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 px-0.5">
            {documentCondition === 'FAKE'
              ? '🚨 Tests fraud detection: Verhoeff checksum failure, spliced font baselines, demographic mismatch, CNN Suspicious prediction.'
              : documentCondition === 'VALID'
              ? '🇮🇳 Tests genuine verification: Valid mathematical checksums, Guilloché anti-counterfeit lines, matched demographics.'
              : '🔍 Auto-detects based on document signatures, filename cues, and optical forensic inspection.'}
          </p>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer ${
          dragActive
            ? 'border-rose-500 bg-rose-950/20'
            : previewUrl
            ? 'border-slate-700 bg-slate-900/30'
            : 'border-slate-800 hover:border-rose-500/50 hover:bg-slate-900/40 bg-slate-950/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {previewUrl ? (
          <div className="flex flex-col items-center space-y-3 w-full">
            <div className="relative group max-h-48 overflow-hidden rounded-xl border border-slate-700 shadow-lg">
              <img
                src={previewUrl}
                alt="Document preview"
                className="max-h-48 object-contain rounded-xl"
              />
              <button
                type="button"
                onClick={clearSelection}
                className="absolute top-2 right-2 rounded-full bg-slate-950/80 p-1.5 text-slate-400 hover:text-rose-400 transition"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-slate-200 truncate max-w-xs">{selectedFileName}</p>
              <p className="text-[11px] text-rose-400">Click or drag another image to replace</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 text-center py-2">
            <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-rose-400 border border-slate-800 shadow-inner">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Drop document scan or <span className="text-rose-400 underline decoration-rose-500/40 underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Supports high-res JPEG, PNG, WebP up to 20MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
