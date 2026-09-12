import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Clock,
  User,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(l => {
    const term = searchTerm.toLowerCase();
    return (
      (l.action || '').toLowerCase().includes(term) ||
      (l.details || '').toLowerCase().includes(term) ||
      (l.operator || '').toLowerCase().includes(term) ||
      String(l.caseId || '').includes(term)
    );
  });

  function getActionBadge(action) {
    switch (action) {
      case 'CASE_CREATED':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/60';
      case 'DOCUMENT_UPLOADED':
        return 'bg-purple-950/60 text-purple-400 border-purple-800/60';
      case 'SCREENING_STARTED':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'SCREENING_COMPLETED':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      case 'REPORT_VIEWED':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-rose-500" />
            <span>Regulatory Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable audit trail tracking all operator actions, document uploads, and automated AI screenings.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, details, operator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/80 pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-rose-500 focus:outline-none transition w-64"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Audit Details</th>
                <th className="py-3 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-rose-400">
                      {log.caseId ? `#${log.caseId}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {log.operator || 'system'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {loading ? 'Retrieving audit logs...' : 'No matching audit records found.'}
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
