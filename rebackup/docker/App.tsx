import React, { useState, useMemo } from 'react';
import { CONTENT } from './constants';
import { Language } from './types';
import { Terminal } from './components/Terminal';
import { Accordion } from './components/Accordion';
import { 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  Globe, 
  CheckCircle2, 
  Circle,
  Factory,
  BrainCircuit,
  Award,
  BookOpen
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const t = CONTENT[lang];
  const isComplete = currentStep >= t.challenges.length;

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const progress = Math.min(((completedSteps.length) / t.challenges.length) * 100, 100);

  const currentChallenge = isComplete ? null : t.challenges[currentStep];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg shadow-lg shadow-orange-500/20">
                <Factory className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  {t.header.title}
                </h1>
                <p className="text-xs text-orange-400 font-medium tracking-wide uppercase">
                  {t.header.badge}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Progress Bar */}
              <div className="hidden md:flex flex-col gap-1 min-w-[200px]">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Lab Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Language Toggle */}
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${lang === 'en' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('nl')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${lang === 'nl' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  NL
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {isComplete ? (
          /* Completion View */
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500"></div>
              
              <div className="inline-flex items-center justify-center p-4 bg-green-500/10 rounded-full mb-6">
                <Award className="w-16 h-16 text-green-500" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{t.completion.title}</h2>
              <p className="text-orange-400 font-medium mb-12">{t.completion.badge}</p>

              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                    <BrainCircuit size={20} className="text-blue-400" />
                    {t.completion.learnedTitle}
                  </h3>
                  <ul className="space-y-3">
                    {t.completion.learnedPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                    <Factory size={20} className="text-orange-400" />
                    {t.completion.applyTitle}
                  </h3>
                  <ul className="space-y-3">
                    {t.completion.applyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                        <ShieldCheck size={16} className="text-orange-500 mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-12 flex justify-center">
                <button 
                  onClick={() => {setCurrentStep(0); setCompletedSteps([]); window.scrollTo(0,0);}}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium text-sm border border-slate-700"
                >
                  Reset Lab
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Challenge Wizard */
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Sidebar / Stepper */}
            <div className="lg:col-span-3">
              <nav aria-label="Progress" className="sticky top-24">
                <ol role="list" className="overflow-hidden">
                  {t.challenges.map((step, stepIdx) => (
                    <li key={step.id} className={`relative ${stepIdx !== t.challenges.length - 1 ? 'pb-10' : ''}`}>
                      {stepIdx !== t.challenges.length - 1 ? (
                        <div className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${stepIdx < currentStep ? 'bg-orange-500' : 'bg-slate-800'}`} aria-hidden="true" />
                      ) : null}
                      <div className="relative flex items-start group">
                        <span className="flex h-9 items-center">
                          <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                            stepIdx < currentStep ? 'bg-orange-500 border-orange-500' : 
                            stepIdx === currentStep ? 'bg-slate-900 border-orange-500 animate-pulse' : 
                            'bg-slate-900 border-slate-700'
                          }`}>
                            {stepIdx < currentStep ? (
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            ) : (
                              <span className={`text-xs font-bold ${stepIdx === currentStep ? 'text-orange-500' : 'text-slate-500'}`}>{step.id}</span>
                            )}
                          </span>
                        </span>
                        <span className="ml-4 flex min-w-0 flex-col pt-1.5">
                          <span className={`text-sm font-semibold tracking-wide ${stepIdx === currentStep ? 'text-orange-500' : 'text-slate-400'}`}>{step.title}</span>
                          <span className="text-xs text-slate-500">{step.difficulty}</span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-8">
              
              {/* Theory Card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 md:p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <BrainCircuit className="text-blue-400" size={24} />
                  <h2 className="text-xl font-bold text-white">{currentChallenge?.theory.title}</h2>
                </div>
                
                <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-p:leading-relaxed">
                  <p dangerouslySetInnerHTML={{ __html: currentChallenge?.theory.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') || '' }} />
                </div>

                {/* Visual Aid */}
                {currentChallenge?.theory.visual && (
                  <div className="mt-8 animate-in fade-in duration-500">
                    {currentChallenge.theory.visual}
                  </div>
                )}

                {/* Analogy Box */}
                {currentChallenge?.theory.analogy && (
                  <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-4 items-start">
                    <BookOpen className="text-blue-400 shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-300 mb-1">Concept Analogy</h4>
                      <p className="text-sm text-slate-300">{currentChallenge.theory.analogy}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Real World Scenario Card */}
              {currentChallenge?.realWorld && (
                 <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Globe size={100} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-orange-400 uppercase tracking-wide mb-2">
                        <Globe size={16} /> Real World Application
                      </h3>
                      <h4 className="text-lg font-bold text-white mb-2">{currentChallenge.realWorld.title}</h4>
                      <p className="text-slate-300 text-sm mb-4">{currentChallenge.realWorld.description}</p>
                      <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800/50 text-sm text-slate-400 italic">
                        "{currentChallenge.realWorld.scenario}"
                      </div>
                    </div>
                 </div>
              )}

              {/* Action/Terminal Card */}
              <div className="bg-black/40 border border-slate-800 rounded-xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <TerminalIcon className="text-green-500" size={24} />
                  <h2 className="text-xl font-bold text-white">{currentChallenge?.task.title}</h2>
                </div>

                <div className="space-y-6 relative z-10">
                  {currentChallenge?.task.steps.map((step, idx) => (
                    <Terminal 
                      key={idx}
                      label={step.label}
                      command={step.command}
                      output={step.output}
                      context={step.context}
                    />
                  ))}
                </div>
              </div>

              {/* Hints & Help */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">Assistance</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {currentChallenge?.hints.map((hint, idx) => (
                    <Accordion key={idx} hint={hint} />
                  ))}
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-8 border-t border-slate-800">
                 <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    currentStep === 0 
                    ? 'text-slate-600 cursor-not-allowed' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg font-bold shadow-lg shadow-orange-900/20 transform active:scale-95 transition-all"
                >
                  {currentStep === t.challenges.length - 1 ? 'Finish Lab' : 'Next Step'}
                  {currentStep === t.challenges.length - 1 ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Icon for the terminal header
const TerminalIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);