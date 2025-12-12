import React from "react";
import { Box, Typography } from "@mui/material";
import FeatureCard from "./FeatureCard";

// Icons for all features
import BuildIcon from "@mui/icons-material/Build";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import CodeIcon from "@mui/icons-material/Code";
import DescriptionIcon from "@mui/icons-material/Description";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import LanguageIcon from "@mui/icons-material/Language";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GroupsIcon from "@mui/icons-material/Groups";
import InterestsIcon from "@mui/icons-material/Interests";
import LinkIcon from "@mui/icons-material/Link";
import PsychologyIcon from "@mui/icons-material/Psychology";
import FolderIcon from "@mui/icons-material/Folder";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GoogleIcon from "@mui/icons-material/Google";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import AssessmentIcon from "@mui/icons-material/Assessment";
import StarIcon from "@mui/icons-material/Star";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * # CVstomize Feature Cards
 *
 * Visual catalog of all features and user actions in the application.
 * Organized by category for easy navigation and understanding.
 */
export default {
  title: "Features/FeatureCard",
  component: FeatureCard,
  parameters: {
    docs: {
      description: {
        component:
          "A clickable card representing a major feature or action in CVstomize. Props: title, icon, tooltip, color, onClick, disabled.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    color: { control: "color" },
    disabled: { control: "boolean" },
    title: { control: "text" },
    tooltip: { control: "text" },
  },
};

// ============================================
// HOMEPAGE ACTIONS
// ============================================

export const BuildNewResume = {
  args: {
    title: "BUILD NEW RESUME/CV",
    icon: <BuildIcon sx={{ fontSize: 40 }} />,
    tooltip:
      "Start from scratch! CVstomize will guide you through building a professional resume.",
    color: "#9d99e5",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Build New Resume

**Location**: Homepage → First card

**Flow**:
1. Opens \`BuildResumeModal\`
2. User enters job description
3. Selects sections to include
4. Enters personal info
5. AI generates tailored resume

**API**: \`POST /api/resume/build-new\`
**Model**: Gemini 2.0 Flash
        `,
      },
    },
  },
};

export const UploadExistingResume = {
  args: {
    title: "UPLOAD EXISTING RESUME/CV",
    icon: <CloudUploadIcon sx={{ fontSize: 40 }} />,
    tooltip:
      "Upload your resume (PDF, DOC, DOCX) and CVstomize will extract and enhance it.",
    color: "#7c78d8",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Upload Existing Resume

**Location**: Homepage → Second card

**Flow**:
1. Opens \`UploadResumeModal\`
2. User uploads PDF/DOCX/TXT
3. Backend parses resume content
4. User enters target job description
5. AI enhances resume for the job
6. Profile auto-synced with parsed data

**API**:
- Parse: \`POST /api/profile/parse-resume\`
- Enhance: \`POST /api/resume/enhance-uploaded\`
        `,
      },
    },
  },
};

export const GoldStandard = {
  args: {
    title: "GOLD STANDARD",
    icon: <TrackChangesIcon sx={{ fontSize: 40 }} />,
    tooltip:
      "🎯 PREMIUM: Personality-based resume generation with 90%+ job match accuracy.",
    color: "#fdbb2d",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Gold Standard (Premium)

**Location**: Homepage → Third card
**Requires**: At least 1 saved resume

**Flow**:
1. Navigate to \`/gold-standard\`
2. Share career stories
3. Complete BFI-20 personality test
4. AI generates personality-authentic resume

**API**: \`POST /api/gold-standard/start\`, \`/answer\`, \`/complete\`
**Model**: Gemini 2.5 Pro
        `,
      },
    },
  },
};

export const GoldStandardDisabled = {
  args: {
    title: "GOLD STANDARD",
    icon: <TrackChangesIcon sx={{ fontSize: 40 }} />,
    tooltip: "You need at least 1 resume saved before using this option.",
    color: "#fdbb2d",
    disabled: true,
  },
};

// ============================================
// USER PROFILE - CONTACT INFO
// ============================================

