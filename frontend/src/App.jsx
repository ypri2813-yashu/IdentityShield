import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import NewCase from './components/NewCase';
import Cases from './components/Cases';
import Reports from './components/Reports';
import AuditLogs from './components/AuditLogs';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ isOnline: false, error: null });

  useEffect(() => {
    checkHealth();
    // Check health every 30s
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkHealth() {
    const status = await api.checkHealth();
    setBackendStatus(status);
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar backendStatus={backendStatus} onRefreshBackend={checkHealth} />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                setActiveTab={setActiveTab}
                setSelectedCaseId={setSelectedCaseId}
              />
            )}

            {activeTab === 'new-case' && (
              <NewCase
                setActiveTab={setActiveTab}
                setSelectedCaseId={setSelectedCaseId}
              />
            )}

            {activeTab === 'cases' && (
              <Cases
                selectedCaseId={selectedCaseId}
                setSelectedCaseId={setSelectedCaseId}
              />
            )}

            {activeTab === 'reports' && <Reports />}

            {activeTab === 'audit-logs' && <AuditLogs />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden border-t border-slate-800 bg-[#0b0f19] px-4 py-2 flex items-center justify-around text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`p-2 rounded-lg ${activeTab === 'dashboard' ? 'text-rose-500 font-bold' : 'text-slate-400'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('new-case')}
          className={`p-2 rounded-lg ${activeTab === 'new-case' ? 'text-rose-500 font-bold' : 'text-slate-400'}`}
        >
          New Case
        </button>
        <button
          onClick={() => setActiveTab('cases')}
          className={`p-2 rounded-lg ${activeTab === 'cases' ? 'text-rose-500 font-bold' : 'text-slate-400'}`}
        >
          Cases
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`p-2 rounded-lg ${activeTab === 'reports' ? 'text-rose-500 font-bold' : 'text-slate-400'}`}
        >
          Reports
        </button>
        <button
          onClick={() => setActiveTab('audit-logs')}
          className={`p-2 rounded-lg ${activeTab === 'audit-logs' ? 'text-rose-500 font-bold' : 'text-slate-400'}`}
        >
          Audit
        </button>
      </div>
    </div>
  );
}
