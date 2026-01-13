import React from 'react';
import { Server, Box, Lock, Search, Key, Database, Globe, Container } from 'lucide-react';

export const DockerDiagram = () => (
  <div className="w-full p-6 bg-slate-950/50 rounded-lg border border-slate-800 flex flex-col items-center gap-4 mt-6">
    <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Virtual Lab Architecture</div>
    <div className="relative w-full max-w-md bg-slate-900 rounded-lg border-2 border-slate-700 p-6 flex flex-col gap-4 shadow-xl">
        <div className="absolute -top-3 left-4 bg-slate-700 px-3 py-0.5 text-xs text-white rounded shadow-sm">Host Machine (Your Computer)</div>
        
        {/* Docker Engine Layer */}
        <div className="flex-1 border-2 border-dashed border-slate-600 rounded-lg p-4 relative bg-slate-800/30">
            <div className="absolute -top-3 left-4 bg-blue-600 px-2 py-0.5 text-xs text-white rounded shadow-sm">Docker Engine</div>
            
            {/* Containers */}
            <div className="flex gap-4 w-full justify-center pt-2">
                 {/* Attacker Container */}
                 <div className="flex-1 bg-slate-800 border border-green-500/40 rounded-lg p-3 flex flex-col items-center gap-2 shadow-lg shadow-green-900/10">
                    <div className="bg-green-500/10 p-2.5 rounded-full ring-1 ring-green-500/20"><Box size={24} className="text-green-500" /></div>
                    <span className="text-xs font-mono text-green-400 font-semibold">Kali (Attacker)</span>
                 </div>
                 
                 {/* Target Container */}
                 <div className="flex-1 bg-slate-800 border border-red-500/40 rounded-lg p-3 flex flex-col items-center gap-2 shadow-lg shadow-red-900/10">
                    <div className="bg-red-500/10 p-2.5 rounded-full ring-1 ring-red-500/20"><Server size={24} className="text-red-500" /></div>
                    <span className="text-xs font-mono text-red-400 font-semibold">Target App</span>
                 </div>
            </div>
        </div>
    </div>
  </div>
);

export const NetworkScanDiagram = () => (
    <div className="w-full p-6 bg-slate-950/50 rounded-lg border border-slate-800 flex flex-col items-center gap-4 mt-6">
    <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Port Scanning Process</div>
    <div className="flex items-center justify-between w-full max-w-lg gap-4 relative py-4">
        {/* Attacker */}
        <div className="flex flex-col items-center z-10">
             <div className="w-14 h-14 bg-slate-900 border-2 border-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <Search size={24} className="text-green-500" />
             </div>
             <span className="text-xs mt-3 text-green-400 font-bold tracking-wide">ATTACKER</span>
        </div>

        {/* Animation Lines */}
        <div className="flex-1 h-24 flex flex-col justify-center relative mx-4">
            <div className="absolute top-[35%] w-full h-0.5 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
            <div className="absolute top-[65%] w-full h-0.5 bg-gradient-to-l from-transparent via-red-500/50 to-transparent"></div>
            
            <div className="absolute top-2 left-0 w-full text-center text-[10px] text-green-400 font-mono">1. SYN Packet →</div>
            <div className="absolute bottom-2 left-0 w-full text-center text-[10px] text-red-400 font-mono">← 2. SYN-ACK Reply</div>
        </div>

        {/* Target */}
        <div className="flex flex-col gap-3 z-10 bg-slate-900 p-3 rounded-lg border border-slate-700 shadow-lg">
            <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-slate-800 border border-red-500/50 rounded flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">
                    <span className="text-xs font-mono text-red-400 font-bold">2375</span>
                 </div>
                 <span className="text-xs text-slate-300 font-medium">Docker API (Open)</span>
            </div>
            <div className="flex items-center gap-3 opacity-40">
                 <div className="w-8 h-8 bg-slate-800 border border-slate-600 rounded flex items-center justify-center">
                    <span className="text-xs font-mono text-slate-500">80</span>
                 </div>
                 <span className="text-xs text-slate-500">HTTP (Closed)</span>
            </div>
        </div>
    </div>
    </div>
);

export const ExploitDiagram = () => (
    <div className="w-full p-6 bg-slate-950/50 rounded-lg border border-slate-800 flex flex-col items-center gap-4 mt-6">
      <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Privilege Escalation Path</div>
      <div className="flex flex-col md:flex-row items-center w-full max-w-xl justify-center gap-6 md:gap-8 relative">
        
        {/* Step 1: Malicious Container */}
        <div className="flex flex-col items-center group relative z-10">
            <div className="w-16 h-16 bg-slate-900 border-2 border-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all transform group-hover:-translate-y-1">
                <Box className="text-purple-400" size={28} />
            </div>
            <span className="text-xs text-center text-purple-300 font-bold">Malicious<br/>Container</span>
        </div>

        {/* Arrow 1 */}
        <div className="hidden md:block h-0.5 w-16 bg-slate-700 relative">
            <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-700 transform rotate-45"></div>
        </div>

        {/* Step 2: API Abuse */}
        <div className="flex flex-col items-center group relative z-10">
            <div className="w-16 h-16 bg-slate-900 border-2 border-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all transform group-hover:-translate-y-1">
                <Globe className="text-orange-400" size={28} />
            </div>
            <span className="text-xs text-center text-orange-300 font-bold">Exposed<br/>API (No Auth)</span>
        </div>

        {/* Arrow 2 */}
        <div className="hidden md:block h-0.5 w-16 bg-slate-700 relative">
            <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-700 transform rotate-45"></div>
        </div>

        {/* Step 3: Host Access */}
        <div className="flex flex-col items-center group relative z-10">
            <div className="w-16 h-16 bg-slate-900 border-2 border-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all transform group-hover:-translate-y-1">
                <Database className="text-green-400" size={28} />
            </div>
            <span className="text-xs text-center text-green-300 font-bold">Host Root<br/>Access</span>
        </div>
      </div>
    </div>
);