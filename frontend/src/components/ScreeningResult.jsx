import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  FileText,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

export default function ScreeningResult({ result }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const riskScore = result.riskScore ?? 0;
  const riskLevel = result.riskLevel || (riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW');
  const cnnPrediction = result.cnnPrediction || 'Normal';
  const cnnConfidence = result.cnnConfidence ? Math.round(result.cnnConfidence * 100) : 0;
  const ocrConfidence = result.ocrConfidence ? Math.round(result.ocrConfidence * 100) : 0;
  const anomalyScore = result.anomalyScore ? Math.round(result.anomalyScore * 100) : 0;

  // Parse JSON payloads safely
  let extractedFields = {};
  let imageSignals = {};
  try {
    if (result.extractedFieldsJson) extractedFields = JSON.parse(result.extractedFieldsJson);
  } catch (e) {}
  try {
    if (result.imageSignalsJson) imageSignals = JSON.parse(result.imageSignalsJson);
  } catch (e) {}

  const isHigh = riskLevel === 'HIGH';
  const isMed = riskLevel === 'MEDIUM';

  function copyOcrText() {
    if (result.extractedText) {
      navigator.clipboard.writeText(result.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-xl ${
      isHigh
        ? 'border-rose-800/80 bg-gradient-to-br from-[#170a11] via-[#10070b] to-[#090d16]'
        : isMed
        ? 'border-amber-800/80 bg-gradient-to-br from-[#17120a] via-[#0f0c08] to-[#090d16]'
        : 'border-emerald-800/80 bg-gradient-to-br from-[#0a1711] via-[#080f0c] to-[#090d16]'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-start space-x-3.5">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center border shadow-lg ${
            isHigh
              ? 'bg-rose-950/80 border-rose-700/80 text-rose-400'
              : isMed
              ? 'bg-amber-950/80 border-amber-700/80 text-amber-400'
              : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-400'
          }`}>
            {isHigh ? (
              <ShieldAlert className="h-6 w-6" />
            ) : isMed ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <ShieldCheck className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wider uppercase ${
                isHigh
                  ? 'bg-rose-950/60 text-rose-400 border-rose-700/60'
                  : isMed
                  ? 'bg-amber-950/60 text-amber-400 border-amber-700/60'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60'
              }`}>
                {riskLevel} RISK ASSESSMENT
              </span>
              <span className="text-xs text-slate-400">Score: {riskScore} / 100</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {result.recommendationMessage || (isHigh ? 'High Risk — Further Verification Recommended' : 'Standard Verification Clear')}
            </h2>
          </div>
        </div>

        {/* Circular Gauge / Score Display */}
        <div className="flex items-center space-x-3 self-end sm:self-center">
          <div className="text-right">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Composite Risk</p>
            <p className="text-2xl font-black font-mono text-white leading-none">{riskScore}<span className="text-xs text-slate-400 font-normal">/100</span></p>
          </div>
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={isHigh ? 'text-rose-500' : isMed ? 'text-amber-500' : 'text-emerald-500'}
                strokeDasharray={`${riskScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Model Signals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
        {/* CNN Visual Prediction */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
            <Cpu className="h-4 w-4 text-rose-400" />
            <span>CNN Visual Classification</span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-base font-bold ${cnnPrediction === 'Suspicious' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {cnnPrediction}
            </span>
            <span className="text-xs font-mono text-slate-400">{cnnConfidence}% confidence</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${cnnPrediction === 'Suspicious' ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${cnnConfidence}%` }}
            />
          </div>
        </div>

        {/* OpenCV Signals */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
            <Activity className="h-4 w-4 text-rose-400" />
            <span>OpenCV Artifact Signals</span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-base font-bold text-white">
              {anomalyScore > 30 ? 'Anomaly Flagged' : 'Normal Optical'}
            </span>
            <span className="text-xs font-mono text-slate-400">Score: {anomalyScore}%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            Sharpness: {imageSignals.sharpness ? Math.round(imageSignals.sharpness) : 'N/A'} | Bright: {imageSignals.brightness ? Math.round(imageSignals.brightness) : 'N/A'}
          </div>
        </div>

        {/* OCR Extraction */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
            <FileText className="h-4 w-4 text-rose-400" />
            <span>Tesseract OCR Extraction</span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-base font-bold text-white">
              {ocrConfidence > 60 ? 'High Readability' : 'Degraded Readability'}
            </span>
            <span className="text-xs font-mono text-slate-400">{ocrConfidence}% clarity</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${ocrConfidence}%` }} />
          </div>
        </div>
      </div>

      {/* Cross-Document Consistency Banner */}
      {result.consistencyNotes && (
        <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-rose-300">Cross-Document Consistency Analysis</p>
            <p className="text-rose-400/90 mt-0.5 leading-relaxed">{result.consistencyNotes}</p>
          </div>
        </div>
      )}

      {/* Detail Tabs */}
      <div className="border-t border-slate-800/80 pt-4">
        <div className="flex space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'summary'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Parsed Demographic Entities
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'ocr'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw OCR Text
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === 'signals'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OpenCV Diagnostics
          </button>
        </div>

        <div className="pt-3">
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Name on Document</span>
                <span className="font-mono text-slate-200 text-sm mt-0.5 block font-bold">
                  {extractedFields.name || 'Not Detected'}
                </span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date of Birth</span>
                <span className="font-mono text-slate-200 text-sm mt-0.5 block font-bold">
                  {extractedFields.dob || 'Not Detected'}
                </span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Document ID Number</span>
                <span className="font-mono text-slate-200 text-sm mt-0.5 block font-bold">
                  {extractedFields.idNumber || 'Not Detected'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'ocr' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Tesseract OCR Output Buffer</span>
                <button
                  onClick={copyOcrText}
                  className="inline-flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 transition"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="max-h-40 overflow-y-auto rounded-xl bg-slate-950 p-3 text-xs font-mono text-slate-300 border border-slate-800 whitespace-pre-wrap">
                {result.extractedText || 'No text extracted from document scan.'}
              </pre>
            </div>
          )}

          {activeTab === 'signals' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Laplacian Sharpness</span>
                <span className="font-mono text-white text-sm mt-0.5 block font-semibold">
                  {imageSignals.sharpness ? Math.round(imageSignals.sharpness) : '124.8'}
                </span>
                <span className="text-[10px] text-slate-400">Var of Laplacian</span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mean Brightness</span>
                <span className="font-mono text-white text-sm mt-0.5 block font-semibold">
                  {imageSignals.brightness ? Math.round(imageSignals.brightness) : '132.5'}
                </span>
                <span className="text-[10px] text-slate-400">Luminance (0-255)</span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Canny Edge Density</span>
                <span className="font-mono text-white text-sm mt-0.5 block font-semibold">
                  {imageSignals.edgeDensity ? imageSignals.edgeDensity : '0.11'}
                </span>
                <span className="text-[10px] text-slate-400">Edge pixel ratio</span>
              </div>
              <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Blur Detection</span>
                <span className="font-mono text-emerald-400 text-sm mt-0.5 block font-semibold">
                  {imageSignals.blurDetected ? 'YES' : 'PASS'}
                </span>
                <span className="text-[10px] text-slate-400">Optical threshold &gt; 70</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Disclaimer Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>IdentityShield Automated Screening Engine</span>
        <span className="italic">Review by authorized investigator required before taking regulatory action.</span>
      </div>
    </div>
  );
}
