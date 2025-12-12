import React, { useState } from "react";
import FileUpload from "./FileUpload";

export default {
  title: "Forms/FileUpload",
  component: FileUpload,
  parameters: {
    docs: {
      description: {
        component:
          "File upload component for DOCX documents. Supports multiple files with drag-and-drop.",
      },
    },
  },
  tags: ["autodocs"],
};

export const Empty = () => {
  const [files, setFiles] = useState([]);
  return <FileUpload files={files} setFiles={setFiles} />;
};

Empty.parameters = {
  docs: {
    description: {
      story: "Empty state - ready for file upload.",
    },
  },
};

export const WithFiles = () => {
  const [files, setFiles] = useState([
    { name: "resume.docx" },
    { name: "cover_letter.docx" },
  ]);
  return <FileUpload files={files} setFiles={setFiles} />;
};

WithFiles.parameters = {
  docs: {
    description: {
      story: "State with uploaded files showing remove buttons.",
    },
  },
};
