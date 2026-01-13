import React, { useState } from 'react';
import { Copy, Check, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  command?: string;
  tabs?: { label: string; command: string }[];
  output?: string;
  label?: string;
  context?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ command, tabs, output, label, context }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const currentCommand = tabs ? tabs[activeTab].command : command;

  const handleCopy = () => {
    if (currentCommand) {
      navigator.clipboard.writeText(currentCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mb-6 w-full max-w-2xl">
      {label && <p className="text-sm text-slate-400 mb-2 font-medium">{label}</p>}
      <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="flex items-center text-xs text-slate-400 font-mono font-medium">
            <TerminalIcon size={12} className="mr-2 opacity-50" />
            {context || 'bash'}
          </div>
        </div>
        
        {/* Tabs (Optional) */}
        {tabs && (
          <div className="flex border-b border-slate-800 bg-slate-900/30">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 text-xs font-medium transition-colors border-r border-slate-800 ${
                  activeTab === index 
                    ? 'text-orange-400 bg-slate-800/50' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Terminal Body */}
        <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto">
          {currentCommand && (
            <div className="flex items-start group">
              <span className="text-green-500 mr-2 shrink-0">$</span>
              <span className="text-slate-200 flex-1 break-all whitespace-pre-wrap">{currentCommand}</span>
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-slate-400 hover:text-white"
                title="Copy command"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          )}
          
          {output && (
            <div className="mt-2 text-slate-400 border-t border-slate-800/50 pt-2 pb-1 pl-4 border-l-2 border-slate-700">
              <pre className="whitespace-pre-wrap text-xs">{output}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};