export const ContactInfo = {
  args: {
    title: "CONTACT INFO",
    icon: <PersonIcon sx={{ fontSize: 40 }} />,
    tooltip:
      "Name, email, phone, location, LinkedIn - Essential for every resume",
    color: "#4caf50",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Contact Information

**Fields**: Full Name, Email, Phone, Location, LinkedIn URL, Portfolio URL

**API**: \`GET/POST /api/profile\`

**Tips**:
- Use professional email
- City/State is usually sufficient
- Include LinkedIn for networking
        `,
      },
    },
  },
};

// ============================================
// USER PROFILE - PROFESSIONAL SECTIONS
// ============================================

export const ProfessionalSummary = {
  args: {
    title: "PROFESSIONAL SUMMARY",
    icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
    tooltip: "2-4 sentence career pitch capturing your value proposition",
    color: "#9c27b0",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Professional Summary

A 2-4 sentence pitch that captures your value proposition.
Recruiters spend 6-7 seconds on initial scans - make it count.

**Tips**: Lead with experience, include achievements, tailor to job.
        `,
      },
    },
  },
};

export const WorkExperience = {
  args: {
    title: "WORK EXPERIENCE",
    icon: <WorkIcon sx={{ fontSize: 40 }} />,
    tooltip: "Employment history with achievements - The core of most resumes",
    color: "#2196f3",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Work Experience

Career progression, responsibilities, and accomplishments.

**Fields**: Job Title, Company, Location, Dates, Bullet Points

**Tips**: Use action verbs, quantify achievements, focus on recent 10-15 years.
        `,
      },
    },
  },
};

export const Education = {
  args: {
    title: "EDUCATION",
    icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    tooltip: "Degrees, institutions, and academic achievements",
    color: "#ff9800",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Education

Validates foundational knowledge and qualifications.

**Fields**: Degree, Field, Institution, Date, GPA, Coursework, Honors

**Tips**: Include GPA if 3.5+ and recent, add relevant coursework.
        `,
      },
    },
  },
};

export const Skills = {
  args: {
    title: "SKILLS",
    icon: <CodeIcon sx={{ fontSize: 40 }} />,
    tooltip: "Technical and soft skills - Critical for ATS parsing",
    color: "#00bcd4",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Skills

Critical for ATS keyword matching.

**Categories**: Technical, Soft Skills, Industry-Specific
**Data Source**: O*NET database (4,400+ skills)

**Tips**: Mirror job description keywords, organize by category.
        `,
      },
    },
  },
};

export const Projects = {
  args: {
    title: "PROJECTS",
    icon: <FolderIcon sx={{ fontSize: 40 }} />,
    tooltip: "Personal and professional projects showcasing practical skills",
    color: "#e91e63",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Projects

Demonstrates initiative and practical skills.

**Best For**: Tech roles, career changers, recent graduates

**Fields**: Name, Description, Technologies, Links, Dates
        `,
      },
    },
  },
};

export const Certifications = {
  args: {
    title: "CERTIFICATIONS",
    icon: <CardMembershipIcon sx={{ fontSize: 40 }} />,
    tooltip: "Professional certifications validating specialized knowledge",
    color: "#795548",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Certifications

Validates specialized knowledge and commitment.

**Critical For**: IT, Healthcare, Finance, Project Management

**Fields**: Name, Issuer, Date, Expiration, Credential ID
        `,
      },
    },
  },
};

export const Languages = {
  args: {
    title: "LANGUAGES",
    icon: <LanguageIcon sx={{ fontSize: 40 }} />,
    tooltip: "Language proficiencies - Major asset for global companies",
    color: "#3f51b5",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Languages

Major asset in global companies.

**Levels**: Native, Fluent, Conversational, Basic

**Tips**: Be honest, mention certifications (TOEFL, DELE, JLPT).
        `,
      },
    },
  },
};

export const Publications = {
  args: {
    title: "PUBLICATIONS",
    icon: <MenuBookIcon sx={{ fontSize: 40 }} />,
    tooltip:
      "Research papers, articles, or books - Establishes thought leadership",
    color: "#607d8b",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Publications

Establishes thought leadership and expertise.

**Valuable For**: Academia, research, senior industry positions

**Fields**: Title, Authors, Journal, Date, DOI/Link
        `,
      },
    },
  },
};

