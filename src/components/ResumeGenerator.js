
import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ResumeGenerator = ({ cvData }) => {
  const exportPdf = () => {
    const input = document.getElementById('resume-preview');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save('resume.pdf');
    });
  };

  return (
    <div>
      <div id="resume-preview" style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
        {/* Basic resume structure */}
        <h1>{cvData.name}</h1>
        <p>{cvData.email} | {cvData.phone}</p>
        <hr />
        <h2>Experience</h2>
        {cvData.experience.map((exp, index) => (
          <div key={index}>
            <h3>{exp.title}</h3>
            <p>{exp.company} | {exp.date}</p>
            <ul>
              {exp.description.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        {/* Add other sections as needed */}
      </div>
      <button onClick={exportPdf}>Export as PDF</button>
    </div>
  );
};

export default ResumeGenerator;
