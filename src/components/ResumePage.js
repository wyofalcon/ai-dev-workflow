import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Description as ResumeIcon,
  CloudUpload as UploadIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Sync as SyncIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

const ResumePage = () => {
  const navigate = useNavigate();
  const { currentUser, getIdToken } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [viewingResume, setViewingResume] = useState(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch resumes from API
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getIdToken();
        const API_BASE =
          process.env.REACT_APP_API_URL ||
          "https://cvstomize-api-351889420459.us-central1.run.app";
        const API_URL = API_BASE.includes("/api")
          ? API_BASE
          : `${API_BASE}/api`;

        // Fetch both generated and uploaded resumes in parallel
        const [generatedResponse, uploadedResponse] = await Promise.all([
          fetch(`${API_URL}/resume/list`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_URL}/profile/uploaded-resumes`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!generatedResponse.ok) {
          throw new Error(
            `Failed to fetch resumes: ${generatedResponse.statusText}`
          );
        }

        const generatedData = await generatedResponse.json();
        setResumes(generatedData.resumes || []);
        setFilteredResumes(generatedData.resumes || []);

        if (uploadedResponse.ok) {
          const uploadedData = await uploadedResponse.json();
          setUploadedResumes(uploadedData.uploadedResumes || []);
        }
      } catch (err) {
        console.error("Error fetching resumes:", err);
        setError(err.message || "Failed to load resumes");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchResumes();
    }
  }, [currentUser]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...resumes];

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((resume) => resume.status === filterStatus);
    }

    // Filter by search query (title or company)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (resume) =>
          resume.title?.toLowerCase().includes(query) ||
          resume.targetCompany?.toLowerCase().includes(query)
      );
    }

    setFilteredResumes(filtered);
  }, [filterStatus, searchQuery, resumes]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "draft":
        return "default";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  // Handle delete resume
  const handleDelete = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) {
      return;
    }

    try {
      const token = await getIdToken();
      const API_BASE =
        process.env.REACT_APP_API_URL ||
        "https://cvstomize-api-351889420459.us-central1.run.app";
      const API_URL = API_BASE.includes("/api") ? API_BASE : `${API_BASE}/api`;

      const response = await fetch(`${API_URL}/resume/${resumeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from local state
        setResumes((prev) => prev.filter((r) => r.id !== resumeId));
        setFilteredResumes((prev) => prev.filter((r) => r.id !== resumeId));
      } else {
        const data = await response.json();
        alert(`Failed to delete resume: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error deleting resume:", err);
      alert("Failed to delete resume");
    }
  };

  // Handle download (navigate to view page with download intent)
  const handleDownload = (resumeId) => {
    navigate(`/resume/${resumeId}?download=true`);
  };

  // Handle edit mode toggle
  const handleStartEdit = () => {
    setEditedText(viewingResume?.rawText || "");
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText("");
    setSaveError(null);
  };

  // Handle save edited resume
  const handleSaveResume = async (syncToProfile = false) => {
    if (!viewingResume?.id || !editedText.trim()) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const token = await getIdToken();
      const API_BASE =
        process.env.REACT_APP_API_URL ||
        "https://cvstomize-api-351889420459.us-central1.run.app";
      const API_URL = API_BASE.includes("/api") ? API_BASE : `${API_BASE}/api`;

      const response = await fetch(
        `${API_URL}/profile/uploaded-resumes/${viewingResume.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rawText: editedText,
            syncToProfile,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save resume");
      }

      // Update local state
      setViewingResume((prev) => ({
        ...prev,
        rawText: editedText,
      }));
      setUploadedResumes((prev) =>
        prev.map((r) =>
          r.id === viewingResume.id ? { ...r, rawText: editedText } : r
        )
      );

      setIsEditing(false);
      setSaveSuccess(true);

      // Show success message
      if (syncToProfile && data.profileUpdated) {
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Error saving resume:", err);
      setSaveError(err.message || "Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  // Format resume text with proper styling to preserve document structure
  const formatResumeText = (text) => {
    if (!text) return null;

    // Split into lines and process
    const lines = text.split("\n");
    const elements = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines but add spacing
      if (!trimmedLine) {
        elements.push(<Box key={index} sx={{ height: 8 }} />);
        return;
      }

      // Detect section headers (all caps, short lines, or lines ending with colon)
      const isHeader =
        (trimmedLine === trimmedLine.toUpperCase() &&
          trimmedLine.length < 50 &&
          trimmedLine.length > 2) ||
        /^(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|OBJECTIVE|WORK HISTORY|PROFESSIONAL EXPERIENCE|CERTIFICATIONS|PROJECTS|ACHIEVEMENTS|AWARDS|LANGUAGES|REFERENCES|CONTACT|PROFILE)/i.test(
          trimmedLine
        );

      // Detect name (usually first non-empty line, larger font)
      const isName =
        index < 3 &&
        !isHeader &&
        trimmedLine.length < 60 &&
        !/[@|•·]/.test(trimmedLine);

      // Detect contact info (contains email, phone, or multiple separators)
      const isContact =
        /[@]|[\d]{3}[-.\s]?[\d]{3}[-.\s]?[\d]{4}|linkedin\.com|github\.com/.test(
          trimmedLine
        ) ||
        (trimmedLine.includes("|") && trimmedLine.split("|").length >= 2);

      // Detect bullet points
      const isBullet =
        /^[•·▪▸►◦‣⁃*-]/.test(trimmedLine) || /^\d+\./.test(trimmedLine);

      // Detect job title / company lines (often has dates)
      const hasDate =
        /\b(19|20)\d{2}\b/.test(trimmedLine) ||
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(
          trimmedLine
        );
      const isJobLine = hasDate && trimmedLine.length < 100;

      if (isHeader) {
        elements.push(
          <Typography
            key={index}
            variant="h6"
            sx={{
              fontWeight: 700,
              mt: 3,
              mb: 1,
              color: "primary.main",
              borderBottom: "2px solid",
              borderColor: "primary.main",
              pb: 0.5,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {trimmedLine}
          </Typography>
        );
      } else if (isName && elements.length < 2) {
        elements.push(
          <Typography
            key={index}
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              color: "text.primary",
            }}
          >
            {trimmedLine}
          </Typography>
        );
      } else if (isContact) {
        elements.push(
          <Typography
            key={index}
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 0.5,
              textAlign: "center",
            }}
          >
            {trimmedLine}
          </Typography>
        );
      } else if (isJobLine) {
        elements.push(
          <Typography
            key={index}
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mt: 1.5,
              mb: 0.5,
            }}
          >
            {trimmedLine}
          </Typography>
        );
      } else if (isBullet) {
        const bulletContent = trimmedLine
          .replace(/^[•·▪▸►◦‣⁃*-]\s*/, "")
          .replace(/^\d+\.\s*/, "");
        elements.push(
          <Box key={index} sx={{ display: "flex", ml: 2, mb: 0.5 }}>
            <Typography sx={{ mr: 1, color: "primary.main" }}>•</Typography>
            <Typography variant="body2">{bulletContent}</Typography>
          </Box>
        );
      } else {
        elements.push(
          <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
            {trimmedLine}
          </Typography>
        );
      }
    });

    return elements;
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your resumes...
        </Typography>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: "1px solid #333" }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="primary"
            onClick={() => navigate("/")}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            My Resumes
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate("/create-resume")}
          >
            Create New Resume
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Tabs for Tailored vs Uploaded Resumes */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            icon={<ResumeIcon />}
            iconPosition="start"
            label={`Tailored Resumes (${resumes.length})`}
          />
          <Tab
            icon={<UploadIcon />}
            iconPosition="start"
            label={`Uploaded Resumes (${uploadedResumes.length})`}
          />
        </Tabs>

        {/* Tab 0: Tailored/Generated Resumes */}
        {activeTab === 0 && (
          <>
            {/* Filters */}
            <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Search resumes"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 250 }}
              />
              <TextField
                select
                label="Filter by status"
                variant="outlined"
                size="small"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </TextField>
            </Box>

            {/* Results Count */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredResumes.length} of {resumes.length} resume
              {resumes.length !== 1 ? "s" : ""}
            </Typography>

            {/* Empty State */}
            {filteredResumes.length === 0 && resumes.length === 0 && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h5" gutterBottom>
                  No tailored resumes yet
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Create your first AI-powered resume in minutes
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/create-resume")}
                >
                  Create Your First Resume
                </Button>
              </Box>
            )}

            {/* No Results from Filter */}
            {filteredResumes.length === 0 && resumes.length > 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No resumes match your filters
                </Typography>
                <Button
                  onClick={() => {
                    setFilterStatus("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            )}

            {/* Resume Cards */}
            <Grid container spacing={3}>
              {filteredResumes.map((resume) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={resume.id}
                  sx={{ display: "flex" }}
                >
                  <Card
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Title */}
                      <Typography
                        variant="h6"
                        gutterBottom
                        noWrap
                        sx={{ minHeight: "32px" }}
                      >
                        {resume.title || "Untitled Resume"}
                      </Typography>

                      {/* Company */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                        sx={{ minHeight: "20px" }}
                      >
                        {resume.targetCompany || "\u00A0"}
                      </Typography>

                      {/* Status */}
                      <Box sx={{ mt: 2, mb: 1, minHeight: "32px" }}>
                        <Chip
                          label={resume.status || "draft"}
                          color={getStatusColor(resume.status)}
                          size="small"
                        />
                      </Box>

                      {/* Dates - Fixed height section */}
                      <Box sx={{ minHeight: "60px" }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 1 }}
                        >
                          Created: {formatDate(resume.createdAt)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Downloaded:{" "}
                          {resume.downloadedAt
                            ? formatDate(resume.downloadedAt)
                            : "Not yet"}
                        </Typography>
                      </Box>

                      {/* Token Usage - Fixed height */}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 1, minHeight: "20px" }}
                      >
                        {resume.tokensUsed
                          ? `AI Tokens: ${resume.tokensUsed.toLocaleString()}`
                          : "\u00A0"}
                      </Typography>
                    </CardContent>

                    <CardActions
                      sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
                    >
                      {/* View Button */}
                      <Tooltip title="View resume">
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/resume/${resume.id}`)}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      {/* Download Button */}
                      <Tooltip title="Download resume">
                        <IconButton
                          color="primary"
                          onClick={() => handleDownload(resume.id)}
                          size="small"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>

                      {/* Delete Button */}
                      <Tooltip title="Delete resume">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(resume.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Tab 1: Uploaded/Original Resumes */}
        {activeTab === 1 && (
          <>
            {/* Empty State for Uploaded */}
            {uploadedResumes.length === 0 && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <UploadIcon
                  sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h5" gutterBottom>
                  No uploaded resumes yet
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Upload your existing resume during onboarding to store it here
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<UploadIcon />}
                  onClick={() => navigate("/onboarding")}
                >
                  Go to Onboarding
                </Button>
              </Box>
            )}

            {/* Uploaded Resume Cards */}
            <Grid container spacing={3}>
              {uploadedResumes.map((resume) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={resume.id}
                  sx={{ display: "flex" }}
                >
                  <Card
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      border: resume.isPrimary ? "2px solid" : "none",
                      borderColor: resume.isPrimary
                        ? "primary.main"
                        : "transparent",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Title with Star */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          minHeight: "32px",
                        }}
                      >
                        {resume.isPrimary && (
                          <Tooltip title="Primary Resume">
                            <StarIcon color="primary" fontSize="small" />
                          </Tooltip>
                        )}
                        <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                          {resume.filename || "Uploaded Resume"}
                        </Typography>
                      </Box>

                      {/* File Info */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {resume.mimeType?.includes("pdf")
                          ? "PDF Document"
                          : resume.mimeType?.includes("word") ||
                            resume.mimeType?.includes("docx")
                          ? "Word Document"
                          : "Text Document"}
                      </Typography>

                      {/* File Size */}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 1 }}
                      >
                        Size:{" "}
                        {resume.fileSize
                          ? `${(resume.fileSize / 1024).toFixed(1)} KB`
                          : "Unknown"}
                      </Typography>

                      {/* Upload Date */}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        Uploaded: {formatDate(resume.createdAt)}
                      </Typography>
                    </CardContent>

                    <CardActions
                      sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
                    >
                      {/* Set as Primary Button */}
                      <Tooltip
                        title={
                          resume.isPrimary ? "Primary Resume" : "Set as Primary"
                        }
                      >
                        <IconButton
                          color={resume.isPrimary ? "primary" : "default"}
                          onClick={async () => {
                            try {
                              const token = await getIdToken();
                              const API_BASE =
                                process.env.REACT_APP_API_URL ||
                                "https://cvstomize-api-351889420459.us-central1.run.app";
                              const API_URL = API_BASE.includes("/api")
                                ? API_BASE
                                : `${API_BASE}/api`;
                              const response = await fetch(
                                `${API_URL}/profile/uploaded-resumes/${resume.id}/primary`,
                                {
                                  method: "PATCH",
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );
                              if (response.ok) {
                                const data = await response.json();
                                setUploadedResumes((prev) =>
                                  prev.map((r) => ({
                                    ...r,
                                    isPrimary:
                                      r.id === resume.id
                                        ? data.uploadedResume.isPrimary
                                        : false,
                                  }))
                                );
                              } else {
                                const errorData = await response
                                  .json()
                                  .catch(() => ({}));
                                console.error(
                                  "Failed to set primary:",
                                  errorData
                                );
                                alert(
                                  `Failed to set primary resume: ${
                                    errorData.message || response.statusText
                                  }`
                                );
                              }
                            } catch (err) {
                              console.error("Error setting primary:", err);
                              alert("Failed to set primary resume");
                            }
                          }}
                          size="small"
                        >
                          {resume.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton>
                      </Tooltip>

                      {/* View Button */}
                      <Tooltip title="View resume">
                        <IconButton
                          color="primary"
                          onClick={() => setViewingResume(resume)}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      {/* Delete Button - disabled for primary resume */}
                      <Tooltip
                        title={
                          resume.isPrimary
                            ? "Cannot delete primary resume"
                            : "Delete resume"
                        }
                      >
                        <span>
                          <IconButton
                            color="error"
                            disabled={resume.isPrimary}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  "Are you sure you want to delete this uploaded resume?"
                                )
                              ) {
                                return;
                              }
                              try {
                                const token = await getIdToken();
                                const API_BASE =
                                  process.env.REACT_APP_API_URL ||
                                  "https://cvstomize-api-351889420459.us-central1.run.app";
                                const API_URL = API_BASE.includes("/api")
                                  ? API_BASE
                                  : `${API_BASE}/api`;
                                console.log("Deleting resume:", resume.id);
                                const response = await fetch(
                                  `${API_URL}/profile/uploaded-resumes/${resume.id}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );
                                console.log(
                                  "Delete response status:",
                                  response.status
                                );
                                if (response.ok) {
                                  setUploadedResumes((prev) =>
                                    prev.filter((r) => r.id !== resume.id)
                                  );
                                } else {
                                  const errorData = await response
                                    .json()
                                    .catch(() => ({}));
                                  console.error("Delete failed:", errorData);
                                  alert(
                                    `Failed to delete resume: ${
                                      errorData.message || response.statusText
                                    }`
                                  );
                                }
                              } catch (err) {
                                console.error("Error deleting resume:", err);
                                alert(
                                  `Failed to delete resume: ${err.message}`
                                );
                              }
                            }}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* View/Edit Uploaded Resume Dialog */}
        {viewingResume && (
          <Dialog
            open={!!viewingResume}
            onClose={() => {
              if (!isSaving) {
                setViewingResume(null);
                setIsEditing(false);
                setEditedText("");
                setSaveError(null);
                setSaveSuccess(false);
              }
            }}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                height: "90vh",
                maxHeight: "90vh",
              },
            }}
          >
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ResumeIcon color="primary" />
                <Typography variant="h6">
                  {isEditing
                    ? "Edit Resume"
                    : viewingResume.filename || "Uploaded Resume"}
                </Typography>
                {isEditing && (
                  <Chip label="Editing" size="small" color="warning" />
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={
                    viewingResume.mimeType?.includes("pdf")
                      ? "PDF"
                      : viewingResume.mimeType?.includes("word")
                      ? "DOCX"
                      : "TXT"
                  }
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {!isEditing && (
                  <Tooltip title="Edit Resume">
                    <IconButton
                      onClick={handleStartEdit}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </DialogTitle>
            <DialogContent
              sx={{
                p: 0,
                overflow: "auto",
                bgcolor: isEditing ? "#f5f5f5" : "#fafafa",
              }}
            >
              {/* Error/Success Alerts */}
              {saveError && (
                <Alert
                  severity="error"
                  sx={{ m: 2 }}
                  onClose={() => setSaveError(null)}
                >
                  {saveError}
                </Alert>
              )}
              {saveSuccess && (
                <Alert severity="success" sx={{ m: 2 }}>
                  Resume saved successfully!
                </Alert>
              )}

              {isEditing ? (
                /* Edit Mode - Plain text editor */
                <Box sx={{ p: 3, height: "100%" }}>
                  <TextField
                    multiline
                    fullWidth
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    placeholder="Edit your resume content..."
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "white",
                        fontFamily: "monospace",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                      },
                      "& .MuiInputBase-input": {
                        minHeight: "60vh",
                      },
                    }}
                    disabled={isSaving}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Tip: You can edit the text and save. Use "Save & Sync to
                    Profile" to update your profile with the changes.
                  </Typography>
                </Box>
              ) : (
                /* View Mode - Formatted display */
                <Paper
                  elevation={2}
                  sx={{
                    maxWidth: 800,
                    mx: "auto",
                    my: 3,
                    p: 5,
                    minHeight: "100%",
                    bgcolor: "white",
                    borderRadius: 0,
                    boxShadow: "0 0 20px rgba(0,0,0,0.1)",
                  }}
                >
                  {viewingResume.rawText ? (
                    formatResumeText(viewingResume.rawText)
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <ResumeIcon
                        sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
                      />
                      <Typography color="text.secondary">
                        No text content available
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}
            </DialogContent>
            <DialogActions
              sx={{
                px: 3,
                py: 2,
                borderTop: 1,
                borderColor: "divider",
                justifyContent: isEditing ? "space-between" : "flex-end",
              }}
            >
              {isEditing ? (
                <>
                  <Button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    startIcon={<CloseIcon />}
                  >
                    Cancel
                  </Button>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => handleSaveResume(false)}
                      disabled={isSaving || !editedText.trim()}
                      startIcon={
                        isSaving ? <CircularProgress size={16} /> : <SaveIcon />
                      }
                    >
                      Save
                    </Button>
                    <Tooltip title="Save changes and update your profile with extracted information">
                      <Button
                        variant="contained"
                        onClick={() => handleSaveResume(true)}
                        disabled={isSaving || !editedText.trim()}
                        startIcon={
                          isSaving ? (
                            <CircularProgress size={16} />
                          ) : (
                            <SyncIcon />
                          )
                        }
                        color="primary"
                      >
                        Save & Sync to Profile
                      </Button>
                    </Tooltip>
                  </Box>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setViewingResume(null);
                    setSaveSuccess(false);
                  }}
                >
                  Close
                </Button>
              )}
            </DialogActions>
          </Dialog>
        )}
      </Container>
    </Box>
  );
};

export default ResumePage;