export const Awards = {
  args: {
    title: "AWARDS & HONORS",
    icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />,
    tooltip:
      "Recognition and achievements - Third-party validation of excellence",
    color: "#ffc107",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Awards & Honors

Third-party validation of your excellence.

**Types**: Employee awards, academic honors, industry recognition, competitions

**Tips**: Include awarding organization, explain significance.
        `,
      },
    },
  },
};

export const VolunteerExperience = {
  args: {
    title: "VOLUNTEER EXPERIENCE",
    icon: <VolunteerActivismIcon sx={{ fontSize: 40 }} />,
    tooltip: "Community service demonstrating character and values",
    color: "#4caf50",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Volunteer Experience

Demonstrates character, values, and well-roundedness.

**Benefits**: Fills gaps, showcases leadership, shows community involvement

**Tips**: Treat like work experience with accomplishments.
        `,
      },
    },
  },
};

export const ProfessionalMemberships = {
  args: {
    title: "PROFESSIONAL MEMBERSHIPS",
    icon: <GroupsIcon sx={{ fontSize: 40 }} />,
    tooltip: "Industry associations showing active professional engagement",
    color: "#9e9e9e",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Professional Memberships

Shows active engagement with your profession.

**Examples**: IEEE, ACM, AMA, SHRM

**Tips**: Include leadership roles, mention presentations.
        `,
      },
    },
  },
};

export const Interests = {
  args: {
    title: "INTERESTS & HOBBIES",
    icon: <InterestsIcon sx={{ fontSize: 40 }} />,
    tooltip: "Personal interests that humanize your resume",
    color: "#ff5722",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Interests & Hobbies

Humanizes your resume and sparks interview conversation.

**Tips**: Keep brief (3-5), avoid controversial topics, choose wisely.
        `,
      },
    },
  },
};

export const References = {
  args: {
    title: "REFERENCES",
    icon: <LinkIcon sx={{ fontSize: 40 }} />,
    tooltip: "Professional references who can vouch for your qualifications",
    color: "#673ab7",
  },
  parameters: {
    docs: {
      description: {
        story: `
## References

Strong references can seal the deal.

**Best Practice**: Have ready but don't include unless requested.

**Tips**: Ask permission, brief on role, mix supervisors and colleagues.
        `,
      },
    },
  },
};

// ============================================
// RESUME ACTIONS
// ============================================

export const ViewResumes = {
  args: {
    title: "VIEW RESUMES",
    icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
    tooltip: "See all your saved resumes and their statuses",
    color: "#9c27b0",
  },
  parameters: {
    docs: {
      description: {
        story: `
## View Resumes

**Location**: Navigation → Resumes

**Features**: List all resumes, see dates, view target jobs

**API**: \`GET /api/resume/list\`
        `,
      },
    },
  },
};

export const DownloadPDF = {
  args: {
    title: "DOWNLOAD PDF",
    icon: <PictureAsPdfIcon sx={{ fontSize: 40 }} />,
    tooltip: "Download your resume as a formatted PDF",
    color: "#f44336",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Download PDF

**Templates**: Classic, Modern, Minimal

**API**: \`GET /api/resume/:id/pdf?template=classic|modern|minimal\`
        `,
      },
    },
  },
};

export const ATSAnalysis = {
  args: {
    title: "ATS ANALYSIS",
    icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
    tooltip: "Check how well your resume matches the job posting",
    color: "#00bcd4",
  },
  parameters: {
    docs: {
      description: {
        story: `
## ATS Analysis

Analyze how well your resume matches job requirements.

**Provides**: Match score, missing keywords, suggestions

**API**: \`GET /api/resume/:id/ats-analysis\`
        `,
      },
    },
  },
};

