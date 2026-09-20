import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderArchive,
  BarChart3,
  ShieldCheck,
  FileCheck2,
  Info,
  Code2
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-case', label: 'New Case', icon: PlusCircle, badge: 'Active' },
    { id: 'cases', label: 'Cases', icon: FolderArchive },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { id: 'java-backend', label: 'Java ML Syntax', icon: Code2, badge: 'Easier' }
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-[#0b0f19] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        {/* Navigation Group */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Screening Console
          </p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-950/20'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Model Architecture Quick Reference Card */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs text-slate-400">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold mb-2">
            <FileCheck2 className="h-4 w-4 text-rose-400" />
            <span>AI Pipeline Signals</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-400">
            <li className="flex items-center justify-between">
              <span>Main Model:</span>
              <span className="font-mono text-rose-400">CNN (224x224)</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Optical Signals:</span>
              <span className="font-mono text-slate-300">OpenCV</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Text Extraction:</span>
              <span className="font-mono text-slate-300">Tesseract OCR</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Consistency:</span>
              <span className="font-mono text-slate-300">Multi-doc DOB/Name</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Protocol Notice Footer */}
      <div className="rounded-xl border border-rose-950/40 bg-rose-950/10 p-3 text-[11px] text-rose-300/80 flex items-start space-x-2">
        <Info className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
        <p className="leading-snug">
          High-risk scores flag patterns for authorized review. System does not constitute legal proof.
        </p>
      </div>
    </aside>
  );
}
