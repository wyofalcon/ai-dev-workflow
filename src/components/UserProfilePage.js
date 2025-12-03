import React, { useState, useEffect } from "react";
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
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Snackbar,
  Menu,
  MenuItem,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  InputAdornment,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  School as EducationIcon,
  Code as SkillsIcon,
  Assignment as ProjectIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  EmojiEvents as CertificationIcon,
  Language as LanguageIcon,
  MenuBook as PublicationIcon,
  VolunteerActivism as VolunteerIcon,
  MilitaryTech as AwardIcon,
  DragIndicator as DragIcon,
  Groups as MembershipIcon,
  Interests as InterestsIcon,
  Link as ReferenceIcon,
  Psychology as SummaryIcon,
  CardMembership as LicenseIcon,
  Lightbulb as TipIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  RemoveCircle as RemoveIcon,
  ViewList as SimpleViewIcon,
  ViewModule as DetailedViewIcon,
} from "@mui/icons-material";

// All possible resume sections with their configurations
const ALL_SECTIONS = {
  contact: {
    id: "contact",
    label: "Contact Info",
    icon: PersonIcon,
    description: "Basic contact information",
    importance:
      "Essential for every resume. This is how recruiters and hiring managers will reach you. A professional email, phone number, and location help establish credibility and accessibility.",
    tips: [
      "Use a professional email address",
      "Include LinkedIn for networking",
      "City/State is usually sufficient—no full address needed",
    ],
    alwaysShow: true,
  },
  summary: {
    id: "summary",
    label: "Professional Summary",
    icon: SummaryIcon,
    description: "Career overview and objectives",
    importance:
      "A powerful 2-4 sentence pitch that captures your value proposition. Research shows recruiters spend just 6-7 seconds on initial resume scans—make your summary count.",
    tips: [
      "Tailor it to each job application",
      "Lead with years of experience and key expertise",
      "Include measurable achievements when possible",
    ],
  },
  workExperience: {
    id: "workExperience",
    label: "Work Experience",
    icon: WorkIcon,
    description: "Employment history and job roles",
    importance:
      "The core of most resumes. Employers want to see your career progression, responsibilities, and—most importantly—your accomplishments. Use action verbs and quantify results.",
    tips: [
      "Start bullets with action verbs (Led, Developed, Increased)",
      'Quantify achievements (e.g., "Increased sales by 25%")',
      "Focus on recent 10-15 years unless earlier roles are highly relevant",
    ],
    alwaysShow: true,
  },
  education: {
    id: "education",
    label: "Education",
    icon: EducationIcon,
    description: "Academic background and degrees",
    importance:
      "Validates your foundational knowledge and qualifications. For recent graduates, this section carries more weight. For experienced professionals, it provides credentialing.",
    tips: [
      "Include GPA only if 3.5+ and within 3 years of graduation",
      "List relevant coursework for entry-level positions",
      "Add honors, scholarships, or leadership roles",
    ],
    alwaysShow: true,
  },
  skills: {
    id: "skills",
    label: "Skills",
    icon: SkillsIcon,
    description: "Technical and soft skills",
    importance:
      "Critical for ATS (Applicant Tracking Systems) parsing. Many companies filter candidates based on keyword matches. Include both hard skills (software, tools) and soft skills (leadership, communication).",
    tips: [
      "Mirror keywords from the job description",
      "Organize by category (Technical, Languages, Tools)",
      "Be honest—you may be tested on these",
    ],
    alwaysShow: true,
  },
  projects: {
    id: "projects",
    label: "Projects",
    icon: ProjectIcon,
    description: "Personal or professional projects",
    importance:
      "Especially valuable for tech roles, career changers, and recent graduates. Projects demonstrate initiative, practical skills, and passion beyond your day job.",
    tips: [
      "Include links to live demos or GitHub repos",
      "Describe the problem solved and technologies used",
      "Highlight your specific contributions on team projects",
    ],
  },
  certifications: {
    id: "certifications",
    label: "Certifications",
    icon: CertificationIcon,
    description: "Professional certifications and credentials",
    importance:
      "Industry certifications validate specialized knowledge and commitment to professional development. In fields like IT, healthcare, and finance, they can be deal-breakers.",
    tips: [
      "List most relevant/recent certifications first",
      "Include expiration dates if applicable",
      "Add credential IDs for easy verification",
    ],
  },
  publications: {
    id: "publications",
    label: "Publications",
    icon: PublicationIcon,
    description: "Research papers, articles, or books",
    importance:
      "Establishes thought leadership and expertise. Highly valued in academia, research, and senior industry positions. Shows you contribute to your field's body of knowledge.",
    tips: [
      "Use proper citation format",
      "Include DOI or links when available",
      "Highlight publications in prestigious journals",
    ],
  },
  awards: {
    id: "awards",
    label: "Awards & Honors",
    icon: AwardIcon,
    description: "Recognition and achievements",
    importance:
      "Third-party validation of your excellence. Awards differentiate you from other candidates by proving others have recognized your outstanding performance.",
    tips: [
      "Include the awarding organization",
      "Briefly explain the significance if not obvious",
      'Mention selection criteria (e.g., "Top 5% of 500 employees")',
    ],
  },
  volunteer: {
    id: "volunteer",
    label: "Volunteer Experience",
    icon: VolunteerIcon,
    description: "Community service and volunteer work",
    importance:
      "Demonstrates character, values, and well-roundedness. Can fill employment gaps and showcase leadership or skills developed outside paid work. Many employers value community involvement.",
    tips: [
      "Treat it like work experience with accomplishments",
      "Highlight transferable skills gained",
      "Choose causes aligned with company values when possible",
    ],
  },
  languages: {
    id: "languages",
    label: "Languages",
    icon: LanguageIcon,
    description: "Language proficiencies",
    importance:
      "A major asset in global companies and diverse markets. Multilingual candidates can access opportunities others cannot and often command higher salaries in international roles.",
    tips: [
      "Be honest about proficiency levels",
      "Use standard terms: Native, Fluent, Conversational, Basic",
      "Mention any certifications (TOEFL, DELE, JLPT)",
    ],
  },
  memberships: {
    id: "memberships",
    label: "Professional Memberships",
    icon: MembershipIcon,
    description: "Industry associations and organizations",
    importance:
      "Shows active engagement with your profession. Memberships indicate you stay current with industry trends, network with peers, and invest in your career development.",
    tips: [
      "Include leadership roles held",
      "Mention conference presentations or committee work",
      "Focus on well-known, respected organizations",
    ],
  },
  licenses: {
    id: "licenses",
    label: "Licenses",
    icon: LicenseIcon,
    description: "Professional licenses",
    importance:
      "Required for many regulated professions (law, medicine, real estate, engineering). Without proper licensing, you may be ineligible for certain positions regardless of experience.",
    tips: [
      "List license numbers for verification",
      "Include state/jurisdiction",
      "Note expiration dates and keep them current",
    ],
  },
  interests: {
    id: "interests",
    label: "Interests & Hobbies",
    icon: InterestsIcon,
    description: "Personal interests relevant to career",
    importance:
      "Humanizes your resume and can spark conversation in interviews. Shared interests build rapport. Strategic interests can reinforce your professional brand (e.g., chess for analytical roles).",
    tips: [
      "Keep it brief—3-5 interests max",
      "Avoid controversial topics",
      "Choose interests that reflect positively on your character",
    ],
  },
  references: {
    id: "references",
    label: "References",
    icon: ReferenceIcon,
    description: "Professional references",
    importance:
      'Strong references can seal the deal. While "References available upon request" is outdated, having references ready shows preparation. Some employers still want them upfront.',
    tips: [
      "Always ask permission before listing someone",
      "Brief your references on the role you're pursuing",
      "Include a mix of supervisors and colleagues",
    ],
  },
};

// Use comprehensive O*NET skills database (4,400+ skills, abilities, knowledge areas, and tools)
// Auto-updated monthly via GitHub Actions from O*NET Resource Center
const SKILL_SUGGESTIONS = onetSkillsData.skills;
const SKILLS_BY_INDUSTRY = onetSkillsData.byIndustry || {};
const SKILL_INDUSTRIES = onetSkillsData.industries || [];

// Create a flat list with industry info for grouped autocomplete
const GROUPED_SKILLS = [];
// Priority order for industries (Core Skills first, then alphabetical, General last)
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

