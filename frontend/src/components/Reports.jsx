import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Printer,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Download,
  Calendar,
  FileCheck2
} from 'lucide-react';
import { api } from '../api';

export default function Reports() {
  const [report, setReport] = useState({
    totalDocumentsScreened: 0,
    lowRiskCount: 0,
    mediumRiskCount: 0,
    highRiskCount: 0,
    lowRiskPercentage: 0,
    mediumRiskPercentage: 0,
    highRiskPercentage: 0,
    recentResults: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReport(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-rose-500" />
            <span>Forensic Screening Analytics &amp; Compliance Report</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical breakdown of CNN visual anomaly predictions and optical verification audits.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:border-slate-700 transition"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Export Summary</span>
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
          <p className="text-xs font-semibold text-slate-400">Total Evaluations</p>
          <h3 className="text-2xl font-extrabold text-white font-mono mt-1">
            {report.totalDocumentsScreened}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Processed across all active cases</p>
        </div>

        <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-4">
          <p className="text-xs font-semibold text-rose-300">High Risk Rate</p>
          <h3 className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
            {report.highRiskPercentage}%
          </h3>
          <p className="text-[11px] text-rose-400/80 mt-1">{report.highRiskCount} flagged documents</p>
        </div>

        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4">
          <p className="text-xs font-semibold text-amber-300">Medium Risk Rate</p>
          <h3 className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {report.mediumRiskPercentage}%
          </h3>
          <p className="text-[11px] text-amber-400/80 mt-1">{report.mediumRiskCount} review recommended</p>
        </div>

        <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4">
          <p className="text-xs font-semibold text-emerald-300">Low Risk Rate</p>
          <h3 className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {report.lowRiskPercentage}%
          </h3>
          <p className="text-[11px] text-emerald-400/80 mt-1">{report.lowRiskCount} clear documents</p>
        </div>
      </div>

      {/* Visual Risk Distribution Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Cumulative Risk Distribution
        </h2>

        {report.totalDocumentsScreened > 0 ? (
          <div className="space-y-2">
            <div className="h-4 w-full rounded-full bg-slate-950 flex overflow-hidden border border-slate-800">
              <div
                style={{ width: `${report.highRiskPercentage}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`High Risk: ${report.highRiskPercentage}%`}
              />
              <div
                style={{ width: `${report.mediumRiskPercentage}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Medium Risk: ${report.mediumRiskPercentage}%`}
              />
              <div
                style={{ width: `${report.lowRiskPercentage}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Low Risk: ${report.lowRiskPercentage}%`}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                <span>High Risk ({report.highRiskPercentage}%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Medium Risk ({report.mediumRiskPercentage}%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Low Risk ({report.lowRiskPercentage}%)</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">No screenings recorded yet.</p>
        )}
      </div>

      {/* Recent Evaluations Audit Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
          Recent Evaluated Specimens
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Result ID</th>
                <th className="py-3 px-3">CNN Prediction</th>
                <th className="py-3 px-3">CNN Conf</th>
                <th className="py-3 px-3">OCR Readability</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">Screening Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {report.recentResults && report.recentResults.length > 0 ? (
                report.recentResults.map((r) => {
                  const isHigh = r.riskLevel === 'HIGH';
                  const isMed = r.riskLevel === 'MEDIUM';

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">#{r.id}</td>
                      <td className="py-3 px-3 font-bold">
                        <span className={r.cnnPrediction === 'Suspicious' ? 'text-rose-400' : 'text-emerald-400'}>
                          {r.cnnPrediction || 'Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {r.cnnConfidence ? `${Math.round(r.cnnConfidence * 100)}%` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {r.ocrConfidence ? `${Math.round(r.ocrConfidence * 100)}%` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isHigh
                            ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                            : isMed
                            ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                            : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        }`}>
                          {r.riskLevel || 'LOW'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {r.riskScore || 0}/100
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Just now'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No individual screening results recorded yet.
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
