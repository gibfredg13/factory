import React, { useState } from 'react';

interface TerminalProps {
  command?: string;
  tabs?: { label: string; command: string }[];
  output?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ command, tabs, output }) => {
  const [activeTab, setActiveTab] = useState(0);

  const currentCommand = tabs ? tabs[activeTab].command : command;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const CopyBtn = ({ text }: { text: string }) => {
      const [label, setLabel] = useState("Copy");
      
      const click = () => {
          handleCopy(text);
          setLabel("Copied!");
          setTimeout(() => setLabel("Copy"), 2000);
      };

      return (
        <button className="copy-button" onClick={click}>
            {label}
        </button>
      );
  }

  return (
    <div style={{marginTop: '10px'}}>
        {/* Tabs */}
        {tabs && (
          <div style={{marginBottom: '5px', borderBottom: '1px solid #333'}}>
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                style={{
                    background: activeTab === index ? '#333' : 'transparent',
                    color: activeTab === index ? '#fff' : '#888',
                    border: 'none',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    marginRight: '5px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

      {currentCommand && (
        <div className="code-wrapper">
            <div className="command-line">
                {currentCommand}
            </div>
            <CopyBtn text={currentCommand} />
        </div>
      )}

      {output && (
        <div className="code-wrapper">
             <div className="terminal-output">
                {output}
             </div>
             <CopyBtn text={output} />
        </div>
      )}
    </div>
  );
};