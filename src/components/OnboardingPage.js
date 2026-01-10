import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import onetSkillsData from "../data/onet-skills.json";
import LocationAutocomplete from "./LocationAutocomplete.js";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActionArea,
  CardHeader,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  InputAdornment,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  CheckCircle as CheckIcon,
  Description as ResumeIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Work as WorkIcon,
  School as EducationIcon,
  Code as SkillsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  LinkedIn as LinkedInIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import logo from "./logo.png";

// Use O*NET skills database
const SKILLS_BY_INDUSTRY = onetSkillsData.byIndustry || {};
const INDUSTRY_ORDER = [
  "Core Skills",
  "Administrative & Office",
  "Agriculture & Environment",
  "Construction & Trades",
  "Creative & Design",
  "Education & Training",
  "Finance & Accounting",
  "Healthcare & Medical",
  "Hospitality & Food Service",
  "Human Resources",
  "Legal & Compliance",
  "Manufacturing & Production",
  "Sales & Marketing",
  "Science & Research",
  "Security & Public Safety",
  "Technology & IT",
  "Transportation & Logistics",
  "General",
];

const GROUPED_SKILLS = [];
for (const industry of INDUSTRY_ORDER) {
  if (SKILLS_BY_INDUSTRY[industry]) {
    for (const skill of SKILLS_BY_INDUSTRY[industry]) {
      GROUPED_SKILLS.push({ name: skill, industry });
    }
  }
}

const stepsOnboarding = ["Upload Resume", "Review Details", "Save Profile"];
const stepsUpload = ["Upload Resume", "Review Details", "Save Resume"];

function OnboardingPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    userProfile,
    getIdToken,
    API_URL,
    fetchUserProfile,
    logout,
    onboardingCompleted,
  } = useAuth();

  // Check if user is returning (already completed onboarding before)
  const isReturningUser = onboardingCompleted === true;

  const [activeStep, setActiveStep] = useState(0);
  const [method, setMethod] = useState(null); // 'upload' or 'manual'
  const [hasSelectedPath, setHasSelectedPath] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || currentUser?.displayName || "",
    email: currentUser?.email || "",
    phone: userProfile?.phone || "",
    location: userProfile?.location || "",
    linkedinUrl: userProfile?.linkedinUrl || "",
    summary: "",
    yearsExperience: "",
    currentTitle: "",
    skills: [],
    industries: [],
    education: [],
    experience: [],
    certifications: [],
    languages: [],
  });

  // Skills input
  const [skillInput, setSkillInput] = useState("");

  // Resume text for paste option
  const [resumeText, setResumeText] = useState("");

  // Track uploaded resume file info
  const [uploadedFile, setUploadedFile] = useState(null);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // Go to landing page
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Handle path selection
  const handlePathSelection = (path) => {
    if (path === 'upload') {
      setMethod('upload');
      setHasSelectedPath(true);
      setActiveStep(0);
    } else if (path === 'ai') {
      navigate('/build-resume');
    } else if (path === 'manual') {
      setMethod('manual');
      setHasSelectedPath(true);
      setActiveStep(1); // Skip upload, go to details
    }
  };

  const handleBack = () => {
    if (activeStep === 0 && hasSelectedPath) {
      setHasSelectedPath(false);
      setMethod(null);
      return;
    }
    if (activeStep === 0) return;
    setActiveStep((prev) => prev - 1);
    setError("");
    setSuccess("");
  };

  // File upload with react-dropzone
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setError("");
      setParsing(true);

      try {
        const token = await getIdToken();
        const formDataToSend = new FormData();
        formDataToSend.append("resume", file);
        formDataToSend.append("saveToAccount", "true");

        const response = await fetch(`${API_URL}/profile/parse-resume`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to parse resume");
        }

        // Track the uploaded file
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          savedResume: data.savedResume,
        });

        // Populate form with extracted data
        populateFormFromParsedData(data.extractedData);
        setSuccess(
          "Resume parsed successfully! Please review the extracted information."
        );
        setActiveStep(1);
      } catch (err) {
        console.error("Resume upload error:", err);
        setError(err.message || "Failed to upload and parse resume");
      } finally {
        setParsing(false);
      }
    },
    [getIdToken, API_URL]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const populateFormFromParsedData = (data) => {
    setFormData((prev) => ({
      ...prev,
      fullName: data.fullName || prev.fullName,
      phone: data.phone || prev.phone,
      location: data.location || prev.location,
      linkedinUrl: data.linkedinUrl || prev.linkedinUrl,
      summary: data.summary || prev.summary,
      yearsExperience: data.yearsExperience || prev.yearsExperience,
      currentTitle: data.currentTitle || prev.currentTitle,
      skills: data.skills?.length > 0 ? data.skills : prev.skills,
      industries:
        data.industries?.length > 0 ? data.industries : prev.industries,
      education: data.education?.length > 0 ? data.education : prev.education,
      experience:
        data.experience?.length > 0 ? data.experience : prev.experience,
      certifications:
        data.certifications?.length > 0
          ? data.certifications
          : prev.certifications,
      languages: data.languages?.length > 0 ? data.languages : prev.languages,
    }));
  };

  const handleParseText = async () => {
    if (!resumeText || resumeText.trim().length < 50) {
      setError("Please paste at least 50 characters of resume content");
      return;
    }

    setError("");
    setParsing(true);

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_URL}/profile/parse-resume-text`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to parse resume");
      }

      populateFormFromParsedData(data.extractedData);
      setSuccess(
        "Resume parsed successfully! Please review the extracted information."
      );
      setActiveStep(1);
    } catch (err) {
      console.error("Resume parse error:", err);
      setError(err.message || "Failed to parse resume text");
    } finally {
      setParsing(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleAddSkill = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          skills: [...prev.skills, skillInput.trim()],
        }));
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Build enabledSections based on what data was parsed
      const enabledSections = [
        "contact",
        "workExperience",
        "skills",
        "education",
      ];
      if (formData.summary) enabledSections.push("summary");
      if (formData.certifications?.length > 0)
        enabledSections.push("certifications");
      if (formData.languages?.length > 0) enabledSections.push("languages");

      const token = await getIdToken();
      const response = await fetch(`${API_URL}/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          location: formData.location,
          linkedinUrl: formData.linkedinUrl,
          summary: formData.summary || null,
          currentTitle: formData.currentTitle || null,
          yearsExperience: formData.yearsExperience
            ? parseInt(formData.yearsExperience)
            : null,
          careerLevel: formData.currentTitle ? "mid" : null,
          skills: formData.skills,
          industries: formData.industries,
          education: formData.education?.length > 0 ? formData.education : null,
          experience:
            formData.experience?.length > 0 ? formData.experience : null,
          certifications: formData.certifications || [],
          languages: formData.languages || [],
          // Include workPreferences with enabledSections and full data
          workPreferences: {
            enabledSections,
            summary: formData.summary || "",
            currentTitle: formData.currentTitle || "",
            workExperience: formData.experience || [],
            education: formData.education || [],
            skills: formData.skills || [],
            certifications: formData.certifications || [],
            languages: formData.languages || [],
          },
          completeOnboarding: true, // Mark onboarding as complete
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save profile");
      }

      // Refresh user profile to get updated onboardingCompleted status
      await fetchUserProfile(currentUser);

      setSuccess(
        isReturningUser
          ? "Resume uploaded successfully!"
          : "Profile saved successfully!"
      );

      // Navigate after short delay - resumes page for returning users, home for new users
      setTimeout(() => {
        navigate(isReturningUser ? "/resume" : "/");
      }, 1000);
    } catch (err) {
      console.error("Profile save error:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };



  const handleNext = () => {
    if (activeStep === 0 && !method) {
      setError("Please choose a method to continue");
      return;
    }
    const currentSteps = isReturningUser ? stepsUpload : stepsOnboarding;
    if (activeStep < currentSteps.length - 1) {
      setActiveStep((prev) => prev + 1);
      setError("");
      setSuccess("");
    }
  };

  const handleSelectMethod = (selectedMethod) => {
    setMethod(selectedMethod);
    setError("");
    if (selectedMethod === "manual") {
      setActiveStep(1);
    }
  };

  // Step 1: Upload Resume
  const renderMethodSelection = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Let's Start With What You Have
      </Typography>
      <Typography
        variant="body1"
        align="center"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Upload your existing resume — we'll use it as a starting point.
      </Typography>
      <Typography
        variant="body2"
        align="center"
        sx={{ mb: 4, color: "#fdbb2d", fontStyle: "italic" }}
      >
        💡 This is just the beginning. Our AI will help you discover skills you
        forgot to include.
      </Typography>

      {/* Unified Upload Resume Dropzone */}
      <Box
        {...getRootProps()}
        onClick={(e) => {
          if (!method) {
            handleSelectMethod("upload");
          }
          getRootProps().onClick?.(e);
        }}
        sx={{
          maxWidth: 500,
          mx: "auto",
          border: "2px dashed",
          borderColor: isDragActive
            ? "primary.main"
            : method === "upload"
            ? "primary.main"
            : "divider",
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          bgcolor: isDragActive ? "action.hover" : "background.paper",
          transition: "all 0.2s",
          mb: 3,
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: "action.hover",
          },
        }}
      >
        <input {...getInputProps()} />
        {parsing ? (
          <Box>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6">Parsing your resume...</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Extracting your information with AI
            </Typography>
            <LinearProgress sx={{ mt: 2, maxWidth: 300, mx: "auto" }} />
          </Box>
        ) : (
          <>
            <UploadIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {isDragActive ? "Drop your resume here" : "Upload Your Resume"}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {isDragActive
                ? "Release to upload"
                : "Drag & drop or click to browse"}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                flexWrap: "wrap",
                mb: 2,
              }}
            >
              <Chip label="PDF" size="small" variant="outlined" />
              <Chip label="DOCX" size="small" variant="outlined" />
              <Chip label="TXT" size="small" variant="outlined" />
            </Box>
            <Chip
              label="Recommended • Saves Time"
              color="primary"
              size="small"
            />
          </>
        )}
      </Box>

      {/* Or paste text option */}
      {method === "upload" && (
        <Box sx={{ maxWidth: 500, mx: "auto" }}>
          <Typography variant="body2" align="center" sx={{ my: 2 }}>
            — OR —
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={6}
            id="resumeText"
            name="resumeText"
            label="Paste your resume content here"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Copy and paste the text content from your existing resume..."
            variant="outlined"
          />

          <Button
            fullWidth
            variant="contained"
            onClick={handleParseText}
            disabled={parsing || resumeText.length < 50}
            sx={{ mt: 2 }}
            startIcon={
              parsing ? <CircularProgress size={20} /> : <ResumeIcon />
            }
          >
            {parsing ? "Parsing..." : "Parse Resume Text"}
          </Button>
        </Box>
      )}
    </Box>
  );

  // Step 0: Path Selection (New)
  const renderPathSelection = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" align="center" gutterBottom>
        How would you like to start?
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
        Choose the best way to build your profile.
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {/* Path 1: Upload */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: 'pointer', 
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
            onClick={() => handlePathSelection('upload')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload Resume
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Already have a resume? We'll extract your details automatically.
              </Typography>
              <Chip label="Fastest" color="success" size="small" sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>

        {/* Path 2: AI Build */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: 'pointer', 
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
              border: '2px solid',
              borderColor: 'secondary.main'
            }}
            onClick={() => handlePathSelection('ai')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <SkillsIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Build with AI
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No resume? No problem. Our AI will interview you to build one from scratch.
              </Typography>
              <Chip label="Recommended" color="secondary" size="small" sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>

        {/* Path 3: Manual */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: 'pointer', 
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}
            onClick={() => handlePathSelection('manual')}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Fill Manually
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Prefer full control? Enter your professional details step-by-step.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Step 2: Enter/Edit Details
  const renderDetailsForm = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Your Professional Foundation
      </Typography>
      <Typography
        variant="body1"
        align="center"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Review what we extracted. You can always add more later.
      </Typography>
      <Typography
        variant="body2"
        align="center"
        sx={{ mb: 4, color: "text.secondary", fontStyle: "italic" }}
      >
        ✨ Next, we'll have a conversation to uncover your hidden skills and
        stories.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            id="fullName"
            name="fullName"
            label="Full Name"
            value={formData.fullName}
            onChange={handleInputChange("fullName")}
            placeholder="John Doe"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            value={formData.email}
            disabled
            helperText="From your account"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="phone"
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleInputChange("phone")}
            placeholder="(555) 123-4567"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="location"
            name="location"
            label="Location"
            value={formData.location}
            onChange={handleInputChange("location")}
            placeholder="San Francisco, CA"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="linkedinUrl"
            name="linkedinUrl"
            label="LinkedIn URL"
            value={formData.linkedinUrl}
            onChange={handleInputChange("linkedinUrl")}
            placeholder="linkedin.com/in/johndoe"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="currentTitle"
            name="currentTitle"
            label="Current/Most Recent Job Title"
            value={formData.currentTitle}
            onChange={handleInputChange("currentTitle")}
            placeholder="Software Engineer"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            id="yearsExperience"
            name="yearsExperience"
            label="Years of Experience"
            value={formData.yearsExperience}
            onChange={handleInputChange("yearsExperience")}
            placeholder="5"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            id="summary"
            name="summary"
            label="Professional Summary"
            value={formData.summary}
            onChange={handleInputChange("summary")}
            placeholder="Brief overview of your professional background and key strengths..."
            helperText="A 2-3 sentence summary of your career highlights"
          />
        </Grid>
        <Grid item xs={12}>
          <Autocomplete
            freeSolo
            options={GROUPED_SKILLS.filter(
              (s) => !formData.skills.includes(s.name)
            )}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.name
            }
            groupBy={(option) =>
              typeof option === "object" ? option.industry : null
            }
            filterOptions={(options, { inputValue }) => {
              const filterValue = inputValue.toLowerCase();
              if (!filterValue) return options.slice(0, 50);
              return options
                .filter((opt) => {
                  const name = typeof opt === "string" ? opt : opt.name;
                  return name.toLowerCase().includes(filterValue);
                })
                .slice(0, 100);
            }}
            inputValue={skillInput}
            onInputChange={(event, newValue) => setSkillInput(newValue)}
            onChange={(event, newValue) => {
              const value =
                typeof newValue === "string" ? newValue : newValue?.name;
              if (
                value &&
                value.trim() &&
                !formData.skills.includes(value.trim())
              ) {
                setFormData((prev) => ({
                  ...prev,
                  skills: [...prev.skills, value.trim()],
                }));
                setSkillInput("");
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="Add Skills (press Enter to add)"
                placeholder="Type a skill and press Enter"
                helperText="💡 4,400+ skills organized by industry — or type your own!"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && skillInput.trim()) {
                    e.preventDefault();
                    if (!formData.skills.includes(skillInput.trim())) {
                      setFormData((prev) => ({
                        ...prev,
                        skills: [...prev.skills, skillInput.trim()],
                      }));
                    }
                    setSkillInput("");
                  }
                }}
              />
            )}
            renderGroup={(params) => (
              <li key={params.key}>
                <Typography
                  sx={{
                    position: "sticky",
                    top: "-8px",
                    padding: "4px 10px",
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                  }}
                >
                  {params.group}
                </Typography>
                <ul style={{ padding: 0 }}>{params.children}</ul>
              </li>
            )}
          />
          <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {formData.skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                onDelete={() => handleRemoveSkill(skill)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button onClick={handleBack} startIcon={<BackIcon />}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={<ForwardIcon />}
          disabled={!formData.fullName.trim()}
        >
          Review & Complete
        </Button>
      </Box>
    </Box>
  );

  // Step 3: Review & Complete
  const renderReview = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        {isReturningUser ? "Review Your Resume" : "Almost There!"}
      </Typography>
      <Typography
        variant="body1"
        align="center"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        {isReturningUser
          ? "Review the extracted information before saving your resume."
          : "Here's your foundation. After saving, we'll start discovering your hidden talents."}
      </Typography>
      {!isReturningUser && (
        <Typography
          variant="body2"
          align="center"
          sx={{ mb: 4, color: "#fdbb2d" }}
        >
          🎯 Ready to uncover skills from your life experiences, hobbies, and
          untold stories?
        </Typography>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Show uploaded resume info */}
        {uploadedFile && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "success.dark",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <ResumeIcon sx={{ fontSize: 32, color: "success.contrastText" }} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "success.contrastText" }}
              >
                📄 Original Resume Saved
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "success.contrastText", opacity: 0.9 }}
              >
                {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </Typography>
            </Box>
            <Chip
              label="Saved to Account"
              size="small"
              sx={{
                bgcolor: "success.light",
                color: "success.contrastText",
              }}
            />
          </Box>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <PersonIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">
                  {formData.fullName || "Not provided"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.currentTitle || "Professional"}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography>{formData.email || "Not provided"}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Phone
            </Typography>
            <Typography>{formData.phone || "Not provided"}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Location
            </Typography>
            <Typography>{formData.location || "Not provided"}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              LinkedIn
            </Typography>
            <Typography>{formData.linkedinUrl || "Not provided"}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Years of Experience
            </Typography>
            <Typography>
              {formData.yearsExperience || "Not provided"}
            </Typography>
          </Grid>

          {formData.summary && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Professional Summary
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {formData.summary}
              </Typography>
            </Grid>
          )}

          {formData.skills.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Skills
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {formData.skills.map((skill, index) => (
                  <Chip key={index} label={skill} size="small" />
                ))}
              </Box>
            </Grid>
          )}

          {formData.experience.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Work Experience ({formData.experience.length} positions)
              </Typography>
              {formData.experience.map((exp, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    pl: 2,
                    borderLeft: "2px solid",
                    borderColor: "primary.main",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {exp.title} at {exp.company}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {exp.startDate} - {exp.endDate || "Present"}{" "}
                    {exp.location && `• ${exp.location}`}
                  </Typography>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
                      {exp.highlights.slice(0, 2).map((highlight, hIndex) => (
                        <Typography
                          component="li"
                          variant="body2"
                          key={hIndex}
                          sx={{ fontSize: "0.85rem" }}
                        >
                          {highlight}
                        </Typography>
                      ))}
                      {exp.highlights.length > 2 && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.85rem" }}
                        >
                          +{exp.highlights.length - 2} more...
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Grid>
          )}

          {formData.education.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Education ({formData.education.length})
              </Typography>
              {formData.education.map((edu, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {edu.school} {edu.year && `• ${edu.year}`}
                  </Typography>
                </Box>
              ))}
            </Grid>
          )}

          {formData.certifications.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Certifications
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {formData.certifications.map((cert, index) => (
                  <Chip
                    key={index}
                    label={cert}
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                ))}
              </Box>
            </Grid>
          )}

          {formData.languages.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Languages
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {formData.languages.map((lang, index) => (
                  <Chip
                    key={index}
                    label={lang}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        You can always update your profile information later from your account
        settings.
      </Alert>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button onClick={handleBack} startIcon={<BackIcon />}>
          Back to Edit
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={20} />
            ) : isReturningUser ? (
              <UploadIcon />
            ) : (
              <CheckIcon />
            )
          }
          size="large"
        >
          {loading
            ? "Saving..."
            : isReturningUser
            ? "Save Resume"
            : "Complete Setup"}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="md" data-testid="onboarding-page">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          py: 4,
        }}
      >
        {/* Header with Logo and Back/Logout */}
        <Box
          data-testid="onboarding-header"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          {isReturningUser || hasSelectedPath ? (
            <Button
              data-testid="onboarding-back-btn"
              variant="text"
              color="inherit"
              size="small"
              onClick={handleBack}
              startIcon={<BackIcon />}
              sx={{
                opacity: 0.7,
                "&:hover": { opacity: 1 },
              }}
            >
              Back
            </Button>
          ) : (
            <Box sx={{ width: 100 }} /> /* Spacer for centering */
          )}
          <img
            src={logo}
            alt="CVstomize Logo"
            style={{ width: "120px" }}
            data-testid="onboarding-logo"
          />
          <Button
            data-testid="onboarding-logout-btn"
            variant="text"
            color="inherit"
            size="small"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              opacity: 0.7,
              "&:hover": { opacity: 1 },
            }}
          >
            Logout
          </Button>
        </Box>

        {/* Welcome Message */}
        <Typography
          data-testid="onboarding-title"
          variant="h4"
          align="center"
          gutterBottom
        >
          {isReturningUser ? "Upload a Resume" : "Welcome to CVstomize! 🎉"}
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          {isReturningUser
            ? "Add another resume to your collection. We'll extract and save your information."
            : "Let's get you set up so you can start creating amazing, personalized resumes."}
        </Typography>

        {/* Stepper */}
        {(hasSelectedPath || isReturningUser) && (
          <Stepper
            data-testid="onboarding-stepper"
            activeStep={activeStep}
            alternativeLabel
            sx={{ mb: 4 }}
          >
            {(isReturningUser ? stepsUpload : stepsOnboarding).map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {/* Step Content */}
        <Paper
          data-testid="onboarding-step-content"
          elevation={3}
          sx={{ p: 4, borderRadius: 2 }}
        >
          {(!hasSelectedPath && !isReturningUser) && renderPathSelection()}
          {(hasSelectedPath || isReturningUser) && activeStep === 0 && renderMethodSelection()}
          {(hasSelectedPath || isReturningUser) && activeStep === 1 && renderDetailsForm()}
          {(hasSelectedPath || isReturningUser) && activeStep === 2 && renderReview()}
        </Paper>
      </Box>
    </Container>
  );
}

export default OnboardingPage;
