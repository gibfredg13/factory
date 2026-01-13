import React, { useState } from 'react';
import { Hint } from '../types';

export const Accordion: React.FC<{ hint: Hint }> = ({ hint }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`hint-button ${hint.type}`}
      >
        {isOpen ? '▼' : '▶'} {hint.title}
      </button>
      
      {isOpen && (
        <div className="hint-content" style={{width: '100%'}}>
           <h4 style={{color: '#ff6600', marginBottom: '10px'}}>{hint.title}</h4>
           <div dangerouslySetInnerHTML={{ __html: hint.content }} />
        </div>
      )}
    </>
  );
};