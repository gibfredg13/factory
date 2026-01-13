import React from 'react';
import { Server, Box, Search, ShieldAlert, Terminal, Target, Wifi } from 'lucide-react';

export const LabSetupDiagram = () => (
  <div className="w-full p-6 bg-slate-950/50 rounded-lg border border-slate-800 flex flex-col items-center gap-4 mt-6">
    <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Lab Network Topology</div>
    
    <div className="relative w-full max-w-md bg-slate-900 rounded-lg border-2 border-slate-700 p-6 flex flex-col gap-4 shadow-xl">
        <div className="absolute -top-3 left-4 bg-slate-700 px-3 py-0.5 text-xs text-white rounded shadow-sm flex items-center gap-2">
            <Wifi size={12} /> Docker Network (172.19.0.0/24)
        </div>
        
        <div className="flex gap-6 w-full justify-center pt-4">
             {/* Attacker Container */}
             <div className="flex-1 bg-slate-800 border border-green-500/40 rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg shadow-green-900/10 relative group">
                <div className="absolute -top-3 bg-slate-950 border border-green-500/50 text-green-400 text-[10px] px-2 py-0.5 rounded-full">You</div>
                <div className="bg-green-500/10 p-3 rounded-full ring-1 ring-green-500/20 group-hover:bg-green-500/20 transition-all"><Terminal size={28} className="text-green-500" /></div>
                <div className="text-center">
                    <div className="text-sm font-mono text-green-400 font-bold">Kali Linux</div>
                    <div className="text-xs text-slate-500">172.19.0.2</div>
                </div>
             </div>

             <div className="flex items-center justify-center">
                <div className="h-0.5 w-8 bg-slate-600"></div>
             </div>
             
             {/* Target Container */}
             <div className="flex-1 bg-slate-800 border border-red-500/40 rounded-lg p-4 flex flex-col items-center gap-2 shadow-lg shadow-red-900/10 group">
                <div className="bg-red-500/10 p-3 rounded-full ring-1 ring-red-500/20 group-hover:bg-red-500/20 transition-all"><Target size={28} className="text-red-500" /></div>
                <div className="text-center">
                    <div className="text-sm font-mono text-red-400 font-bold">BadWeb</div>
                    <div className="text-xs text-slate-500">172.19.0.3</div>
                    <div className="text-[10px] text-orange-400 mt-1 bg-orange-500/10 px-2 py-0.5 rounded">Port 21 Open</div>
                </div>
             </div>
        </div>
    </div>
  </div>
);

export const ScanningDiagram = () => (
    <div className="w-full p-6 bg-slate-950/50 rounded-lg border border-slate-800 flex flex-col items-center gap-4 mt-6">
    <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Nmap Reconnaissance</div>
    <div className="flex items-center justify-between w-full max-w-lg gap-4 relative py-4">
        {/* Attacker */}
        <div className="flex flex-col items-center z-10">
             <div className="w-14 h-14 bg-slate-900 border-2 border-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <Search size={24} className="text-green-500" />
             </div>
             <span className="text-xs mt-3 text-green-400 font-bold tracking-wide">KALI</span>
        </div>

        {/* Animation Lines */}
        <div className="flex-1 h-24 flex flex-col justify-center relative mx-4">
            <div className="absolute top-[35%] w-full h-0.5 bg-gradient-to-r from-transparent via-green-500/50 to-transparent animate-pulse"></div>
            <div className="absolute top-[65%] w-full h-0.5 bg-gradient-to-l from-transparent via-red-500/50 to-transparent animate-pulse delay-75"></div>
            
            <div className="absolute top-2 left-0 w-full text-center text-[10px] text-green-400 font-mono">Scanning Ports...</div>
        </div>

        {/* Target Results */}
        <div className="flex flex-col gap-2 z-10 bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-lg min-w-[120px]">
            <div className="text-[10px] text-slate-500 uppercase mb-1 border-b border-slate-800 pb-1">Scan Results</div>
            
            <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 <span className="text-xs font-mono text-red-400 font-bold">21/tcp FTP</span>
            </div>
            <div className="flex items-center gap-2 opacity-50">
                 <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                 <span className="text-xs font-mono text-slate-400">80/tcp HTTP</span>
            </div>
        </div>
    </div>
    </div>
);

export const MetasploitDiagram = () => (
    <div className="w-full p-6 bg-slate-950/50 rounded-lg border border-slate-800 flex flex-col items-center gap-4 mt-6">
      <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Exploit Chain: CVE-2011-2523</div>
      <div className="flex flex-col md:flex-row items-center w-full max-w-xl justify-center gap-4 md:gap-6 relative">
        
        {/* Step 1: Framework */}
        <div className="flex flex-col items-center group relative z-10">
            <div className="w-14 h-14 bg-slate-900 border-2 border-blue-500 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-blue-500/20 group-hover:-translate-y-1 transition-transform">
                <Box className="text-blue-400" size={24} />
            </div>
            <span className="text-[10px] text-center text-blue-300 font-bold uppercase">Metasploit<br/>Framework</span>
        </div>

        <div className="hidden md:block h-0.5 w-8 bg-slate-700"></div>

        {/* Step 2: Trigger */}
        <div className="flex flex-col items-center group relative z-10">
            <div className="w-14 h-14 bg-slate-900 border-2 border-purple-500 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-purple-500/20 group-hover:-translate-y-1 transition-transform">
                <ShieldAlert className="text-purple-400" size={24} />
            </div>
            <span className="text-[10px] text-center text-purple-300 font-bold uppercase">Backdoor<br/>Trigger</span>
        </div>

        <div className="hidden md:block h-0.5 w-8 bg-slate-700"></div>

        {/* Step 3: Shell */}
        <div className="flex flex-col items-center group relative z-10">
            <div className="w-14 h-14 bg-slate-900 border-2 border-orange-500 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-orange-500/20 group-hover:-translate-y-1 transition-transform">
                <Server className="text-orange-400" size={24} />
            </div>
            <span className="text-[10px] text-center text-orange-300 font-bold uppercase">Port 6200<br/>Shell</span>
        </div>

        <div className="hidden md:block h-0.5 w-8 bg-slate-700"></div>

        {/* Step 4: Root */}
        <div className="flex flex-col items-center group relative z-10">
            <div className="w-14 h-14 bg-slate-900 border-2 border-green-500 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-green-500/20 group-hover:-translate-y-1 transition-transform">
                <Terminal className="text-green-400" size={24} />
            </div>
            <span className="text-[10px] text-center text-green-300 font-bold uppercase">Root<br/>Access</span>
        </div>
      </div>
    </div>
);