export const AIEnhancement = {
  args: {
    title: "AI ENHANCEMENT",
    icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
    tooltip: "Let AI improve and optimize your resume content",
    color: "#e91e63",
  },
  parameters: {
    docs: {
      description: {
        story: `
## AI Enhancement

Improve existing resume content with AI.

**Capabilities**: Stronger verbs, better quantification, ATS optimization
        `,
      },
    },
  },
};

export const DeleteResume = {
  args: {
    title: "DELETE RESUME",
    icon: <DeleteIcon sx={{ fontSize: 40 }} />,
    tooltip: "Permanently delete a saved resume",
    color: "#f44336",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Delete Resume

**Warning**: This action cannot be undone.

**API**: \`DELETE /api/resume/:id\`
        `,
      },
    },
  },
};

// ============================================
// AUTHENTICATION
// ============================================

export const EmailLogin = {
  args: {
    title: "EMAIL LOGIN",
    icon: <LoginIcon sx={{ fontSize: 40 }} />,
    tooltip: "Sign in with email and password",
    color: "#2196f3",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Email Login

**Location**: /login

**Flow**: Enter credentials → Firebase validates → Redirect home

**API**: \`POST /api/auth/login\`
        `,
      },
    },
  },
};

export const GoogleLogin = {
  args: {
    title: "GOOGLE LOGIN",
    icon: <GoogleIcon sx={{ fontSize: 40 }} />,
    tooltip: "Sign in with your Google account",
    color: "#4285f4",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Google OAuth Login

**Flow**: Click button → Google popup → Firebase exchanges token → Logged in

**Benefits**: No password, faster signup, auto-verified email
        `,
      },
    },
  },
};

export const CreateAccount = {
  args: {
    title: "CREATE ACCOUNT",
    icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
    tooltip: "Register a new account with email and password",
    color: "#4caf50",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Create Account

**Location**: /signup

**Fields**: Full Name, Email, Password, Confirm Password

**API**: \`POST /api/auth/register\`
        `,
      },
    },
  },
};

// ============================================
// GOLD STANDARD FEATURES
// ============================================

export const CareerStories = {
  args: {
    title: "CAREER STORIES",
    icon: <QuestionAnswerIcon sx={{ fontSize: 40 }} />,
    tooltip: "Share experiences for personality-authentic content",
    color: "#ff9800",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Career Stories (Gold Standard)

Gather authentic experiences for resume content.

**Story Types**:
- 🎯 Proudest Achievement
- 🌊 Overcoming Adversity
- 👥 Team Collaboration
- 💡 Innovation
- 🤝 Helping Others
- 📚 Self-Learning

**Min Words**: 50 per story
        `,
      },
    },
  },
};

export const PersonalityAssessment = {
  args: {
    title: "PERSONALITY ASSESSMENT",
    icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
    tooltip: "BFI-20 personality test for authentic resume generation",
    color: "#9c27b0",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Personality Assessment

Create personality-authentic resumes.

**Test**: BFI-20 (Big Five Inventory - 20 items)

**Measures**: Openness, Conscientiousness, Extraversion, Agreeableness, Stability
        `,
      },
    },
  },
};