for (const industry of INDUSTRY_ORDER) {
  if (SKILLS_BY_INDUSTRY[industry]) {
    for (const skill of SKILLS_BY_INDUSTRY[industry]) {
      GROUPED_SKILLS.push({ name: skill, industry });
    }
  }
}

// Common interests/hobbies suggestions (kept as static list - not career-focused)
const INTEREST_SUGGESTIONS = [
  "Reading",
  "Writing",
  "Blogging",
  "Photography",
  "Hiking",
  "Running",
  "Cycling",
  "Swimming",
  "Yoga",
  "Fitness",
  "Traveling",
  "Cooking",
  "Baking",
  "Music",
  "Playing Guitar",
  "Playing Piano",
  "Singing",
  "Dancing",
  "Gaming",
  "Chess",
  "Board Games",
  "Podcasts",
  "Volunteering",
  "Mentoring",
  "Open Source",
  "Coding",
  "Art",
  "Painting",
  "Drawing",
  "Crafts",
  "DIY Projects",
  "Gardening",
  "Nature",
  "Wildlife",
  "Sports",
  "Basketball",
  "Soccer",
  "Tennis",
  "Golf",
  "Skiing",
  "Snowboarding",
  "Surfing",
  "Languages",
  "Cultural Exchange",
  "History",
  "Philosophy",
  "Science",
  "Technology",
  "Astronomy",
  "Meditation",
  "Mindfulness",
  "Personal Development",
  "Entrepreneurship",
  "Investing",
];

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function UserProfilePage() {
  const navigate = useNavigate();
  const { currentUser, userProfile, getIdToken, API_URL, fetchUserProfile } =
    useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  // Enabled sections - which tabs to show (core sections always included by default)
  const [enabledSections, setEnabledSections] = useState([
    "contact",
    "workExperience",
    "skills",
    "education",
  ]);

  // Add section menu
  const [addSectionAnchor, setAddSectionAnchor] = useState(null);

  // Drag and drop state for reordering tabs
  const [draggedTab, setDraggedTab] = useState(null);
  const [dragOverTab, setDragOverTab] = useState(null);

  // Warning dialog for removing sections with data
  const [removeWarningDialog, setRemoveWarningDialog] = useState({
    open: false,
    sectionId: null,
  });

  // Profile data state
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    additionalEmails: [], // Array of additional email objects: { email: "", label: "" }
    selectedEmailForResume: "primary", // "primary" or index of additional email
    phone: "",
    additionalPhones: [], // Array of additional phone objects: { phone: "", label: "" }
    selectedPhoneForResume: "primary", // "primary" or index of additional phone
    location: "",
    linkedinUrl: "",
    portfolioUrl: "",
    githubUrl: "",
    yearsExperience: "",
    careerLevel: "",
    currentTitle: "",
    additionalTitles: [], // Array of additional job titles: { title: "", label: "" }
    selectedTitleForResume: "primary", // "primary" or index of additional title
    summary: "",
  });

  // Section data states
  const [workExperience, setWorkExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [publications, setPublications] = useState([]);
  const [awards, setAwards] = useState([]);
  const [volunteer, setVolunteer] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [interests, setInterests] = useState([]);
  const [references, setReferences] = useState([]);

  // Edit mode states
  const [editingContact, setEditingContact] = useState(false);
  const [contactViewMode, setContactViewMode] = useState("simple"); // "simple" or "detailed"

  // Input states for chip-based fields
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  // Dialog states
  const [dialogState, setDialogState] = useState({
    type: null,
    open: false,
    data: null,
    index: -1,
  });

  // Load profile data
  useEffect(() => {
    if (userProfile) {
      const prefs = userProfile.workPreferences || {};
      setProfileData({
        fullName: userProfile.fullName || currentUser?.displayName || "",
        email: currentUser?.email || "",
        additionalEmails: prefs.additionalEmails || [],
        selectedEmailForResume: prefs.selectedEmailForResume || "primary",
        phone: userProfile.phone || "",
        additionalPhones: prefs.additionalPhones || [],
        selectedPhoneForResume: prefs.selectedPhoneForResume || "primary",
        location: userProfile.location || "",
        linkedinUrl: userProfile.linkedinUrl || "",
        portfolioUrl: prefs.portfolioUrl || userProfile.portfolioUrl || "",
        githubUrl: prefs.githubUrl || userProfile.githubUrl || "",
        yearsExperience: userProfile.yearsExperience || "",
        careerLevel: userProfile.careerLevel || "",
        currentTitle: prefs.currentTitle || userProfile.currentTitle || "",
        additionalTitles: prefs.additionalTitles || [],
        selectedTitleForResume: prefs.selectedTitleForResume || "primary",
        summary: prefs.summary || userProfile.summary || "",
      });

      // Build enabled sections based on what data exists
      // Always include core resume sections: Contact, Work Experience, Skills, Education
      const sections = ["contact", "workExperience", "skills", "education"];

      // Load data for core sections
      if (prefs.workExperience?.length > 0) {
        setWorkExperience(prefs.workExperience);
      }
      if (prefs.education?.length > 0) {
        setEducation(prefs.education);
      }
      if (userProfile.skills?.length > 0 || prefs.skills?.length > 0) {
        setSkills(prefs.skills || userProfile.skills || []);
      }

      // Add optional sections based on data
      if (prefs.summary || userProfile.summary) sections.push("summary");
      if (prefs.projects?.length > 0) {
        setProjects(prefs.projects);
        sections.push("projects");
      }
      if (
        userProfile.certifications?.length > 0 ||
        prefs.certifications?.length > 0
      ) {
        setCertifications(
          prefs.certifications || userProfile.certifications || []
        );
        sections.push("certifications");
      }
      if (prefs.publications?.length > 0) {
        setPublications(prefs.publications);
        sections.push("publications");
      }
      if (prefs.awards?.length > 0) {
        setAwards(prefs.awards);
        sections.push("awards");
      }
      if (prefs.volunteer?.length > 0) {
        setVolunteer(prefs.volunteer);
        sections.push("volunteer");
      }
      if (userProfile.languages?.length > 0 || prefs.languages?.length > 0) {
        setLanguages(prefs.languages || userProfile.languages || []);
        sections.push("languages");
      }
      if (prefs.memberships?.length > 0) {
        setMemberships(prefs.memberships);
        sections.push("memberships");
      }
      if (prefs.licenses?.length > 0) {
        setLicenses(prefs.licenses);
        sections.push("licenses");
      }
      if (prefs.interests?.length > 0) {
        setInterests(prefs.interests);
        sections.push("interests");
      }
      if (prefs.references?.length > 0) {
        setReferences(prefs.references);
        sections.push("references");
      }

      if (prefs.enabledSections?.length > 0) {
        prefs.enabledSections.forEach((s) => {
          if (!sections.includes(s)) sections.push(s);
        });
      }

      setEnabledSections(sections);
    }
  }, [userProfile, currentUser]);

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  // Drag and drop handlers for reordering tabs
  const handleDragStart = (e, sectionId, index) => {
    setDraggedTab({ sectionId, index });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sectionId);
  };

  const handleDragOver = (e, sectionId, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedTab && draggedTab.sectionId !== sectionId) {
      setDragOverTab({ sectionId, index });
    }
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e, targetSectionId, targetIndex) => {
    e.preventDefault();
    if (!draggedTab || draggedTab.sectionId === targetSectionId) {
      setDraggedTab(null);
      setDragOverTab(null);
      return;
    }

    const newSections = [...enabledSections];
    const draggedIndex = newSections.indexOf(draggedTab.sectionId);

    // Remove from old position
    newSections.splice(draggedIndex, 1);

    // Find new target index (may have shifted)
    const newTargetIndex = newSections.indexOf(targetSectionId);

    // Insert at new position
    newSections.splice(newTargetIndex, 0, draggedTab.sectionId);

    setEnabledSections(newSections);

    // Update active tab to follow the dragged section
    setActiveTab(newSections.indexOf(draggedTab.sectionId));

    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handleInputChange = (field) => (event) => {
    setProfileData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAddSection = (sectionId) => {
    if (!enabledSections.includes(sectionId)) {
      setEnabledSections([...enabledSections, sectionId]);
      setActiveTab(enabledSections.length);
    }
    setAddSectionAnchor(null);
  };

  // Check if a section has data that would be lost on removal
  const sectionHasData = (sectionId) => {
    switch (sectionId) {
      case "summary":
        return !!(profileData.summary && profileData.summary.trim());
      case "projects":
        return projects.length > 0;
      case "certifications":
        return certifications.length > 0;
      case "publications":
        return publications.length > 0;
      case "awards":
        return awards.length > 0;
      case "volunteer":
        return volunteer.length > 0;
      case "languages":
        return languages.length > 0;
      case "memberships":
        return memberships.length > 0;
      case "licenses":
        return licenses.length > 0;
      case "interests":
        return interests.length > 0;
      case "references":
        return references.length > 0;
      default:
        return false;
    }
  };

  // Attempt to remove a section - may show warning if section has data
  const attemptRemoveSection = (sectionId) => {
    const coreSections = ["contact", "workExperience", "skills", "education"];
    if (coreSections.includes(sectionId)) return;

    if (sectionHasData(sectionId)) {
      setRemoveWarningDialog({ open: true, sectionId });
    } else {
      handleRemoveSection(sectionId);
    }
  };

  // Confirm removal after warning
  const confirmRemoveSection = () => {
    if (removeWarningDialog.sectionId) {
      handleRemoveSection(removeWarningDialog.sectionId);
    }
    setRemoveWarningDialog({ open: false, sectionId: null });
  };

  const handleRemoveSection = (sectionId) => {
    // Core sections cannot be removed
    const coreSections = ["contact", "workExperience", "skills", "education"];
    if (coreSections.includes(sectionId)) return;
    const newSections = enabledSections.filter((s) => s !== sectionId);
    setEnabledSections(newSections);
    if (activeTab >= newSections.length)
      setActiveTab(Math.max(0, newSections.length - 1));
  };

  const getAvailableSections = () => {
    return Object.values(ALL_SECTIONS).filter(
      (section) => !enabledSections.includes(section.id) && !section.alwaysShow
    );
  };

  const openDialog = (type, data = null, index = -1) => {
    const defaults = {
      workExperience: {
        company: "",
        title: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      },
      education: {
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
        achievements: "",
      },
      projects: {
        name: "",
        description: "",
        technologies: [],
        url: "",
        startDate: "",
        endDate: "",
      },
      certifications: {
        name: "",
        issuer: "",
        date: "",
        expiryDate: "",
        credentialId: "",
        url: "",
      },
      publications: {
        title: "",
        publisher: "",
        date: "",
        authors: "",
        url: "",
        description: "",
      },
      awards: { name: "", issuer: "", date: "", description: "" },
      volunteer: {
        organization: "",
        role: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      },
      memberships: { organization: "", role: "", startDate: "", endDate: "" },
      licenses: {
        name: "",
        issuer: "",
        date: "",
        expiryDate: "",
        licenseNumber: "",
      },
      references: {
        name: "",
        title: "",
        company: "",
        email: "",
        phone: "",
        relationship: "",
      },
      languages: { language: "", proficiency: "" },
    };
    setDialogState({
      type,
      open: true,
      data: data || defaults[type] || {},
      index,
    });
  };

  const closeDialog = () =>
    setDialogState({ type: null, open: false, data: null, index: -1 });

  const saveDialogItem = () => {
    const { type, data, index } = dialogState;
    const setters = {
      workExperience: setWorkExperience,
      education: setEducation,
      projects: setProjects,
      certifications: setCertifications,
      publications: setPublications,
      awards: setAwards,
      volunteer: setVolunteer,
      memberships: setMemberships,
      licenses: setLicenses,
      references: setReferences,
      languages: setLanguages,
    };
    const states = {
      workExperience,
      education,
      projects,
      certifications,
      publications,
      awards,
      volunteer,
      memberships,
      licenses,
      references,
      languages,
    };
    const setter = setters[type];
    const currentState = states[type];
    if (setter && currentState !== undefined) {
      if (index === -1) setter([...currentState, data]);
      else {
        const updated = [...currentState];
        updated[index] = data;
        setter(updated);
      }
    }
    closeDialog();
  };

  const deleteItem = (type, index) => {
    const setters = {
      workExperience: setWorkExperience,
      education: setEducation,
      projects: setProjects,
      certifications: setCertifications,
      publications: setPublications,
      awards: setAwards,
      volunteer: setVolunteer,
      memberships: setMemberships,
      licenses: setLicenses,
      references: setReferences,
      languages: setLanguages,
    };
    const states = {
      workExperience,
      education,
      projects,
      certifications,
      publications,
      awards,
      volunteer,
      memberships,
      licenses,
      references,
      languages,
    };
    const setter = setters[type];
    const currentState = states[type];
    if (setter && currentState)
      setter(currentState.filter((_, i) => i !== index));
  };

  const handleAddChip = (value, currentList, setter, inputSetter) => {
    if (value.trim() && !currentList.includes(value.trim()))
      setter([...currentList, value.trim()]);
    inputSetter("");
  };

  const handleRemoveChip = (value, currentList, setter) => {
    setter(currentList.filter((item) => item !== value));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
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
          fullName: profileData.fullName,
          phone: profileData.phone,
          location: profileData.location,
          linkedinUrl: profileData.linkedinUrl,
          yearsExperience: profileData.yearsExperience
            ? parseInt(profileData.yearsExperience)
            : null,
          careerLevel: profileData.careerLevel,
          skills: skills,
          certifications: certifications.map((c) =>
            typeof c === "string" ? c : c.name
          ),
          languages: languages.map((l) =>
            typeof l === "string" ? l : l.language
          ),
          workPreferences: {
            enabledSections,
            summary: profileData.summary,
            currentTitle: profileData.currentTitle,
            additionalTitles: profileData.additionalTitles,
            selectedTitleForResume: profileData.selectedTitleForResume,
            portfolioUrl: profileData.portfolioUrl,
            githubUrl: profileData.githubUrl,
            additionalEmails: profileData.additionalEmails,
            selectedEmailForResume: profileData.selectedEmailForResume,
            additionalPhones: profileData.additionalPhones,
            selectedPhoneForResume: profileData.selectedPhoneForResume,
            workExperience,
            education,
            projects,
            skills,
            certifications,
            publications,
            awards,
            volunteer,
            languages,
            memberships,
            licenses,
            interests,
            references,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to save profile");
      await fetchUserProfile(currentUser);
      setSuccess("Profile saved successfully!");
      setEditingContact(false);
    } catch (err) {
      console.error("Profile save error:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const renderSectionContent = (sectionId) => {
    switch (sectionId) {
      case "contact":
        return renderContactSection();
      case "summary":
        return renderSummarySection();
      case "workExperience":
        return renderListSection(
          "workExperience",
          workExperience,
          "Work Experience",
          "Add your employment history",
          (item) => ({
            primary: item.title,
            secondary: `${item.company} • ${item.startDate} - ${
              item.current ? "Present" : item.endDate
            }`,
            description: item.description,
          })
        );
      case "education":
        return renderListSection(
          "education",
          education,
          "Education",
          "Add your academic background",
          (item) => ({
            primary: `${item.degree} in ${item.field}`,
            secondary: `${item.institution} • ${item.startDate} - ${item.endDate}`,
            description: item.achievements,
          })
        );
      case "skills":
        return renderChipSection(
          "skills",
          skills,
          setSkills,
          skillInput,
          setSkillInput,
          "Skills",
          "Add your technical and soft skills"
        );
      case "projects":
        return renderListSection(
          "projects",
          projects,
          "Projects",
          "Showcase your notable projects",
          (item) => ({
            primary: item.name,
            secondary: item.technologies?.join(", "),
            description: item.description,
          })
        );
      case "certifications":
        return renderListSection(
          "certifications",
          certifications,
          "Certifications",
          "Add your professional certifications",
          (item) =>
            typeof item === "string"
              ? { primary: item, secondary: "" }
              : {
                  primary: item.name,
                  secondary: `${item.issuer} • ${item.date}`,
                }
        );
      case "publications":
        return renderListSection(
          "publications",
          publications,
          "Publications",
          "Add your research papers, articles, or books",
          (item) => ({
            primary: item.title,
            secondary: `${item.publisher} • ${item.date}`,
            description: item.description,
          })
        );
      case "awards":
        return renderListSection(
          "awards",
          awards,
          "Awards & Honors",
          "Add recognition and achievements",
          (item) => ({
            primary: item.name,
            secondary: `${item.issuer} • ${item.date}`,
            description: item.description,
          })
        );
      case "volunteer":
        return renderListSection(
          "volunteer",
          volunteer,
          "Volunteer Experience",
          "Add community service and volunteer work",
          (item) => ({
            primary: item.role,
            secondary: `${item.organization} • ${item.startDate} - ${item.endDate}`,
            description: item.description,
          })
        );
      case "languages":
        return renderListSection(
          "languages",
          languages,
          "Languages",
          "Add language proficiencies",
          (item) =>
            typeof item === "string"
              ? { primary: item, secondary: "" }
              : { primary: item.language, secondary: item.proficiency }
        );
      case "memberships":
        return renderListSection(
          "memberships",
          memberships,
          "Professional Memberships",
          "Add industry associations",
          (item) => ({ primary: item.organization, secondary: item.role })
        );
      case "licenses":
        return renderListSection(
          "licenses",
          licenses,
          "Licenses",
          "Add professional licenses",
          (item) => ({
            primary: item.name,
            secondary: `${item.issuer} • ${item.date}`,
          })
        );
      case "interests":
        return renderChipSection(
          "interests",
          interests,
          setInterests,
          interestInput,
          setInterestInput,
          "Interests & Hobbies",
          "Add personal interests relevant to your career"
        );
      case "references":
        return renderListSection(
          "references",
          references,
          "References",
          "Add professional references",
          (item) => ({
            primary: item.name,
            secondary: `${item.title} at ${item.company}`,
          })
        );
      default:
        return null;
    }
  };

  const renderContactSection = () => {
    const section = ALL_SECTIONS.contact;
    return (
      <Box>
        <Accordion
          sx={{
            mb: 2,
            bgcolor: "rgba(144, 202, 249, 0.08)",
            "&:before": { display: "none" },
          }}
          defaultExpanded={false}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InfoIcon color="info" fontSize="small" />
              <Typography variant="subtitle2" color="info.main">
                Why this section matters
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {section.importance}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <TipIcon color="warning" fontSize="small" sx={{ mt: 0.5 }} />
              <Box>
                <Typography
                  variant="subtitle2"
                  color="warning.main"
                  sx={{ mb: 0.5 }}
                >
                  Pro Tips
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {section.tips.map((tip, i) => (
                    <Typography
                      key={i}
                      component="li"
                      variant="body2"
                      color="text.secondary"
                    >
                      {tip}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
        <Card>
          <CardHeader
            title="Contact Information"
            subheader={
              contactViewMode === "simple"
                ? "Essential fields only"
                : "All fields and options"
            }
            action={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip
                  title={
                    contactViewMode === "simple"
                      ? "Switch to Detailed View"
                      : "Switch to Simple View"
                  }
                >
                  <IconButton
                    onClick={() =>
                      setContactViewMode((prev) =>
                        prev === "simple" ? "detailed" : "simple"
                      )
                    }
                    color={
                      contactViewMode === "detailed" ? "primary" : "default"
                    }
                  >
                    {contactViewMode === "simple" ? (
                      <DetailedViewIcon />
                    ) : (
                      <SimpleViewIcon />
                    )}
                  </IconButton>
                </Tooltip>
                {!editingContact && (
                  <IconButton onClick={() => setEditingContact(true)}>
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            }
          />
          <CardContent>
            {/* Simple View */}
            {contactViewMode === "simple" && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={profileData.fullName}
                      onChange={handleInputChange("fullName")}
                      disabled={!editingContact}
                      placeholder="John Smith"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Job Title"
                      value={profileData.currentTitle}
                      onChange={handleInputChange("currentTitle")}
                      disabled={!editingContact}
                      placeholder="Senior Software Engineer"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profileData.phone}
                      onChange={handleInputChange("phone")}
                      disabled={!editingContact}
                      placeholder="+1 (555) 123-4567"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocationAutocomplete
                      value={profileData.location}
                      onChange={(newValue) =>
                        setProfileData((prev) => ({
                          ...prev,
                          location: newValue,
                        }))
                      }
                      disabled={!editingContact}
                      placeholder="San Francisco, CA or 94102"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="LinkedIn URL"
                      value={profileData.linkedinUrl}
                      onChange={handleInputChange("linkedinUrl")}
                      disabled={!editingContact}
                      placeholder="https://linkedin.com/in/yourprofile"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LanguageIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Show counts if there are additional items */}
                {((profileData.additionalTitles || []).length > 0 ||
                  (profileData.additionalPhones || []).length > 0 ||
                  (profileData.additionalEmails || []).length > 0) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <InfoIcon fontSize="inherit" />
                      You have additional items:
                      {(profileData.additionalTitles || []).length > 0 &&
                        ` ${
                          (profileData.additionalTitles || []).length
                        } more title(s)`}
                      {(profileData.additionalPhones || []).length > 0 &&
                        ` ${
                          (profileData.additionalPhones || []).length
                        } more phone(s)`}
                      {(profileData.additionalEmails || []).length > 0 &&
                        ` ${
                          (profileData.additionalEmails || []).length
                        } more email(s)`}
                      .
                      <Button
                        size="small"
                        onClick={() => setContactViewMode("detailed")}
                        sx={{ ml: 1, textTransform: "none" }}
                      >
                        View in Detailed Mode
                      </Button>
                    </Typography>
                  </Box>
                )}

                {editingContact && (
                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      gap: 2,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setEditingContact(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Detailed View */}
            {contactViewMode === "detailed" && (
              <Box>
                {/* Personal Identity Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PersonIcon fontSize="small" />
                    Personal Identity
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={profileData.fullName}
                        onChange={handleInputChange("fullName")}
                        disabled={!editingContact}
                        placeholder="John Smith"
                        InputProps={{
                          sx: {
                            "& input::placeholder": {
                              color: "text.disabled",
                              opacity: 0.7,
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Job Titles Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <WorkIcon fontSize="small" />
                    Job Titles
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 2 }}
                  >
                    Add multiple titles if you work multiple jobs. Select which
                    appears on your resume, or choose "All" to show all titles.
                  </Typography>

                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={profileData.selectedTitleForResume}
                      onChange={(e) => {
                        if (editingContact) {
                          setProfileData((prev) => ({
                            ...prev,
                            selectedTitleForResume: e.target.value,
                          }));
                        }
                      }}
                    >
                      {/* All Titles Option - only show if there are additional titles */}
                      {(profileData.additionalTitles || []).length > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor:
                              profileData.selectedTitleForResume === "all"
                                ? "action.selected"
                                : "transparent",
                            border: 1,
                            borderColor:
                              profileData.selectedTitleForResume === "all"
                                ? "primary.main"
                                : "divider",
                          }}
                        >
                          <FormControlLabel
                            value="all"
                            control={
                              <Radio size="small" disabled={!editingContact} />
                            }
                            label=""
                            sx={{ mr: 0, ml: 0 }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Show all job titles on resume
                          </Typography>
                        </Box>
                      )}

                      {/* Primary Title */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor:
                            profileData.selectedTitleForResume === "primary"
                              ? "action.selected"
                              : "transparent",
                          border: 1,
                          borderColor:
                            profileData.selectedTitleForResume === "primary"
                              ? "primary.main"
                              : "divider",
                        }}
                      >
                        <FormControlLabel
                          value="primary"
                          control={
                            <Radio size="small" disabled={!editingContact} />
                          }
                          label=""
                          sx={{ mr: 0, ml: 0 }}
                        />
                        <TextField
                          sx={{ flexGrow: 1 }}
                          label="Primary Job Title"
                          value={profileData.currentTitle}
                          onChange={handleInputChange("currentTitle")}
                          disabled={!editingContact}
                          size="small"
                          placeholder="Senior Software Engineer"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <WorkIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                            sx: {
                              "& input::placeholder": {
                                color: "text.disabled",
                                opacity: 0.7,
                              },
                            },
                          }}
                        />
                      </Box>

                      {/* Additional Titles */}
                      {(profileData.additionalTitles || []).map(
                        (titleObj, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.5,
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor:
                                profileData.selectedTitleForResume ===
                                String(index)
                                  ? "action.selected"
                                  : "transparent",
                              border: 1,
                              borderColor:
                                profileData.selectedTitleForResume ===
                                String(index)
                                  ? "primary.main"
                                  : "divider",
                            }}
                          >
                            <FormControlLabel
                              value={String(index)}
                              control={
                                <Radio
                                  size="small"
                                  disabled={!editingContact}
                                />
                              }
                              label=""
                              sx={{ mr: 0, ml: 0 }}
                            />
                            <TextField
                              sx={{ flexGrow: 1 }}
                              label={
                                titleObj.label ||
                                `Additional Title ${index + 1}`
                              }
                              value={titleObj.title}
                              disabled={!editingContact}
                              size="small"
                              placeholder="Product Manager"
                              onChange={(e) => {
                                const newTitles = [
                                  ...(profileData.additionalTitles || []),
                                ];
                                newTitles[index] = {
                                  ...newTitles[index],
                                  title: e.target.value,
                                };
                                setProfileData((prev) => ({
                                  ...prev,
                                  additionalTitles: newTitles,
                                }));
                              }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <WorkIcon fontSize="small" color="action" />
                                  </InputAdornment>
                                ),
                                sx: {
                                  "& input::placeholder": {
                                    color: "text.disabled",
                                    opacity: 0.7,
                                  },
                                },
                              }}
                            />
                            <TextField
                              label="Label"
                              value={titleObj.label}
                              disabled={!editingContact}
                              size="small"
                              placeholder="Part-time"
                              sx={{ width: 120 }}
                              onChange={(e) => {
                                const newTitles = [
                                  ...(profileData.additionalTitles || []),
                                ];
                                newTitles[index] = {
                                  ...newTitles[index],
                                  label: e.target.value,
                                };
                                setProfileData((prev) => ({
                                  ...prev,
                                  additionalTitles: newTitles,
                                }));
                              }}
                              InputProps={{
                                sx: {
                                  "& input::placeholder": {
                                    color: "text.disabled",
                                    opacity: 0.7,
                                  },
                                },
                              }}
                            />
                            {editingContact && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  const newTitles = (
                                    profileData.additionalTitles || []
                                  ).filter((_, i) => i !== index);
                                  let newSelected =
                                    profileData.selectedTitleForResume;
                                  if (
                                    profileData.selectedTitleForResume ===
                                    String(index)
                                  ) {
                                    newSelected = "primary";
                                  } else if (
                                    parseInt(
                                      profileData.selectedTitleForResume
                                    ) > index
                                  ) {
                                    newSelected = String(
                                      parseInt(
                                        profileData.selectedTitleForResume
                                      ) - 1
                                    );
                                  }
                                  setProfileData((prev) => ({
                                    ...prev,
                                    additionalTitles: newTitles,
                                    selectedTitleForResume: newSelected,
                                  }));
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )
                      )}
                    </RadioGroup>

                    {/* Add Title Button */}
                    {editingContact && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setProfileData((prev) => ({
                            ...prev,
                            additionalTitles: [
                              ...(prev.additionalTitles || []),
                              { title: "", label: "" },
                            ],
                          }));
                        }}
                        sx={{ mt: 1, alignSelf: "flex-start" }}
                      >
                        Add Another Title
                      </Button>
                    )}
                  </FormControl>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Phone Numbers Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PhoneIcon fontSize="small" />
                    Phone Numbers
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 2 }}
                  >
                    Add multiple phone numbers. Select which appears on your
                    resume, or choose "All" to show all.
                  </Typography>

                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={profileData.selectedPhoneForResume}
                      onChange={(e) => {
                        if (editingContact) {
                          setProfileData((prev) => ({
                            ...prev,
                            selectedPhoneForResume: e.target.value,
                          }));
                        }
                      }}
                    >
                      {/* All Phones Option - only show if there are additional phones */}
                      {(profileData.additionalPhones || []).length > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor:
                              profileData.selectedPhoneForResume === "all"
                                ? "action.selected"
                                : "transparent",
                            border: 1,
                            borderColor:
                              profileData.selectedPhoneForResume === "all"
                                ? "primary.main"
                                : "divider",
                          }}
                        >
                          <FormControlLabel
                            value="all"
                            control={
                              <Radio size="small" disabled={!editingContact} />
                            }
                            label=""
                            sx={{ mr: 0, ml: 0 }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Show all phone numbers on resume
                          </Typography>
                        </Box>
                      )}

                      {/* Primary Phone */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor:
                            profileData.selectedPhoneForResume === "primary"
                              ? "action.selected"
                              : "transparent",
                          border: 1,
                          borderColor:
                            profileData.selectedPhoneForResume === "primary"
                              ? "primary.main"
                              : "divider",
                        }}
                      >
                        <FormControlLabel
                          value="primary"
                          control={
                            <Radio size="small" disabled={!editingContact} />
                          }
                          label=""
                          sx={{ mr: 0, ml: 0 }}
                        />
                        <TextField
                          sx={{ flexGrow: 1 }}
                          label="Primary Phone"
                          value={profileData.phone}
                          onChange={handleInputChange("phone")}
                          disabled={!editingContact}
                          size="small"
                          placeholder="+1 (555) 123-4567"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                            sx: {
                              "& input::placeholder": {
                                color: "text.disabled",
                                opacity: 0.7,
                              },
                            },
                          }}
                        />
                      </Box>

                      {/* Additional Phones */}
                      {(profileData.additionalPhones || []).map(
                        (phoneObj, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.5,
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor:
                                profileData.selectedPhoneForResume ===
                                String(index)
                                  ? "action.selected"
                                  : "transparent",
                              border: 1,
                              borderColor:
                                profileData.selectedPhoneForResume ===
                                String(index)
                                  ? "primary.main"
                                  : "divider",
                            }}
                          >
                            <FormControlLabel
                              value={String(index)}
                              control={
                                <Radio
                                  size="small"
                                  disabled={!editingContact}
                                />
                              }
                              label=""
                              sx={{ mr: 0, ml: 0 }}
                            />
                            <TextField
                              sx={{ flexGrow: 1 }}
                              label={
                                phoneObj.label ||
                                `Additional Phone ${index + 1}`
                              }
                              value={phoneObj.phone}
                              disabled={!editingContact}
                              size="small"
                              placeholder="+1 (555) 987-6543"
                              onChange={(e) => {
                                const newPhones = [
                                  ...(profileData.additionalPhones || []),
                                ];
                                newPhones[index] = {
                                  ...newPhones[index],
                                  phone: e.target.value,
                                };
                                setProfileData((prev) => ({
                                  ...prev,
                                  additionalPhones: newPhones,
                                }));
                              }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <PhoneIcon
                                      fontSize="small"
                                      color="action"
                                    />
                                  </InputAdornment>
                                ),
                                sx: {
                                  "& input::placeholder": {
                                    color: "text.disabled",
                                    opacity: 0.7,
                                  },
                                },
                              }}
                            />
                            <TextField
                              label="Label"
                              value={phoneObj.label}
                              disabled={!editingContact}
                              size="small"
                              placeholder="Work"
                              sx={{ width: 120 }}
                              onChange={(e) => {
                                const newPhones = [
                                  ...(profileData.additionalPhones || []),
                                ];
                                newPhones[index] = {
                                  ...newPhones[index],
                                  label: e.target.value,
                                };
                                setProfileData((prev) => ({
                                  ...prev,
                                  additionalPhones: newPhones,
                                }));
                              }}
                              InputProps={{
                                sx: {
                                  "& input::placeholder": {
                                    color: "text.disabled",
                                    opacity: 0.7,
                                  },
                                },
                              }}
                            />
                            {editingContact && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  const newPhones = (
                                    profileData.additionalPhones || []
                                  ).filter((_, i) => i !== index);
                                  let newSelected =
                                    profileData.selectedPhoneForResume;
                                  if (
                                    profileData.selectedPhoneForResume ===
                                    String(index)
                                  ) {
                                    newSelected = "primary";
                                  } else if (
                                    parseInt(
                                      profileData.selectedPhoneForResume
                                    ) > index
                                  ) {
                                    newSelected = String(
                                      parseInt(
                                        profileData.selectedPhoneForResume
                                      ) - 1
                                    );
                                  }
                                  setProfileData((prev) => ({
                                    ...prev,
                                    additionalPhones: newPhones,
                                    selectedPhoneForResume: newSelected,
                                  }));
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )
                      )}
                    </RadioGroup>

                    {/* Add Phone Button */}
                    {editingContact && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setProfileData((prev) => ({
                            ...prev,
                            additionalPhones: [
                              ...(prev.additionalPhones || []),
                              { phone: "", label: "" },
                            ],
                          }));
                        }}
                        sx={{ mt: 1, alignSelf: "flex-start" }}
                      >
                        Add Another Phone
                      </Button>
                    )}
                  </FormControl>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Location Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PersonIcon fontSize="small" />
                    Location
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <LocationAutocomplete
                        value={profileData.location}
                        onChange={(newValue) =>
                          setProfileData((prev) => ({
                            ...prev,
                            location: newValue,
                          }))
                        }
                        disabled={!editingContact}
                        placeholder="San Francisco, CA or 94102"
                        helperText="Enter city, state or zip code for auto-fill"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Email Addresses Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <EmailIcon fontSize="small" />
                    Email Addresses
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 2 }}
                  >
                    Select which email will appear on your generated resume, or
                    choose "All" to show all.
                  </Typography>

                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={profileData.selectedEmailForResume}
                      onChange={(e) => {
                        if (editingContact) {
                          setProfileData((prev) => ({
                            ...prev,
                            selectedEmailForResume: e.target.value,
                          }));
                        }
                      }}
                    >
                      {/* All Emails Option - only show if there are additional emails */}
                      {(profileData.additionalEmails || []).length > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor:
                              profileData.selectedEmailForResume === "all"
                                ? "action.selected"
                                : "transparent",
                            border: 1,
                            borderColor:
                              profileData.selectedEmailForResume === "all"
                                ? "primary.main"
                                : "divider",
                          }}
                        >
                          <FormControlLabel
                            value="all"
                            control={
                              <Radio size="small" disabled={!editingContact} />
                            }
                            label=""
                            sx={{ mr: 0, ml: 0 }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Show all email addresses on resume
                          </Typography>
                        </Box>
                      )}

                      {/* Primary Email */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor:
                            profileData.selectedEmailForResume === "primary"
                              ? "action.selected"
                              : "transparent",
                          border: 1,
                          borderColor:
                            profileData.selectedEmailForResume === "primary"
                              ? "primary.main"
                              : "divider",
                        }}
                      >
                        <FormControlLabel
                          value="primary"
                          control={
                            <Radio size="small" disabled={!editingContact} />
                          }
                          label=""
                          sx={{ mr: 0, ml: 0 }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <TextField
                            fullWidth
                            label="Primary Email (Login)"
                            value={profileData.email}
                            disabled
                            size="small"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon fontSize="small" color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5, display: "block" }}
                          >
                            This is your login email and cannot be changed
                          </Typography>
                        </Box>
                      </Box>

                      {/* Additional Emails */}
                      {(profileData.additionalEmails || []).map(
                        (emailObj, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1.5,
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor:
                                profileData.selectedEmailForResume ===
                                String(index)
                                  ? "action.selected"
                                  : "transparent",
                              border: 1,
                              borderColor:
                                profileData.selectedEmailForResume ===
                                String(index)
                                  ? "primary.main"
                                  : "divider",
                            }}
                          >
                            <FormControlLabel
                              value={String(index)}
                              control={
                                <Radio
                                  size="small"
                                  disabled={!editingContact}
                                />
                              }
                              label=""
                              sx={{ mr: 0, ml: 0 }}
                            />
                            <TextField
                              sx={{ flexGrow: 1 }}
                              label={
                                emailObj.label ||
                                `Additional Email ${index + 1}`
                              }
                              value={emailObj.email}
                              disabled={!editingContact}
                              size="small"
                              placeholder="work@company.com"
                              onChange={(e) => {
                                const newEmails = [
                                  ...(profileData.additionalEmails || []),
                                ];
                                newEmails[index] = {
                                  ...newEmails[index],
                                  email: e.target.value,
                                };
                                setProfileData((prev) => ({
                                  ...prev,
                                  additionalEmails: newEmails,
                                }));
                              }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <EmailIcon
                                      fontSize="small"
                                      color="action"
                                    />
                                  </InputAdornment>
                                ),
                                sx: {
                                  "& input::placeholder": {
                                    color: "text.disabled",
                                    opacity: 0.7,
                                  },
                                },
                              }}
                            />
                            <TextField
                              label="Label"
                              value={emailObj.label}
                              disabled={!editingContact}
                              size="small"
                              placeholder="Work"
                              sx={{ width: 120 }}
                              onChange={(e) => {
                                const newEmails = [
                                  ...(profileData.additionalEmails || []),
                                ];
                                newEmails[index] = {
                                  ...newEmails[index],
                                  label: e.target.value,
                                };
                                setProfileData((prev) => ({
                                  ...prev,
                                  additionalEmails: newEmails,
                                }));
                              }}
                              InputProps={{
                                sx: {
                                  "& input::placeholder": {
                                    color: "text.disabled",
                                    opacity: 0.7,
                                  },
                                },
                              }}
                            />
                            {editingContact && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  const newEmails = (
                                    profileData.additionalEmails || []
                                  ).filter((_, i) => i !== index);
                                  // Adjust selected email if necessary
                                  let newSelected =
                                    profileData.selectedEmailForResume;
                                  if (
                                    profileData.selectedEmailForResume ===
                                    String(index)
                                  ) {
                                    newSelected = "primary";
                                  } else if (
                                    parseInt(
                                      profileData.selectedEmailForResume
                                    ) > index
                                  ) {
                                    newSelected = String(
                                      parseInt(
                                        profileData.selectedEmailForResume
                                      ) - 1
                                    );
                                  }
                                  setProfileData((prev) => ({
                                    ...prev,
                                    additionalEmails: newEmails,
                                    selectedEmailForResume: newSelected,
                                  }));
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )
                      )}
                    </RadioGroup>

                    {/* Add Email Button */}
                    {editingContact && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setProfileData((prev) => ({
                            ...prev,
                            additionalEmails: [
                              ...(prev.additionalEmails || []),
                              { email: "", label: "" },
                            ],
                          }));
                        }}
                        sx={{ mt: 1, alignSelf: "flex-start" }}
                      >
                        Add Another Email
                      </Button>
                    )}
                  </FormControl>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Professional Links Section */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <LanguageIcon fontSize="small" />
                    Professional Links
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="LinkedIn URL"
                        value={profileData.linkedinUrl}
                        onChange={handleInputChange("linkedinUrl")}
                        disabled={!editingContact}
                        placeholder="https://linkedin.com/in/yourprofile"
                        InputProps={{
                          sx: {
                            "& input::placeholder": {
                              color: "text.disabled",
                              opacity: 0.7,
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Portfolio / Personal Website"
                        value={profileData.portfolioUrl}
                        onChange={handleInputChange("portfolioUrl")}
                        disabled={!editingContact}
                        placeholder="https://yourportfolio.com"
                        InputProps={{
                          sx: {
                            "& input::placeholder": {
                              color: "text.disabled",
                              opacity: 0.7,
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="GitHub URL"
                        value={profileData.githubUrl}
                        onChange={handleInputChange("githubUrl")}
                        disabled={!editingContact}
                        placeholder="https://github.com/yourusername"
                        InputProps={{
                          sx: {
                            "& input::placeholder": {
                              color: "text.disabled",
                              opacity: 0.7,
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {editingContact && (
                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      gap: 2,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setEditingContact(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderSummarySection = () => {
    const section = ALL_SECTIONS.summary;
    return (
      <Box>
        <Accordion
          sx={{
            mb: 2,
            bgcolor: "rgba(144, 202, 249, 0.08)",
            "&:before": { display: "none" },
          }}
          defaultExpanded={false}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InfoIcon color="info" fontSize="small" />
              <Typography variant="subtitle2" color="info.main">
                Why this section matters
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {section.importance}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <TipIcon color="warning" fontSize="small" sx={{ mt: 0.5 }} />
              <Box>
                <Typography
                  variant="subtitle2"
                  color="warning.main"
                  sx={{ mb: 0.5 }}
                >
                  Pro Tips
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {section.tips.map((tip, i) => (
                    <Typography
                      key={i}
                      component="li"
                      variant="body2"
                      color="text.secondary"
                    >
                      {tip}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
        <Card>
          <CardHeader
            title="Professional Summary"
            subheader="A brief overview of your professional background and career goals"
            action={
              <Tooltip title="Remove this section">
                <IconButton
                  onClick={() => handleRemoveSection("summary")}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            }
          />
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={profileData.summary}
              onChange={handleInputChange("summary")}
              placeholder="Write a compelling summary that highlights your experience, skills, and career objectives..."
            />
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderListSection = (type, items, title, subheader, formatItem) => {
    const section = ALL_SECTIONS[type];
    const SectionIcon = section?.icon || ProjectIcon;
    const coreSections = ["contact", "workExperience", "skills", "education"];
    const canRemove = !coreSections.includes(type);
    return (
      <Box>
        {section?.importance && (
          <Accordion
            sx={{
              mb: 2,
              bgcolor: "rgba(144, 202, 249, 0.08)",
              "&:before": { display: "none" },
            }}
            defaultExpanded={false}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <InfoIcon color="info" fontSize="small" />
                <Typography variant="subtitle2" color="info.main">
                  Why this section matters
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {section.importance}
              </Typography>
              {section.tips && (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <TipIcon color="warning" fontSize="small" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="warning.main"
                      sx={{ mb: 0.5 }}
                    >
                      Pro Tips
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {section.tips.map((tip, i) => (
                        <Typography
                          key={i}
                          component="li"
                          variant="body2"
                          color="text.secondary"
                        >
                          {tip}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}
        <Card>
          <CardHeader
            title={title}
            subheader={subheader}
            action={
              <Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openDialog(type)}
                  sx={{ mr: 1 }}
                >
                  Add
                </Button>
                {canRemove && (
                  <Tooltip title="Remove this section">
                    <IconButton
                      onClick={() => handleRemoveSection(type)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            }
          />
          <CardContent>
            {items.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <SectionIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography color="text.secondary">
                  No items added yet. Click "Add" to get started.
                </Typography>
              </Box>
            ) : (
              <List>
                {items.map((item, index) => {
                  const formatted = formatItem(item);
                  return (
                    <Paper key={index} sx={{ mb: 2, p: 2 }}>
                      <ListItem
                        sx={{ px: 0 }}
                        secondaryAction={
                          <Box>
                            <IconButton
                              onClick={() => openDialog(type, item, index)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => deleteItem(type, index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={
                            <Typography variant="h6">
                              {formatted.primary}
                            </Typography>
                          }
                          secondary={
                            <>
                              {formatted.secondary && (
                                <Typography variant="subtitle1" color="primary">
                                  {formatted.secondary}
                                </Typography>
                              )}
                              {formatted.description && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {formatted.description}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    </Paper>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderChipSection = (
    type,
    items,
    setItems,
    input,
    setInput,
    title,
    subheader
  ) => {
    const section = ALL_SECTIONS[type];
    const SectionIcon = section?.icon || SkillsIcon;
    const coreSections = ["contact", "workExperience", "skills", "education"];
    const canRemove = !coreSections.includes(type);
    return (
      <Box>
        {section?.importance && (
          <Accordion
            sx={{
              mb: 2,
              bgcolor: "rgba(144, 202, 249, 0.08)",
              "&:before": { display: "none" },
            }}
            defaultExpanded={false}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <InfoIcon color="info" fontSize="small" />
                <Typography variant="subtitle2" color="info.main">
                  Why this section matters
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {section.importance}
              </Typography>
              {section.tips && (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <TipIcon color="warning" fontSize="small" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="warning.main"
                      sx={{ mb: 0.5 }}
                    >
                      Pro Tips
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {section.tips.map((tip, i) => (
                        <Typography
                          key={i}
                          component="li"
                          variant="body2"
                          color="text.secondary"
                        >
                          {tip}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )}
        <Card>
          <CardHeader
            title={title}
            subheader={subheader}
            avatar={<SectionIcon color="primary" />}
            action={
              canRemove && (
                <Tooltip title="Remove this section">
                  <IconButton
                    onClick={() => handleRemoveSection(type)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )
            }
          />
          <CardContent>
            <Autocomplete
              freeSolo
              options={
                type === "skills"
                  ? GROUPED_SKILLS.filter((s) => !items.includes(s.name))
                  : type === "interests"
                  ? INTEREST_SUGGESTIONS.filter((s) => !items.includes(s))
                  : []
              }
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.name
              }
              groupBy={(option) =>
                type === "skills" && typeof option === "object"
                  ? option.industry
                  : null
              }
              filterOptions={(options, { inputValue }) => {
                const filterValue = inputValue.toLowerCase();
                if (!filterValue) return options.slice(0, 50); // Show first 50 when empty
                return options
                  .filter((opt) => {
                    const name = typeof opt === "string" ? opt : opt.name;
                    return name.toLowerCase().includes(filterValue);
                  })
                  .slice(0, 100); // Limit results for performance
              }}
              inputValue={input}
              onInputChange={(event, newValue) => setInput(newValue)}
              onChange={(event, newValue) => {
                const value =
                  typeof newValue === "string" ? newValue : newValue?.name;
                if (value) {
                  handleAddChip(value, items, setItems, setInput);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label={`Add ${title.toLowerCase()} (press Enter)`}
                  helperText={
                    type === "skills"
                      ? "💡 4,400+ skills organized by industry — or type your own!"
                      : "💡 Type anything you want — suggestions are just ideas!"
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && input.trim()) {
                      e.preventDefault();
                      handleAddChip(input, items, setItems, setInput);
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
              sx={{ mb: 2 }}
              ListboxProps={{
                sx: { maxHeight: 400 },
              }}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {items.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  onDelete={() => handleRemoveChip(item, items, setItems)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderDialogContent = () => {
    const { type, data } = dialogState;
    if (!type || !data) return null;
    const updateData = (field, value) =>
      setDialogState((prev) => ({
        ...prev,
        data: { ...prev.data, [field]: value },
      }));

    const dialogFields = {
      workExperience: [
        { field: "title", label: "Job Title", md: 6 },
        { field: "company", label: "Company", md: 6 },
        { field: "location", label: "Location", md: 6, isLocation: true },
        {
          field: "startDate",
          label: "Start Date",
          isDate: true,
          views: ["year", "month"],
          md: 3,
        },
        {
          field: "endDate",
          label: "End Date",
          isDate: true,
          views: ["year", "month"],
          md: 3,
        },
        {
          field: "description",
          label: "Description & Achievements",
          multiline: true,
          rows: 4,
          md: 12,
          helperText:
            "Don't worry about grammar or spelling—AI will polish it for you.",
        },
      ],
      education: [
        { field: "institution", label: "Institution", md: 12 },
        { field: "degree", label: "Degree", md: 6 },
        { field: "field", label: "Field of Study", md: 6 },
        {
          field: "startDate",
          label: "Start Date",
          isDate: true,
          views: ["year"],
          md: 4,
        },
        {
          field: "endDate",
          label: "End Date",
          isDate: true,
          views: ["year"],
          md: 4,
        },
        { field: "gpa", label: "GPA (optional)", md: 4 },
        {
          field: "achievements",
          label: "Achievements (optional)",
          multiline: true,
          rows: 2,
          md: 12,
          helperText:
            "Don't worry about grammar or spelling—AI will polish it for you.",
        },
      ],
      projects: [
        { field: "name", label: "Project Name", md: 12 },
        {
          field: "description",
          label: "Description",
          multiline: true,
          rows: 3,
          md: 12,
          helperText:
            "Don't worry about grammar or spelling—AI will polish it for you.",
        },
        {
          field: "technologies",
          label: "Technologies (comma-separated)",
          md: 12,
          isArray: true,
        },
        { field: "url", label: "URL (optional)", md: 12 },
      ],
      certifications: [
        { field: "name", label: "Certification Name", md: 12 },
        { field: "issuer", label: "Issuing Organization", md: 6 },
        {
          field: "date",
          label: "Date Obtained",
          isDate: true,
          views: ["year", "month"],
          md: 6,
        },
        {
          field: "expiryDate",
          label: "Expiry Date (if applicable)",
          isDate: true,
          views: ["year", "month"],
          md: 6,
        },
        { field: "credentialId", label: "Credential ID", md: 6 },
        { field: "url", label: "Verification URL", md: 12 },
      ],
      publications: [
        { field: "title", label: "Title", md: 12 },
        { field: "publisher", label: "Publisher/Journal", md: 6 },
        {
          field: "date",
          label: "Publication Date",
          isDate: true,
          views: ["year", "month"],
          md: 6,
        },
        { field: "authors", label: "Co-authors (if any)", md: 12 },
        { field: "url", label: "URL/DOI", md: 12 },
        {
          field: "description",
          label: "Description",
          multiline: true,
          rows: 2,
          md: 12,
          helperText:
            "Don't worry about grammar or spelling—AI will polish it for you.",
        },
      ],
      awards: [
        { field: "name", label: "Award Name", md: 12 },
        { field: "issuer", label: "Issuing Organization", md: 6 },
        {
          field: "date",
          label: "Date Received",
          isDate: true,
          views: ["year", "month"],
          md: 6,
        },
        {
          field: "description",
          label: "Description",
          multiline: true,
          rows: 2,
          md: 12,
          helperText:
            "Don't worry about grammar or spelling—AI will polish it for you.",
        },
      ],
      volunteer: [
        { field: "organization", label: "Organization", md: 6 },
        { field: "role", label: "Role", md: 6 },
        { field: "location", label: "Location", md: 6, isLocation: true },
        {
          field: "startDate",
          label: "Start Date",
          isDate: true,
          views: ["year", "month"],
          md: 3,
        },
        {
          field: "endDate",
          label: "End Date",
          isDate: true,
          views: ["year", "month"],
          md: 3,
        },
        {
          field: "description",
          label: "Description",
          multiline: true,
          rows: 3,
          md: 12,
          helperText:
            "Don't worry about grammar or spelling—AI will polish it for you.",
        },
      ],
      languages: [
        { field: "language", label: "Language", md: 6 },
        {
          field: "proficiency",
          label: "Proficiency Level",
          placeholder: "Native, Fluent, Conversational, Basic",
          md: 6,
        },
      ],
      memberships: [
        { field: "organization", label: "Organization", md: 12 },
        { field: "role", label: "Role/Membership Type", md: 6 },
        {
          field: "startDate",
          label: "Start Date",
          isDate: true,
          views: ["year", "month"],
          md: 3,
        },
        {
          field: "endDate",
          label: "End Date",
          isDate: true,
          views: ["year", "month"],
          md: 3,
        },
      ],
      licenses: [
        { field: "name", label: "License Name", md: 12 },
        { field: "issuer", label: "Issuing Authority", md: 6 },
        { field: "licenseNumber", label: "License Number", md: 6 },
        {
          field: "date",
          label: "Date Issued",
          isDate: true,
          views: ["year", "month"],
          md: 6,
        },
        {
          field: "expiryDate",
          label: "Expiry Date",
          isDate: true,
          views: ["year", "month"],
          md: 6,
        },
      ],
      references: [
        { field: "name", label: "Name", md: 6 },
        { field: "title", label: "Job Title", md: 6 },
        { field: "company", label: "Company", md: 6 },
        {
          field: "relationship",
          label: "Relationship",
          placeholder: "e.g., Former Manager",
          md: 6,
        },
        { field: "email", label: "Email", md: 6 },
        { field: "phone", label: "Phone", md: 6 },
      ],
    };

    const fields = dialogFields[type] || [];
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {fields.map((f, i) => (
            <Grid item xs={12} md={f.md} key={i}>
              {f.isDate ? (
                <DatePicker
                  label={f.label}
                  views={f.views || ["year", "month", "day"]}
                  value={data[f.field] ? dayjs(data[f.field]) : null}
                  onChange={(newValue) => {
                    // Format based on views
                    let formattedDate = "";
                    if (newValue && newValue.isValid()) {
                      if (f.views?.length === 1 && f.views[0] === "year") {
                        formattedDate = newValue.format("YYYY");
                      } else if (
                        f.views?.includes("month") &&
                        !f.views?.includes("day")
                      ) {
                        formattedDate = newValue.format("MM/YYYY");
                      } else {
                        formattedDate = newValue.format("MM/DD/YYYY");
                      }
                    }
                    updateData(f.field, formattedDate);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "Use calendar or type directly",
                    },
                    actionBar: {
                      actions: ["clear", "today"],
                    },
                  }}
                />
              ) : f.isLocation ? (
                <LocationAutocomplete
                  value={data[f.field] || ""}
                  onChange={(newValue) => updateData(f.field, newValue)}
                  label={f.label}
                  placeholder="City, State or zip code"
                  helperText="Enter city, state or zip code for auto-fill"
                />
              ) : (
                <TextField
                  fullWidth
                  label={f.label}
                  placeholder={f.placeholder}
                  multiline={f.multiline}
                  rows={f.rows}
                  helperText={f.helperText}
                  value={
                    f.isArray
                      ? data[f.field]?.join(", ") || ""
                      : data[f.field] || ""
                  }
                  onChange={(e) =>
                    updateData(
                      f.field,
                      f.isArray
                        ? e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter((t) => t)
                        : e.target.value
                    )
                  }
                />
              )}
            </Grid>
          ))}
        </Grid>
      </LocalizationProvider>
    );
  };

  const getDialogTitle = () => {
    const { type, index } = dialogState;
    const section = ALL_SECTIONS[type];
    return `${index === -1 ? "Add" : "Edit"} ${section?.label || "Item"}`;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <IconButton onClick={() => navigate("/")} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            My Profile
          </Typography>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess("")}
          message={success}
        />

        <Paper sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="Drag tabs to reorder" placement="top">
              <DragIcon sx={{ ml: 1, color: "text.secondary", fontSize: 20 }} />
            </Tooltip>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ flexGrow: 1 }}
            >
              {enabledSections.map((sectionId, index) => {
                const section = ALL_SECTIONS[sectionId];
                if (!section) return null;
                const IconComponent = section.icon;
                const isDragging = draggedTab?.sectionId === sectionId;
                const isDragOver = dragOverTab?.sectionId === sectionId;
                return (
                  <Tab
                    key={sectionId}
                    icon={<IconComponent />}
                    label={section.label}
                    draggable
                    onDragStart={(e) => handleDragStart(e, sectionId, index)}
                    onDragOver={(e) => handleDragOver(e, sectionId, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, sectionId, index)}
                    onDragEnd={handleDragEnd}
                    sx={{
                      cursor: "grab",
                      opacity: isDragging ? 0.5 : 1,
                      borderLeft: isDragOver ? "3px solid" : "none",
                      borderColor: "primary.main",
                      transition: "all 0.2s ease",
                      "&:active": { cursor: "grabbing" },
                    }}
                  />
                );
              })}
            </Tabs>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            {draggedTab &&
            !["contact", "workExperience", "skills", "education"].includes(
              draggedTab.sectionId
            ) ? (
              // Show remove zone when dragging a non-core section
              <Tooltip title="Drop here to remove section">
                <IconButton
                  color="error"
                  sx={{
                    mr: 1,
                    transition: "all 0.2s ease",
                    animation: "pulse 1s infinite",
                    "@keyframes pulse": {
                      "0%": { transform: "scale(1)" },
                      "50%": { transform: "scale(1.1)" },
                      "100%": { transform: "scale(1)" },
                    },
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedTab) {
                      attemptRemoveSection(draggedTab.sectionId);
                    }
                    setDraggedTab(null);
                    setDragOverTab(null);
                  }}
                >
                  <RemoveIcon />
                </IconButton>
              </Tooltip>
            ) : !draggedTab ? (
              // Show add button when not dragging
              <Tooltip title="Add a new section">
                <IconButton
                  color="primary"
                  onClick={(e) => setAddSectionAnchor(e.currentTarget)}
                  sx={{ mr: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
        </Paper>

        <Menu
          anchorEl={addSectionAnchor}
          open={Boolean(addSectionAnchor)}
          onClose={() => setAddSectionAnchor(null)}
          PaperProps={{ sx: { maxHeight: 400, width: 300 } }}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2" color="text.secondary">
              Add a Resume Section
            </Typography>
          </MenuItem>
          <Divider />
          {getAvailableSections().map((section) => {
            const IconComponent = section.icon;
            return (
              <MenuItem
                key={section.id}
                onClick={() => handleAddSection(section.id)}
              >
                <ListItemIcon>
                  <IconComponent fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={section.label}
                  secondary={section.description}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </MenuItem>
            );
          })}
          {getAvailableSections().length === 0 && (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                All sections have been added
              </Typography>
            </MenuItem>
          )}
        </Menu>

        {enabledSections.map((sectionId, index) => (
          <TabPanel key={sectionId} value={activeTab} index={index}>
            {renderSectionContent(sectionId)}
          </TabPanel>
        ))}

        <Dialog
          open={dialogState.open}
          onClose={closeDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogContent>{renderDialogContent()}</DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button variant="contained" onClick={saveDialogItem}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Warning dialog for removing sections with data */}
        <Dialog
          open={removeWarningDialog.open}
          onClose={() =>
            setRemoveWarningDialog({ open: false, sectionId: null })
          }
          maxWidth="sm"
        >
          <DialogTitle sx={{ color: "warning.main" }}>
            ⚠️ Remove Section?
          </DialogTitle>
          <DialogContent>
            <Typography>
              This section contains information you've added. Removing it will
              permanently delete all the data in this section.
            </Typography>
            <Typography sx={{ mt: 2, fontWeight: "medium" }}>
              Are you sure you want to remove this section?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setRemoveWarningDialog({ open: false, sectionId: null })
              }
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmRemoveSection}
            >
              Remove Section
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default UserProfilePage;
