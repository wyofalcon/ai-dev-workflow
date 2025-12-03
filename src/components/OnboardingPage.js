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
  Edit as EditIcon,
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

const steps = ["Choose Method", "Enter Details", "Review & Complete"];

function OnboardingPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    userProfile,
    getIdToken,
    API_URL,
    fetchUserProfile,
    logout,
  } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [method, setMethod] = useState(null); // 'upload' or 'manual'
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
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
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
          yearsExperience: formData.yearsExperience
            ? parseInt(formData.yearsExperience)
            : null,
          careerLevel: formData.currentTitle ? "mid" : null,
          skills: formData.skills,
          industries: formData.industries,
          completeOnboarding: true, // Mark onboarding as complete
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save profile");
      }

      // Refresh user profile to get updated onboardingCompleted status
      await fetchUserProfile(currentUser);

      setSuccess("Profile saved successfully!");

      // Navigate to home after short delay
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      console.error("Profile save error:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep === 0) return;
    setActiveStep((prev) => prev - 1);
    setError("");
    setSuccess("");
  };

  const handleNext = () => {
    if (activeStep === 0 && !method) {
      setError("Please choose a method to continue");
      return;
    }
    if (activeStep < steps.length - 1) {
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

  // Step 1: Choose Method
  const renderMethodSelection = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Let's Set Up Your Profile
      </Typography>
      <Typography
        variant="body1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Upload your existing resume and we'll automatically extract your
        information to get you started quickly.
      </Typography>

      {/* Upload Resume - Primary Option */}
      <Card
        elevation={method === "upload" ? 8 : 3}
        sx={{
          maxWidth: 500,
          mx: "auto",
          border: method === "upload" ? "2px solid" : "1px solid",
          borderColor: method === "upload" ? "primary.main" : "divider",
          mb: 3,
        }}
      >
        <CardActionArea
          onClick={() => handleSelectMethod("upload")}
          sx={{ p: 3 }}
        >
          <CardContent sx={{ textAlign: "center" }}>
            <UploadIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Upload Your Resume
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              We'll automatically extract your contact info, skills, and
              experience.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                flexWrap: "wrap",
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
              sx={{ mt: 2 }}
            />
          </CardContent>
        </CardActionArea>
      </Card>

      {/* Upload Area (shown when upload is selected) */}
      {method === "upload" && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />

          {/* Dropzone */}
          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed",
              borderColor: isDragActive ? "primary.main" : "divider",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              bgcolor: isDragActive ? "action.hover" : "background.paper",
              transition: "all 0.2s",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            }}
          >
            <input {...getInputProps()} />
            {parsing ? (
              <Box>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography>Parsing your resume...</Typography>
                <LinearProgress sx={{ mt: 2, maxWidth: 300, mx: "auto" }} />
              </Box>
            ) : (
              <>
                <UploadIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  {isDragActive
                    ? "Drop your resume here"
                    : "Drag & drop your resume here"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click to browse (PDF, DOCX, TXT - max 5MB)
                </Typography>
              </>
            )}
          </Box>

          {/* Or paste text */}
          <Typography variant="body2" align="center" sx={{ my: 2 }}>
            — OR —
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={6}
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

      {/* Manual Entry - Secondary Option at Bottom */}
      <Box sx={{ mt: 5, textAlign: "center" }}>
        <Divider sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have a resume file?
          </Typography>
        </Divider>
        <Button
          variant="text"
          color="primary"
          onClick={() => handleSelectMethod("manual")}
          startIcon={<EditIcon />}
          sx={{
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          Enter your information manually instead
        </Button>
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          You can always add or update your details later
        </Typography>
      </Box>
    </Box>
  );

  // Step 2: Enter/Edit Details
  const renderDetailsForm = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Your Professional Information
      </Typography>
      <Typography
        variant="body1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        {method === "upload"
          ? "Review and edit the information extracted from your resume."
          : "Enter your basic professional information."}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Full Name"
            value={formData.fullName}
            onChange={handleInputChange("fullName")}
            placeholder="John Doe"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            value={formData.email}
            disabled
            helperText="From your account"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={handleInputChange("phone")}
            placeholder="(555) 123-4567"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Location"
            value={formData.location}
            onChange={handleInputChange("location")}
            placeholder="San Francisco, CA"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="LinkedIn URL"
            value={formData.linkedinUrl}
            onChange={handleInputChange("linkedinUrl")}
            placeholder="linkedin.com/in/johndoe"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
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
        Review Your Profile
      </Typography>
      <Typography
        variant="body1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Make sure everything looks correct before completing your profile setup.
      </Typography>

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
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          size="large"
        >
          {loading ? "Saving..." : "Complete Setup"}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          py: 4,
        }}
      >
        {/* Header with Logo and Logout */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box sx={{ width: 100 }} /> {/* Spacer for centering */}
          <img src={logo} alt="CVstomize Logo" style={{ width: "120px" }} />
          <Button
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
        <Typography variant="h4" align="center" gutterBottom>
          Welcome to CVstomize! 🎉
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Let's get you set up so you can start creating amazing, personalized
          resumes.
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

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
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {activeStep === 0 && renderMethodSelection()}
          {activeStep === 1 && renderDetailsForm()}
          {activeStep === 2 && renderReview()}
        </Paper>
      </Box>
    </Container>
  );
}

export default OnboardingPage;
