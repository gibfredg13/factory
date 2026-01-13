import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, Info, ShieldAlert, Terminal, CheckCircle } from 'lucide-react';
import { Hint } from '../types';

export const Accordion: React.FC<{ hint: Hint }> = ({ hint }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = () => {
    switch (hint.type) {
      case 'ing': return <ShieldAlert className="text-orange-500" size={18} />;
      case 'setup': return <Terminal className="text-purple-400" size={18} />;
      case 'solution': return <CheckCircle className="text-red-400" size={18} />;
      default: return <Lightbulb className="text-blue-400" size={18} />;
    }
  };

  const getBorderColor = () => {
    switch (hint.type) {
      case 'ing': return 'border-orange-500/30 bg-orange-500/5';
      case 'setup': return 'border-purple-500/30 bg-purple-500/5';
      case 'solution': return 'border-red-500/30 bg-red-500/5';
      default: return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <div className={`mb-3 rounded-lg border ${getBorderColor()} transition-all duration-200 overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {getIcon()}
          <span className="font-medium text-slate-200 text-sm">{hint.title}</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 pt-0 text-sm text-slate-300 leading-relaxed animate-in slide-in-from-top-2 duration-200">
          <div className="pl-8">{hint.content}</div>
        </div>
      )}
    </div>
  );
};