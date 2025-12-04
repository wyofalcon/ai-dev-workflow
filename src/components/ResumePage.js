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
} from "@mui/icons-material";

const ResumePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [viewingResume, setViewingResume] = useState(null);

  // Fetch resumes from API
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await currentUser.getIdToken();
        const API_BASE =
          process.env.REACT_APP_API_URL ||
          "https://cvstomize-api-351889420459.us-central1.run.app";
        const API_URL = API_BASE.includes('/api') ? API_BASE : `${API_BASE}/api`;

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
      const token = await currentUser.getIdToken();
      const API_BASE =
        process.env.REACT_APP_API_URL ||
        "https://cvstomize-api-351889420459.us-central1.run.app";
      const API_URL = API_BASE.includes('/api') ? API_BASE : `${API_BASE}/api`;

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
                          {resume.originalName || "Uploaded Resume"}
                        </Typography>
                      </Box>

                      {/* File Info */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
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
                              const token = await currentUser.getIdToken();
                              const API_BASE =
                                process.env.REACT_APP_API_URL ||
                                "https://cvstomize-api-351889420459.us-central1.run.app";
                              const API_URL = API_BASE.includes('/api') ? API_BASE : `${API_BASE}/api`;
                              const response = await fetch(
                                `${API_URL}/profile/uploaded-resumes/${resume.id}/primary`,
                                {
                                  method: "PUT",
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
                              }
                            } catch (err) {
                              console.error("Error setting primary:", err);
                            }
                          }}
                          size="small"
                        >
                          {resume.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton>
                      </Tooltip>

                      {/* View Button */}
                      <Tooltip title="View extracted text">
                        <IconButton
                          color="primary"
                          onClick={() => setViewingResume(resume)}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      {/* Delete Button */}
                      <Tooltip title="Delete resume">
                        <IconButton
                          color="error"
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "Are you sure you want to delete this uploaded resume?"
                              )
                            ) {
                              return;
                            }
                            try {
                              const token = await currentUser.getIdToken();
                              const API_BASE =
                                process.env.REACT_APP_API_URL ||
                                "https://cvstomize-api-351889420459.us-central1.run.app";
                              const API_URL = API_BASE.includes('/api') ? API_BASE : `${API_BASE}/api`;
                              const response = await fetch(
                                `${API_URL}/profile/uploaded-resumes/${resume.id}`,
                                {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );
                              if (response.ok) {
                                setUploadedResumes((prev) =>
                                  prev.filter((r) => r.id !== resume.id)
                                );
                              } else {
                                alert("Failed to delete resume");
                              }
                            } catch (err) {
                              console.error("Error deleting resume:", err);
                              alert("Failed to delete resume");
                            }
                          }}
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

        {/* View Uploaded Resume Dialog */}
        {viewingResume && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0,0,0,0.8)",
              zIndex: 1300,
              display: "flex",
              flexDirection: "column",
              p: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" color="white">
                {viewingResume.originalName}
              </Typography>
              <IconButton
                color="inherit"
                onClick={() => setViewingResume(null)}
                sx={{ color: "white" }}
              >
                ✕
              </IconButton>
            </Box>
            <Box
              sx={{
                flex: 1,
                bgcolor: "background.paper",
                borderRadius: 2,
                p: 3,
                overflow: "auto",
              }}
            >
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
              >
                {viewingResume.extractedText || "No text content available"}
              </Typography>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ResumePage;
