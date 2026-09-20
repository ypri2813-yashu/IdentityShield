import React from 'react';
import { ShieldAlert, ShieldCheck, Cpu, HardDrive, RefreshCw, Radio, Code2 } from 'lucide-react';

export default function Navbar({ backendStatus, onRefreshBackend, onOpenJavaGuide }) {
  const isConnected = backendStatus?.isOnline;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#090d16]/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-900/30 ring-1 ring-rose-400/30">
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight text-white">Identity<span className="text-rose-500">Shield</span></span>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
              AI FORENSICS
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Document Risk Screening &amp; Consistency Engine</p>
        </div>
      </div>

      {/* Backend & Model Service Status indicators */}
      <div className="flex items-center space-x-2.5">
        {/* Quick Java Syntax Guide link */}
        <button
          onClick={onOpenJavaGuide}
          className="hidden sm:flex items-center space-x-1.5 rounded-full border border-rose-500/30 bg-rose-950/20 px-3 py-1 text-xs text-rose-300 hover:text-white hover:border-rose-500/60 transition"
          title="View Simplified Java ML Backend Syntax"
        >
          <Code2 className="h-3.5 w-3.5 text-rose-400" />
          <span className="font-semibold">Java ML Syntax</span>
        </button>

        {/* Backend Connectivity Badge */}
        <div className={`flex items-center space-x-2 rounded-full px-3 py-1 text-xs border ${
          isConnected
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
        }`}>
          <Radio className={`h-3 w-3 ${isConnected ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
          <span className="font-medium hidden md:inline">
            {isConnected ? 'Spring Boot: Connected (8080)' : 'Standalone Preview Mode'}
          </span>
          <span className="font-medium md:hidden">
            {isConnected ? 'Live API' : 'Preview'}
          </span>
        </div>

        {/* Refresh health check button */}
        <button
          onClick={onRefreshBackend}
          title="Verify Spring Boot &amp; Python ML connection"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        {/* Operator profile pill */}
        <div className="flex items-center space-x-2 rounded-lg border border-slate-800/80 bg-slate-900/60 px-2.5 py-1.5">
          <div className="h-6 w-6 rounded-full bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-xs font-semibold text-rose-300">
            OP
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-slate-200 leading-none">Investigator #402</p>
            <p className="text-[10px] text-slate-400 leading-tight">Compliance Desk</p>
          </div>
        </div>
      </div>
    </header>
  );
}
