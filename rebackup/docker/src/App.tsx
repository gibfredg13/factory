import React, { useState } from 'react';
import { CONTENT } from './constants';
import { Language } from './types';
import { Terminal } from './components/Terminal';
import { Accordion } from './components/Accordion';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const t = CONTENT[lang];
  const progress = Math.min(((completedSteps.length) / t.challenges.length) * 100, 100);

  const handleComplete = (id: number) => {
    if (!completedSteps.includes(id)) {
      setCompletedSteps([...completedSteps, id]);
    }
  };

  const allCompleted = completedSteps.length === t.challenges.length;

  return (
    <div className="container">
      
      {/* Header */}
      <div className="header">
         <div className="language-toggle">
            <button
              onClick={() => setLang('en')}
              className={lang === 'en' ? 'active' : ''}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => setLang('nl')}
              className={lang === 'nl' ? 'active' : ''}
            >
              🇳🇱 NL
            </button>
          </div>

          <div className="ing-factory-badge">{t.header.badge}</div>
          <h1>{t.header.title}</h1>
          <p className="subtitle">"{t.header.subtitle}"</p>
          
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
      </div>

      {/* Score */}
      <div className="score">
        <div>Progress: <span id="score">{Math.round(progress)}</span>%</div>
        <div>Steps: <span id="completed">{completedSteps.length}</span>/{t.challenges.length}</div>
      </div>

      {/* Welcome Note */}
      <div className="important-note">
         <strong>Welcome!</strong> This lab teaches cybersecurity awareness through controlled, educational exercises. 
         <br/>No prior technical experience needed - we'll guide you step by step!
      </div>

      {/* Challenges List */}
      {t.challenges.map((challenge, index) => (
        <div 
            key={challenge.id} 
            id={`challenge${challenge.id}`} 
            className={`challenge-card ${completedSteps.includes(challenge.id) ? 'completed' : ''}`}
        >
          <div className="challenge-title">
            <span>{challenge.id}: {challenge.title}</span>
            <span className={`difficulty ${challenge.difficulty}`}>
                {challenge.difficulty}
            </span>
            {completedSteps.includes(challenge.id) && <span> ✅</span>}
          </div>

          <div className="challenge-description">
            <p dangerouslySetInnerHTML={{ __html: challenge.theory.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            {challenge.theory.analogy && (
                <div style={{marginTop: '10px', fontStyle: 'italic', color: '#aaa'}}>
                    "Analogy: {challenge.theory.analogy}"
                </div>
            )}
          </div>

          {/* Visuals */}
          {challenge.theory.visual && (
             <div className="lab-setup">
                 <h3 style={{color: '#ff6600', marginBottom: '10px'}}>Visual Aid</h3>
                 {challenge.theory.visual}
             </div>
          )}

          {/* Task Steps (Terminal) */}
          <div className="step-by-step">
            {challenge.task.steps.map((step, stepIdx) => (
                <div key={stepIdx} className="step">
                    <strong>{step.label}</strong>
                    <Terminal 
                        command={step.command} 
                        output={step.output} 
                        tabs={step.tabs}
                    />
                </div>
            ))}
          </div>

          {/* Hints Section */}
          <div className="hint-section">
             {challenge.hints.map((hint, i) => (
                 <Accordion key={i} hint={hint} />
             ))}
             
             {/* Completion Button */}
             {!completedSteps.includes(challenge.id) && (
                 <button 
                    className="hint-button solution" 
                    onClick={() => handleComplete(challenge.id)}
                 >
                    ✅ Complete Step
                 </button>
             )}
          </div>

        </div>
      ))}

      {/* Completion Card */}
      {allCompleted && (
          <div className="challenge-card" style={{borderColor: '#00ff00'}}>
             <div className="challenge-title" style={{justifyContent: 'center', color: '#00ff00'}}>
                {t.completion.title}
             </div>
             <div className="completion-badge">
                {t.completion.badge}
             </div>
             
             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div className="security-tip" style={{borderColor: '#2196F3', color: '#fff'}}>
                    <h3 style={{color: '#2196F3', borderBottom: '1px solid #2196F3', paddingBottom: '10px', marginBottom: '10px'}}>
                        {t.completion.learnedTitle}
                    </h3>
                    <ul>
                        {t.completion.learnedPoints.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                </div>
                
                <div className="security-tip" style={{borderColor: '#ff6600', color: '#fff'}}>
                     <h3 style={{color: '#ff6600', borderBottom: '1px solid #ff6600', paddingBottom: '10px', marginBottom: '10px'}}>
                        {t.completion.applyTitle}
                    </h3>
                    <ul>
                        {t.completion.applyPoints.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                </div>
             </div>
             
             <div style={{textAlign: 'center', marginTop: '30px'}}>
                 <button 
                    className="hint-button setup"
                    onClick={() => {
                        setCompletedSteps([]);
                        window.scrollTo(0,0);
                    }}
                 >
                    Reset Lab
                 </button>
             </div>
          </div>
      )}

    </div>
  );
}