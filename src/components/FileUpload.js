import React from 'react';

// This is a simplified version using a standard HTML file input
// to bypass the 'react-dropzone' library error.

const FileUpload = ({ files, setFiles }) => {
  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (fileName) => {
    setFiles(files.filter(file => file.name !== fileName));
  };

  return (
    <div className="form-section">
      {/* Update the title to specify DOCX only */}
      <h3>Upload Your Documents</h3>
      <div className="file-upload-area">
        <input
          type="file"
          id="file-upload"
          // Update the 'accept' attribute to only allow .docx files
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
          onChange={handleFileChange}
          multiple
        />
        <label htmlFor="file-upload" className="file-upload-label">
          Drag & Drop or Click to Upload
        </label>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h4>Selected files:</h4>
          <ul>
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                {file.name}
                <button onClick={() => removeFile(file.name)}>X</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;