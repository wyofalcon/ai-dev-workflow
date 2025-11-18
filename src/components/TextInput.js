import React from 'react';

const TextInput = ({ title, placeholder, value, onChange }) => {
  return (
    <div className="card">
      <h2>{title}</h2>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          minHeight: '200px', // Adjust as needed
          boxSizing: 'border-box',
          resize: 'vertical', // Allow vertical resizing
          backgroundColor: '#2d2d2d',
          color: '#ffffff',
          border: '1px solid #444',
          borderRadius: '4px',
          padding: '10px',
        }}
      />
    </div>
  );
};
export default TextInput;