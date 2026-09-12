import React, { useEffect, useState } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Files,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Upload,
  Play,
  ArrowLeft
} from 'lucide-react';
import { api } from '../api';
import ScreeningResult from './ScreeningResult';
import DocumentUpload from './DocumentUpload';

export default function Cases({ selectedCaseId, setSelectedCaseId }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [detailedCase, setDetailedCase] = useState(null);
  const [activeDocResult, setActiveDocResult] = useState(null);

  // Additional doc upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('UTILITY_BILL');
  const [newFile, setNewFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      loadDetailedCase(selectedCaseId);
    }
  }, [selectedCaseId]);

  async function loadCases() {
    setLoading(true);
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetailedCase(id) {
    try {
      const data = await api.getCaseById(id);
      setDetailedCase(data);
      // Auto select first document result if available
      if (data.documents && data.documents.length > 0) {
        const firstWithResult = data.documents.find(d => d.screeningResults && d.screeningResults.length > 0);
        if (firstWithResult) {
          setActiveDocResult(firstWithResult.screeningResults[0]);
        } else {
          setActiveDocResult(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch detailed case:", err);
    }
  }

  async function handleAddDocument() {
    if (!newFile || !detailedCase) return;
    setIsUploading(true);
    try {
      const uploaded = await api.uploadDocument(detailedCase.id, newFile, uploadDocType);
      const screened = await api.screenDocument(uploaded.id, detailedCase.id);
      // Reload case
      await loadDetailedCase(detailedCase.id);
      await loadCases();
      setShowUploadModal(false);
      setNewFile(null);
      setActiveDocResult(screened);
    } catch (err) {
      alert("Failed to attach & screen document: " + err.message);
    } finally {
      setIsUploading(false);
    }
  }

  const filteredCases = cases.filter(c => {
    const matchesSearch = (c.caseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.applicantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.caseNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || c.overallRiskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Detailed Case View Modal / Screen */}
      {detailedCase ? (
        <div className="space-y-6">
          {/* Back button & Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setDetailedCase(null);
                  setSelectedCaseId(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-rose-400">{detailedCase.caseNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    detailedCase.overallRiskLevel === 'HIGH'
                      ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                      : detailedCase.overallRiskLevel === 'MEDIUM'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                      : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  }`}>
                    {detailedCase.overallRiskLevel || 'LOW'} RISK ({detailedCase.overallRiskScore || 0}/100)
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white mt-0.5">{detailedCase.caseName}</h1>
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center space-x-2 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:border-slate-700 transition"
            >
              <Upload className="h-4 w-4" />
              <span>Attach Additional Document</span>
            </button>
          </div>

          {/* Case Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Applicant Legal Name</span>
              <span className="font-semibold text-white mt-0.5 block">{detailedCase.applicantName || 'Unspecified'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Documents</span>
              <span className="font-semibold text-white mt-0.5 block">{detailedCase.documents?.length || 0} attached</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Investigation Status</span>
              <span className="font-semibold text-white mt-0.5 block capitalize">{detailedCase.status?.replace('_', ' ').toLowerCase()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registration Date</span>
              <span className="font-semibold text-white mt-0.5 block">
                {detailedCase.createdAt ? new Date(detailedCase.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Attached Documents Carousel / List */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Attached Case Documents ({detailedCase.documents?.length || 0})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {detailedCase.documents && detailedCase.documents.map((doc) => {
                const latestResult = doc.screeningResults && doc.screeningResults.length > 0 ? doc.screeningResults[0] : null;
                const isSelected = activeDocResult && activeDocResult.id === latestResult?.id;

                return (
                  <div
                    key={doc.id}
                    onClick={() => latestResult && setActiveDocResult(latestResult)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/20'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                        {doc.documentType}
                      </span>
                      {latestResult && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          latestResult.riskLevel === 'HIGH'
                            ? 'text-rose-400 border-rose-800/60 bg-rose-950/50'
                            : latestResult.riskLevel === 'MEDIUM'
                            ? 'text-amber-400 border-amber-800/60 bg-amber-950/50'
                            : 'text-emerald-400 border-emerald-800/60 bg-emerald-950/50'
                        }`}>
                          {latestResult.riskLevel} ({latestResult.riskScore}/100)
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-white mt-2 truncate">{doc.fileName}</p>
                    {latestResult ? (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">CNN Prediction:</span>
                          <span className={latestResult.cnnPrediction === 'Suspicious' ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                            {latestResult.cnnPrediction}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">P(Suspicious):</span>
                          <span className="text-rose-400 font-bold">
                            {(() => {
                              const pSusp = latestResult.suspiciousProbability !== undefined
                                ? Number(latestResult.suspiciousProbability)
                                : (latestResult.cnnPrediction === 'Suspicious' ? Number(latestResult.cnnConfidence || 0.75) : Number((1 - (latestResult.cnnConfidence || 0.5)).toFixed(4)));
                              return `${(pSusp * 100).toFixed(1)}%`;
                            })()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">Awaiting screening</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Document Inspection */}
          {activeDocResult ? (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Document Forensics &amp; Signal Breakdown:
              </p>
              <ScreeningResult result={activeDocResult} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400 text-xs">
              Select an attached document above to inspect its forensic screening signals.
            </div>
          )}

          {/* Add Document Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Attach Document to Case</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <DocumentUpload
                  onFileSelected={setNewFile}
                  documentType={uploadDocType}
                  setDocumentType={setUploadDocType}
                />

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!newFile || isUploading}
                    onClick={handleAddDocument}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                  >
                    {isUploading ? 'Screening Document...' : 'Upload & Screen'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Case Registry Table View */
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
                <FolderArchive className="h-6 w-6 text-rose-500" />
                <span>Screening Cases Registry</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Central repository of all onboarding identity cases and forensic audit records.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search case or applicant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition w-48 sm:w-60"
                />
              </div>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none transition"
              >
                <option value="ALL">All Risks</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          {/* Cases Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Case Number</th>
                    <th className="py-3.5 px-4">Case Name</th>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4 text-center">Docs Attached</th>
                    <th className="py-3.5 px-4">Composite Risk</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredCases.length > 0 ? (
                    filteredCases.map((c) => {
                      const isHigh = c.overallRiskLevel === 'HIGH';
                      const isMed = c.overallRiskLevel === 'MEDIUM';

                      return (
                        <tr
                          key={c.id}
                          onClick={() => loadDetailedCase(c.id)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-rose-400">{c.caseNumber}</td>
                          <td className="py-3.5 px-4 font-semibold text-white max-w-[220px] truncate">{c.caseName}</td>
                          <td className="py-3.5 px-4 text-slate-400">{c.applicantName || '—'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                              {c.documents ? c.documents.length : 0}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isHigh
                                ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                                : isMed
                                ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                                : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            }`}>
                              {c.overallRiskLevel || 'LOW'} ({c.overallRiskScore || 0}/100)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <ChevronRight className="h-4 w-4 text-slate-400 inline" />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {loading ? 'Loading registry...' : 'No matching cases found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
