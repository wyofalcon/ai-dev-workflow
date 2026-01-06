import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import CodeIcon from "@mui/icons-material/Code";
import SaveIcon from "@mui/icons-material/Save";
import { useAuth } from "../contexts/AuthContext.js";
import { useNavigate } from "react-router-dom";

const steps = ["Upload Resume", "Review Parsed Info", "Save to Profile"];

function UploadResumeModal({ open, onClose }) {
  const { currentUser, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [parsedData, setParsedData] = useState(null);

  const handleClose = () => {
    // Reset all state
    setActiveStep(0);
    setLoading(false);
    setSaving(false);
    setError(null);
    setSuccess(false);
    setUploadedFile(null);
    setResumeText("");
    setParsedData(null);
    onClose();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setLoading(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const API_BASE =
        process.env.REACT_APP_API_URL ||
        "https://cvstomize-api-351889420459.us-central1.run.app";
      const API_URL = API_BASE.includes("/api") ? API_BASE : `${API_BASE}/api`;

      // Step 1: Extract text from resume file
      const formDataUpload = new FormData();
      formDataUpload.append("resumes", file);

      const extractResponse = await fetch(`${API_URL}/resume/extract-text`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to extract text from resume"
        );
      }

      const extractData = await extractResponse.json();
      const extractedText = extractData.text;

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error("Could not extract enough text from the resume file");
      }

      setResumeText(extractedText);

      // Step 2: Parse the extracted text using parse-resume-text endpoint
      const parseResponse = await fetch(
        `${API_URL}/profile/parse-resume-text`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeText: extractedText,
          }),
        }
      );

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to parse resume");
      }

      const parseData = await parseResponse.json();
      // Response uses 'extractedData' key
      setParsedData(
        parseData.extractedData || parseData.parsedData || parseData
      );

      // Auto-advance to review step
      setActiveStep(1);
    } catch (err) {
      console.error("Error processing resume:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextPaste = async () => {
    if (!resumeText.trim()) {
      setError("Please paste your resume text first");
      return;
    }

    if (resumeText.trim().length < 50) {
      setError("Resume text must be at least 50 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const API_BASE =
        process.env.REACT_APP_API_URL ||
        "https://cvstomize-api-351889420459.us-central1.run.app";
      const API_URL = API_BASE.includes("/api") ? API_BASE : `${API_BASE}/api`;

      // Parse the pasted resume text - use parse-resume-text endpoint
      const parseResponse = await fetch(
        `${API_URL}/profile/parse-resume-text`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeText: resumeText,
          }),
        }
      );

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to parse resume");
      }

      const parseData = await parseResponse.json();
      // Response uses 'extractedData' not 'parsedData'
      setParsedData(
        parseData.extractedData || parseData.parsedData || parseData
      );

      // Advance to review step
      setActiveStep(1);
    } catch (err) {
      console.error("Error parsing resume:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProfile = async () => {
    if (!parsedData) {
      setError("No parsed data to save");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const API_BASE =
        process.env.REACT_APP_API_URL ||
        "https://cvstomize-api-351889420459.us-central1.run.app";
      const API_URL = API_BASE.includes("/api") ? API_BASE : `${API_BASE}/api`;

      // Build enabledSections based on parsed data
      const enabledSections = [
        "contact",
        "workExperience",
        "skills",
        "education",
      ];
      if (parsedData.summary) enabledSections.push("summary");
      if (parsedData.certifications?.length > 0)
        enabledSections.push("certifications");
      if (parsedData.languages?.length > 0) enabledSections.push("languages");

      // Prepare experience data - schema expects 'experience' field as Json
      const experienceData =
        parsedData.workExperience || parsedData.experience || [];
      const educationData = parsedData.education || [];

      // Save parsed data to user profile
      // Schema field mapping:
      // - experience (Json) - work experience entries
      // - education (Json) - education entries
      // - skills (String[]) - array of skill strings
      // - certifications (String[]) - array of certification strings
      // - languages (String[]) - array of language strings
      const profileResponse = await fetch(`${API_URL}/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: parsedData.fullName || parsedData.name || "",
          phone: parsedData.phone || "",
          location: parsedData.location || "",
          linkedinUrl: parsedData.linkedinUrl || parsedData.linkedin || "",
          summary: parsedData.summary || "",
          currentTitle: parsedData.currentTitle || parsedData.title || "",
          yearsExperience: parsedData.yearsExperience || null,
          careerLevel: parsedData.careerLevel || null,
          industries: parsedData.industries || [],
          skills: parsedData.skills || [],
          education: educationData, // Json field
          experience: experienceData, // Json field - note: 'experience' not 'workExperience'
          certifications: parsedData.certifications || [],
          languages: parsedData.languages || [],
          workPreferences: {
            enabledSections,
            summary: parsedData.summary || "",
            currentTitle: parsedData.currentTitle || parsedData.title || "",
            experience: experienceData,
            education: educationData,
            skills: parsedData.skills || [],
            certifications: parsedData.certifications || [],
            languages: parsedData.languages || [],
          },
        }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save profile");
      }

      // If we have a file, save it to UploadedResume table via parse-resume endpoint
      if (uploadedFile) {
        const resumeFormData = new FormData();
        resumeFormData.append("resume", uploadedFile);
        resumeFormData.append("saveToAccount", "true");
        resumeFormData.append("label", "Uploaded Resume");

        const uploadResponse = await fetch(`${API_URL}/profile/parse-resume`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: resumeFormData,
        });

        // Don't fail if resume file save fails, profile is already saved
        if (!uploadResponse.ok) {
          console.warn("Resume file save failed, but profile was updated");
        } else {
          console.log("Resume file saved to UploadedResume table");
        }
      }

      // Refresh user profile in context
      if (fetchUserProfile) {
        await fetchUserProfile();
      }

      setSuccess(true);
      setActiveStep(2);
    } catch (err) {
      console.error("Error saving to profile:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Your Resume
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload your resume file and we'll extract your information to fill
              in your profile automatically.
            </Typography>

            {/* File Upload Section */}
            <Box
              component="label"
              sx={{
                p: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                border: uploadedFile ? "2px solid #4caf50" : "2px dashed #333",
                borderRadius: 1,
                backgroundColor: uploadedFile ? "#1a2e1a" : "#1a1a1a",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: uploadedFile ? "#4caf50" : "#fdbb2d",
                  backgroundColor: uploadedFile ? "#1a2e1a" : "#252525",
                },
              }}
            >
              <input
                id="resumeUpload"
                name="resumeUpload"
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={loading}
              />
              {loading ? (
                <>
                  <CircularProgress size={60} sx={{ mb: 2 }} />
                  <Typography variant="body1">Processing resume...</Typography>
                </>
              ) : uploadedFile ? (
                <>
                  <CheckCircleIcon
                    sx={{ fontSize: 80, color: "#4caf50", mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ mb: 1, color: "#4caf50" }}>
                    Resume Uploaded!
                  </Typography>
                  <Typography variant="body1">{uploadedFile.name}</Typography>
                  <Button
                    variant="outlined"
                    color="secondary"
                    sx={{ mt: 2 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setUploadedFile(null);
                      setResumeText("");
                      setParsedData(null);
                    }}
                  >
                    Upload Different File
                  </Button>
                </>
              ) : (
                <>
                  <CloudUploadIcon
                    sx={{ fontSize: 80, color: "#fdbb2d", mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Click to upload file
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PDF, DOC, or DOCX (Max 25MB)
                  </Typography>
                </>
              )}
            </Box>

            {/* OR Divider */}
            <Box sx={{ display: "flex", alignItems: "center", my: 3 }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                OR
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            {/* Text Paste Section */}
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                Paste your resume text directly:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                id="resumeText"
                name="resumeText"
                placeholder="Paste your resume content here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                variant="outlined"
                disabled={loading || uploadedFile}
              />
              {resumeText && !uploadedFile && (
                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ mt: 2 }}
                  onClick={handleTextPaste}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Parse Resume Text"
                  )}
                </Button>
              )}
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Parsed Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Here's what we extracted from your resume. Click "Save to Profile"
              to update your profile with this information.
            </Typography>

            {parsedData && (
              <Paper sx={{ p: 2, backgroundColor: "#1a1a1a" }}>
                <List dense>
                  {/* Contact Info */}
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Contact Information"
                      secondary={
                        <>
                          {parsedData.fullName ||
                            parsedData.name ||
                            "Not found"}
                          <br />
                          {parsedData.email || "Email not found"}
                          <br />
                          {parsedData.phone || "Phone not found"}
                          <br />
                          {parsedData.location || "Location not found"}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />

                  {/* Work Experience */}
                  <ListItem>
                    <ListItemIcon>
                      <WorkIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Work Experience"
                      secondary={
                        (parsedData.workExperience || parsedData.experience)
                          ?.length > 0
                          ? `${
                              (
                                parsedData.workExperience ||
                                parsedData.experience
                              ).length
                            } positions found`
                          : "No work experience found"
                      }
                    />
                  </ListItem>
                  <Divider />

                  {/* Education */}
                  <ListItem>
                    <ListItemIcon>
                      <SchoolIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Education"
                      secondary={
                        parsedData.education?.length > 0
                          ? `${parsedData.education.length} entries found`
                          : "No education found"
                      }
                    />
                  </ListItem>
                  <Divider />

                  {/* Skills */}
                  <ListItem>
                    <ListItemIcon>
                      <CodeIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Skills"
                      secondary={
                        parsedData.skills?.length > 0 ? (
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.5,
                              mt: 1,
                            }}
                          >
                            {parsedData.skills.slice(0, 10).map((skill, i) => (
                              <Chip
                                key={i}
                                label={skill}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {parsedData.skills.length > 10 && (
                              <Chip
                                label={`+${parsedData.skills.length - 10} more`}
                                size="small"
                              />
                            )}
                          </Box>
                        ) : (
                          "No skills found"
                        )
                      }
                    />
                  </ListItem>
                </List>
              </Paper>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 100, color: "#4caf50", mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ color: "#4caf50" }}>
              Profile Updated Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your resume information has been saved to your profile.
              {uploadedFile &&
                " Your resume file has also been saved to your account."}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button variant="outlined" onClick={handleClose}>
                Close
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  handleClose();
                  navigate("/profile");
                }}
              >
                View Profile
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#1e1e1e",
          minHeight: "60vh",
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #333",
        }}
      >
        <Typography variant="h6">Upload Resume to Profile</Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Stepper
        activeStep={activeStep}
        sx={{
          pt: 3,
          pb: 2,
          px: 2,
          "& .MuiStepConnector-line": {
            borderColor: "#333",
          },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {renderStepContent()}
      </DialogContent>

      {/* Footer buttons - hide on success step */}
      {activeStep < 2 && (
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #333",
          }}
        >
          <Button
            disabled={activeStep === 0 || loading || saving}
            onClick={() => setActiveStep((prev) => prev - 1)}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>

          {activeStep === 1 && (
            <Button
              variant="contained"
              color="secondary"
              disabled={!parsedData || saving}
              onClick={handleSaveToProfile}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? "Saving..." : "Save to Profile"}
            </Button>
          )}
        </Box>
      )}
    </Dialog>
  );
}

export default UploadResumeModal;
