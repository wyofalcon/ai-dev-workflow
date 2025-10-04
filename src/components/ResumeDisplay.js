import React from 'react';
import ReactMarkdown from 'react-markdown';

const ResumeDisplay = ({ title, content, isLoading, selectedStyle }) => {
  const resumeClassName = `resume-style-${selectedStyle.toLowerCase()}`;

  return (
    <div className="card full-height">
      <h2>4. Your Custom-Crafted CV</h2>
      <div className="resume-output">
        {isLoading && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Generating your CV...</p>
          </div>
        )}
        {!isLoading && !content && (
          <p className="placeholder-text">Your generated resume will appear here.</p>
        )}
        {content && (
          <div id="resume-content" className={resumeClassName}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeDisplay;