export const JobAnalysis = {
  args: {
    title: "JOB ANALYSIS",
    icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
    tooltip: "Deep analysis of job requirements for perfect matching",
    color: "#2196f3",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Job Analysis (Gold Standard)

Deep analysis of job requirements.

**Analyzes**: Required skills, experience, cultural fit, keywords
        `,
      },
    },
  },
};

export const PremiumGenerate = {
  args: {
    title: "GENERATE PREMIUM",
    icon: <StarIcon sx={{ fontSize: 40 }} />,
    tooltip: "Create personality-authentic premium resume",
    color: "#fdbb2d",
  },
  parameters: {
    docs: {
      description: {
        story: `
## Premium Resume Generation

Uses personality + stories + job analysis for 90%+ match accuracy.

**Model**: Gemini 2.5 Pro (premium)
        `,
      },
    },
  },
};

// ============================================
// FEATURE BANK - VISUAL CATALOG
// ============================================

const SectionHeader = ({ emoji, title }) => (
  <Typography variant="h6" sx={{ color: "#9d99e5", mb: 2, mt: 4 }}>
    {emoji} {title}
  </Typography>
);

const CardGrid = ({ children }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
    {children}
  </Box>
);

export const FeatureBank = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h4" gutterBottom sx={{ color: "#7e78d2", mb: 1 }}>
      📦 CVstomize Feature Bank
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Complete visual catalog of all features and actions
    </Typography>

    {/* Homepage Actions */}
    <SectionHeader emoji="🏠" title="Homepage Actions" />
    <CardGrid>
      <FeatureCard
        title="BUILD NEW"
        icon={<BuildIcon sx={{ fontSize: 40 }} />}
        tooltip="Create from scratch"
        color="#9d99e5"
        onClick={() => {}}
      />
      <FeatureCard
        title="UPLOAD EXISTING"
        icon={<CloudUploadIcon sx={{ fontSize: 40 }} />}
        tooltip="Parse and enhance"
        color="#7c78d8"
        onClick={() => {}}
      />
      <FeatureCard
        title="GOLD STANDARD"
        icon={<TrackChangesIcon sx={{ fontSize: 40 }} />}
        tooltip="Personality-based"
        color="#fdbb2d"
        onClick={() => {}}
      />
    </CardGrid>

    {/* Profile - Essential */}
    <SectionHeader emoji="👤" title="Profile - Essential" />
    <CardGrid>
      <FeatureCard
        title="CONTACT"
        icon={<PersonIcon sx={{ fontSize: 40 }} />}
        tooltip="Name, email, phone"
        color="#4caf50"
        onClick={() => {}}
      />
      <FeatureCard
        title="SUMMARY"
        icon={<PsychologyIcon sx={{ fontSize: 40 }} />}
        tooltip="Career pitch"
        color="#9c27b0"
        onClick={() => {}}
      />
      <FeatureCard
        title="EXPERIENCE"
        icon={<WorkIcon sx={{ fontSize: 40 }} />}
        tooltip="Work history"
        color="#2196f3"
        onClick={() => {}}
      />
      <FeatureCard
        title="EDUCATION"
        icon={<SchoolIcon sx={{ fontSize: 40 }} />}
        tooltip="Degrees"
        color="#ff9800"
        onClick={() => {}}
      />
      <FeatureCard
        title="SKILLS"
        icon={<CodeIcon sx={{ fontSize: 40 }} />}
        tooltip="Technical & soft"
        color="#00bcd4"
        onClick={() => {}}
      />
    </CardGrid>

    {/* Profile - Additional */}
    <SectionHeader emoji="📋" title="Profile - Additional" />
    <CardGrid>
      <FeatureCard
        title="PROJECTS"
        icon={<FolderIcon sx={{ fontSize: 40 }} />}
        tooltip="Portfolio"
        color="#e91e63"
        onClick={() => {}}
      />
      <FeatureCard
        title="CERTS"
        icon={<CardMembershipIcon sx={{ fontSize: 40 }} />}
        tooltip="Credentials"
        color="#795548"
        onClick={() => {}}
      />
      <FeatureCard
        title="LANGUAGES"
        icon={<LanguageIcon sx={{ fontSize: 40 }} />}
        tooltip="Proficiencies"
        color="#3f51b5"
        onClick={() => {}}
      />
      <FeatureCard
        title="PUBLICATIONS"
        icon={<MenuBookIcon sx={{ fontSize: 40 }} />}
        tooltip="Papers"
        color="#607d8b"
        onClick={() => {}}
      />
      <FeatureCard
        title="AWARDS"
        icon={<EmojiEventsIcon sx={{ fontSize: 40 }} />}
        tooltip="Honors"
        color="#ffc107"
        onClick={() => {}}
      />
      <FeatureCard
        title="VOLUNTEER"
        icon={<VolunteerActivismIcon sx={{ fontSize: 40 }} />}
        tooltip="Service"
        color="#4caf50"
        onClick={() => {}}
      />
      <FeatureCard
        title="MEMBERSHIPS"
        icon={<GroupsIcon sx={{ fontSize: 40 }} />}
        tooltip="Associations"
        color="#9e9e9e"
        onClick={() => {}}
      />
      <FeatureCard
        title="INTERESTS"
        icon={<InterestsIcon sx={{ fontSize: 40 }} />}
        tooltip="Hobbies"
        color="#ff5722"
        onClick={() => {}}
      />
      <FeatureCard
        title="REFERENCES"
        icon={<LinkIcon sx={{ fontSize: 40 }} />}
        tooltip="Contacts"
        color="#673ab7"
        onClick={() => {}}
      />
    </CardGrid>

    {/* Resume Actions */}
    <SectionHeader emoji="📄" title="Resume Actions" />
    <CardGrid>
      <FeatureCard
        title="VIEW ALL"
        icon={<DescriptionIcon sx={{ fontSize: 40 }} />}
        tooltip="List resumes"
        color="#9c27b0"
        onClick={() => {}}
      />
      <FeatureCard
        title="DOWNLOAD"
        icon={<PictureAsPdfIcon sx={{ fontSize: 40 }} />}
        tooltip="Export PDF"
        color="#f44336"
        onClick={() => {}}
      />
      <FeatureCard
        title="ATS CHECK"
        icon={<AnalyticsIcon sx={{ fontSize: 40 }} />}
        tooltip="Match score"
        color="#00bcd4"
        onClick={() => {}}
      />
      <FeatureCard
        title="ENHANCE"
        icon={<AutoAwesomeIcon sx={{ fontSize: 40 }} />}
        tooltip="AI improve"
        color="#e91e63"
        onClick={() => {}}
      />
      <FeatureCard
        title="DELETE"
        icon={<DeleteIcon sx={{ fontSize: 40 }} />}
        tooltip="Remove"
        color="#f44336"
        onClick={() => {}}
      />
    </CardGrid>

    {/* Authentication */}
    <SectionHeader emoji="🔐" title="Authentication" />
    <CardGrid>
      <FeatureCard
        title="EMAIL LOGIN"
        icon={<LoginIcon sx={{ fontSize: 40 }} />}
        tooltip="Email/password"
        color="#2196f3"
        onClick={() => {}}
      />
      <FeatureCard
        title="GOOGLE"
        icon={<GoogleIcon sx={{ fontSize: 40 }} />}
        tooltip="OAuth login"
        color="#4285f4"
        onClick={() => {}}
      />
      <FeatureCard
        title="SIGN UP"
        icon={<PersonAddIcon sx={{ fontSize: 40 }} />}
        tooltip="New account"
        color="#4caf50"
        onClick={() => {}}
      />
    </CardGrid>

    {/* Gold Standard */}
    <SectionHeader emoji="⭐" title="Gold Standard (Premium)" />
    <CardGrid>
      <FeatureCard
        title="STORIES"
        icon={<QuestionAnswerIcon sx={{ fontSize: 40 }} />}
        tooltip="Experiences"
        color="#ff9800"
        onClick={() => {}}
      />
      <FeatureCard
        title="PERSONALITY"
        icon={<PsychologyIcon sx={{ fontSize: 40 }} />}
        tooltip="BFI-20 test"
        color="#9c27b0"
        onClick={() => {}}
      />
      <FeatureCard
        title="JOB ANALYSIS"
        icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
        tooltip="Deep matching"
        color="#2196f3"
        onClick={() => {}}
      />
      <FeatureCard
        title="GENERATE"
        icon={<StarIcon sx={{ fontSize: 40 }} />}
        tooltip="Premium resume"
        color="#fdbb2d"
        onClick={() => {}}
      />
    </CardGrid>
  </Box>
);

FeatureBank.parameters = {
  docs: {
    description: {
      story: `
## Complete Feature Bank

Visual catalog of ALL features in CVstomize:

- **🏠 Homepage Actions** - Main entry points
- **👤 Profile - Essential** - Core sections
- **📋 Profile - Additional** - Optional sections
- **📄 Resume Actions** - Resume operations
- **🔐 Authentication** - Login/signup
- **⭐ Gold Standard** - Premium features
      `,
    },
  },
};
