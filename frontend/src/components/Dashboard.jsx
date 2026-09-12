import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  Files,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';

export default function Dashboard({ setActiveTab, setSelectedCaseId }) {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalDocumentsScreened: 0,
    highRiskCases: 0,
    mediumRiskCases: 0,
    lowRiskCases: 0,
    recentCases: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await api.getDashboard();
      setStats(data);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-[#0f172a] to-slate-900/90 p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/20">
              OPERATIONAL DASHBOARD
            </span>
            <span className="text-xs text-slate-400">Live Intake &amp; Forensics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Document Risk &amp; Identity Center</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Automated visual screening with Convolutional Neural Network (CNN), OpenCV artifact signals, and cross-document demographic validation.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('new-case')}
          className="inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/40 hover:from-rose-500 hover:to-rose-600 transition"
        >
          <Sparkles className="h-4 w-4" />
          <span>New Screening Case</span>
        </button>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Cases */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Total Cases</p>
            <div className="h-8 w-8 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-300">
              <FolderKanban className="h-4 w-4 text-slate-300" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-white font-mono">{stats.totalCases}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Active investigation cases</p>
          </div>
        </div>

        {/* Total Documents Screened */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">Docs Screened</p>
            <div className="h-8 w-8 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-300">
              <Files className="h-4 w-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-white font-mono">{stats.totalDocumentsScreened}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Multi-doc attachments</p>
          </div>
        </div>

        {/* High Risk */}
        <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-300">High Risk</p>
            <div className="h-8 w-8 rounded-lg bg-rose-900/30 flex items-center justify-center text-rose-400 border border-rose-800/40">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-rose-200 font-mono">{stats.highRiskCases}</h3>
            <p className="text-[11px] text-rose-400/80 mt-0.5">Score &ge; 60 (Review needed)</p>
          </div>
        </div>

        {/* Medium Risk */}
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-300">Medium Risk</p>
            <div className="h-8 w-8 rounded-lg bg-amber-900/30 flex items-center justify-center text-amber-400 border border-amber-800/40">
              <AlertCircle className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-amber-200 font-mono">{stats.mediumRiskCases}</h3>
            <p className="text-[11px] text-amber-400/80 mt-0.5">Score 30 - 59</p>
          </div>
        </div>

        {/* Low Risk */}
        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4 col-span-2 lg:col-span-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-300">Low Risk</p>
            <div className="h-8 w-8 rounded-lg bg-emerald-900/30 flex items-center justify-center text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-emerald-200 font-mono">{stats.lowRiskCases}</h3>
            <p className="text-[11px] text-emerald-400/80 mt-0.5">Score 0 - 29 (Eligible)</p>
          </div>
        </div>
      </div>

      {/* Recent Screenings Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Screening Cases</h2>
            <p className="text-xs text-slate-400">Recently registered cases and composite assessment status</p>
          </div>
          <button
            onClick={() => setActiveTab('cases')}
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 transition"
          >
            <span>View all cases</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Case ID</th>
                <th className="py-3 px-3">Case Name</th>
                <th className="py-3 px-3">Applicant</th>
                <th className="py-3 px-3 text-center">Docs</th>
                <th className="py-3 px-3">Risk Assessment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats.recentCases && stats.recentCases.length > 0 ? (
                stats.recentCases.map((c) => {
                  const riskLevel = c.overallRiskLevel || 'LOW';
                  const riskScore = c.overallRiskScore || 0;
                  const isHigh = riskLevel === 'HIGH';
                  const isMed = riskLevel === 'MEDIUM';

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-rose-400">{c.caseNumber}</td>
                      <td className="py-3 px-3 font-medium text-white max-w-[200px] truncate">{c.caseName}</td>
                      <td className="py-3 px-3 text-slate-400">{c.applicantName || 'Not Specified'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                          {c.documents ? c.documents.length : 0}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isHigh
                              ? 'bg-rose-950/50 text-rose-400 border-rose-800/60'
                              : isMed
                              ? 'bg-amber-950/50 text-amber-400 border-amber-800/60'
                              : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                          }`}>
                            {riskLevel} ({riskScore}/100)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-400 capitalize">
                          {c.status ? c.status.replace('_', ' ').toLowerCase() : 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedCaseId(c.id);
                            setActiveTab('cases');
                          }}
                          className="inline-flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition"
                        >
                          <Eye className="h-3 w-3 text-slate-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No cases screened yet. Click &quot;New Screening Case&quot; to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
