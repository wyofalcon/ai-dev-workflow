import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Fade,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Close as CloseIcon,
  Send as SendIcon,
  AutoAwesome as AiIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

// Configuration for the 12-step flow
const FLOW_STEPS = [
  {
    id: "intro",
    type: "message",
    content: "Hi! I'm your CVstomize assistant. 🤖 I'm going to ask you a series of questions to build your perfect resume.",
    next: "intro_2"
  },
  {
    id: "intro_2",
    type: "message",
    content: "We'll go through 12 sections, from Contact Info to Formatting. I'll ask one thing at a time so it's not overwhelming.",
    next: "intro_3"
  },
  {
    id: "intro_3",
    type: "message",
    content: "Remember: You can stop at any time! If you create an account, I'll save your progress so you can finish later. Ready to start?",
    next: "contact_intro",
    options: [{ label: "Let's Go!", value: "start" }]
  },
  
  // 🧩 1. Contact & Identity
  {
    id: "contact_intro",
    type: "info",
    title: "🧩 Section 1: Contact & Identity",
    content: "First, let's get your basic contact details so employers can reach you. This helps us generate the header of your resume.",
    next: "name"
  },
  {
    id: "name",
    type: "question",
    content: "What is your full name as you want it displayed?",
    field: "fullName",
    placeholder: "e.g. Jane Doe",
    next: "location"
  },
  {
    id: "location",
    type: "question",
    content: "What city and state do you want listed?",
    field: "location",
    placeholder: "e.g. San Francisco, CA",
    next: "phone"
  },
  {
    id: "phone",
    type: "question",
    content: "What phone number should appear?",
    field: "phone",
    placeholder: "e.g. (555) 123-4567",
    next: "email"
  },
  {
    id: "email",
    type: "question",
    content: "What email address should appear?",
    field: "email",
    placeholder: "e.g. jane@example.com",
    next: "linkedin_check"
  },
  {
    id: "linkedin_check",
    type: "question",
    content: "Do you want to include a LinkedIn profile?",
    options: [
      { label: "Yes", value: "yes", next: "linkedin_url" },
      { label: "No", value: "no", next: "portfolio_check" }
    ]
  },
  {
    id: "linkedin_url",
    type: "question",
    content: "Great! Paste your LinkedIn URL here:",
    field: "linkedin",
    placeholder: "linkedin.com/in/...",
    next: "portfolio_check"
  },
  {
    id: "portfolio_check",
    type: "question",
    content: "Do you want to include a portfolio, GitHub, or personal website?",
    options: [
      { label: "Yes", value: "yes", next: "portfolio_url" },
      { label: "No", value: "no", next: "career_intro" }
    ]
  },
  {
    id: "portfolio_url",
    type: "question",
    content: "Please paste the link(s) here:",
    field: "website",
    placeholder: "github.com/jane or janedoe.com",
    next: "career_intro"
  },

  // 🎯 2. Career Target
  {
    id: "career_intro",
    type: "info",
    title: "🎯 Section 2: Career Target",
    content: "Now, let's focus on what you're looking for. This helps us tailor the tone and summary of your resume.",
    next: "target_job"
  },
  {
    id: "target_job",
    type: "question",
    content: "What job title are you targeting?",
    field: "targetJobTitle",
    placeholder: "e.g. Senior Software Engineer",
    next: "headline_check"
  },
  {
    id: "headline_check",
    type: "question",
    content: "Do you want a one-sentence headline under your name?",
    options: [
      { label: "Yes", value: "yes", next: "headline_text" },
      { label: "No", value: "no", next: "summary_check" }
    ]
  },
  {
    id: "headline_text",
    type: "question",
    content: "What should the headline say?",
    field: "headline",
    placeholder: "e.g. Innovative Developer with 5+ years experience",
    next: "summary_check"
  },
  {
    id: "summary_check",
    type: "question",
    content: "Do you want a summary or objective statement?",
    options: [
      { label: "Yes", value: "yes", next: "summary_tone" },
      { label: "No", value: "no", next: "skills_intro" }
    ]
  },
  {
    id: "summary_tone",
    type: "question",
    content: "What tone should it have?",
    options: [
      { label: "Technical", value: "technical", next: "skills_intro" },
      { label: "Leadership", value: "leadership", next: "skills_intro" },
      { label: "Hybrid", value: "hybrid", next: "skills_intro" },
      { label: "Concise", value: "concise", next: "skills_intro" },
      { label: "Narrative", value: "narrative", next: "skills_intro" }
    ],
    field: "summaryTone"
  },

  // 🛠️ 3. Skills & Competencies
  {
    id: "skills_intro",
    type: "info",
    title: "🛠️ Section 3: Skills & Competencies",
    content: "Let's list your skills. We'll break this down into Technical, Soft Skills, and Domain Expertise.",
    next: "tech_skills_lang"
  },
  {
    id: "tech_skills_lang",
    type: "question",
    content: "What programming languages do you know?",
    field: "languages",
    placeholder: "e.g. JavaScript, Python, C++",
    next: "tech_skills_tools"
  },
  {
    id: "tech_skills_tools",
    type: "question",
    content: "What tools, frameworks, or libraries do you use?",
    field: "tools",
    placeholder: "e.g. React, Node.js, Docker",
    next: "tech_skills_hw"
  },
  {
    id: "tech_skills_hw",
    type: "question",
    content: "What hardware, diagnostic, or engineering tools are you proficient with?",
    field: "hardware",
    placeholder: "e.g. Oscilloscopes, CAD, Raspberry Pi",
    next: "tech_skills_cloud"
  },
  {
    id: "tech_skills_cloud",
    type: "question",
    content: "What cloud, DevOps, or automation tools do you use?",
    field: "cloudTools",
    placeholder: "e.g. AWS, Terraform, Jenkins",
    next: "tech_skills_os"
  },
  {
    id: "tech_skills_os",
    type: "question",
    content: "What operating systems do you work with?",
    field: "os",
    placeholder: "e.g. Linux, macOS, Windows",
    next: "soft_skills_highlight"
  },
  {
    id: "soft_skills_highlight",
    type: "question",
    content: "What interpersonal or leadership skills do you want highlighted?",
    field: "softSkills",
    placeholder: "e.g. Mentoring, Project Management",
    next: "soft_skills_analytical"
  },
  {
    id: "soft_skills_analytical",
    type: "question",
    content: "What problem-solving or analytical strengths define you?",
    field: "analyticalSkills",
    placeholder: "e.g. Data Analysis, Critical Thinking",
    next: "domain_expertise"
  },
  {
    id: "domain_expertise",
    type: "question",
    content: "What industries or domains do you have experience in?",
    field: "industries",
    placeholder: "e.g. Fintech, Healthcare, E-commerce",
    next: "certs_check"
  },
  {
    id: "certs_check",
    type: "question",
    content: "Any specialized certifications or training?",
    field: "initialCerts",
    placeholder: "e.g. AWS Certified, PMP",
    next: "work_intro"
  },

  // 🧱 4. Work Experience
  {
    id: "work_intro",
    type: "info",
    title: "🧱 Section 4: Work Experience",
    content: "Now for the core of your resume. We'll add your job history one by one.",
    next: "work_company"
  },
  {
    id: "work_company",
    type: "question",
    content: "What is the company name?",
    field: "temp_company",
    placeholder: "e.g. TechCorp Inc.",
    next: "work_location"
  },
  {
    id: "work_location",
    type: "question",
    content: "What city and state is it located in?",
    field: "temp_work_location",
    placeholder: "e.g. Austin, TX",
    next: "work_title"
  },
  {
    id: "work_title",
    type: "question",
    content: "What was your job title?",
    field: "temp_work_title",
    placeholder: "e.g. Software Engineer",
    next: "work_dates"
  },
  {
    id: "work_dates",
    type: "question",
    content: "What were your start and end dates?",
    field: "temp_work_dates",
    placeholder: "e.g. Jan 2020 - Present",
    next: "work_responsibilities"
  },
  {
    id: "work_responsibilities",
    type: "question",
    content: "What were your primary responsibilities?",
    field: "temp_work_desc",
    placeholder: "e.g. Developed API endpoints...",
    next: "work_achievements"
  },
  {
    id: "work_achievements",
    type: "question",
    content: "What major accomplishments did you achieve? (Any quantifiable results like percentages or time saved?)",
    field: "temp_work_achievements",
    placeholder: "e.g. Increased throughput by 20%",
    next: "work_another"
  },
  {
    id: "work_another",
    type: "question",
    content: "Do you want to add another job?",
    options: [
      { label: "Yes", value: "yes", next: "work_company" },
      { label: "No", value: "no", next: "projects_intro" }
    ]
  },

  // 🧪 5. Projects
  {
    id: "projects_intro",
    type: "info",
    title: "🧪 Section 5: Projects",
    content: "Have you worked on any notable projects, professional or personal?",
    next: "project_check"
  },
  {
    id: "project_check",
    type: "question",
    content: "Would you like to add a project?",
    options: [
      { label: "Yes", value: "yes", next: "project_name" },
      { label: "No", value: "no", next: "edu_intro" }
    ]
  },
  {
    id: "project_name",
    type: "question",
    content: "What is the project name?",
    field: "temp_proj_name",
    placeholder: "e.g. Open Source Contributor",
    next: "project_problem"
  },
  {
    id: "project_problem",
    type: "question",
    content: "What problem did it solve?",
    field: "temp_proj_desc",
    placeholder: "e.g. Automated my home security...",
    next: "project_tools"
  },
  {
    id: "project_tools",
    type: "question",
    content: "What tools, languages, or hardware did you use?",
    field: "temp_proj_tools",
    placeholder: "e.g. Python, Raspberry Pi",
    next: "project_outcome"
  },
  {
    id: "project_outcome",
    type: "question",
    content: "What was the outcome or measurable impact?",
    field: "temp_proj_impact",
    placeholder: "e.g. Reduced false alarms by 50%",
    next: "project_another"
  },
  {
    id: "project_another",
    type: "question",
    content: "Add another project?",
    options: [
      { label: "Yes", value: "yes", next: "project_name" },
      { label: "No", value: "no", next: "edu_intro" }
    ]
  },

  // 🎓 6. Education
  {
    id: "edu_intro",
    type: "info",
    title: "🎓 Section 6: Education",
    content: "Let's record your academic background.",
    next: "edu_school"
  },
  {
    id: "edu_school",
    type: "question",
    content: "What school did you attend?",
    field: "temp_edu_school",
    placeholder: "e.g. Stanford University",
    next: "edu_degree"
  },
  {
    id: "edu_degree",
    type: "question",
    content: "What degree did you earn?",
    field: "temp_edu_degree",
    placeholder: "e.g. B.S. in Computer Science",
    next: "edu_dates"
  },
  {
    id: "edu_dates",
    type: "question",
    content: "What were your start and end dates?",
    field: "temp_edu_dates",
    placeholder: "e.g. 2016 - 2020",
    next: "edu_another"
  },
  {
    id: "edu_another",
    type: "question",
    content: "Add another education entry?",
    options: [
      { label: "Yes", value: "yes", next: "edu_school" },
      { label: "No", value: "no", next: "awards_intro" }
    ]
  },

  // 🏆 8. Awards & Achievements
  {
    id: "awards_intro",
    type: "info",
    title: "🏆 Section 7: Awards & Achievements",
    content: "Time to brag a little. Any professional or academic recognition?",
    next: "awards_check"
  },
  {
    id: "awards_check",
    type: "question",
    content: "Do you have awards to list?",
    options: [
      { label: "Yes", value: "yes", next: "awards_text" },
      { label: "No", value: "no", next: "volunteer_intro" }
    ]
  },
  {
    id: "awards_text",
    type: "question",
    content: "List your awards or recognition:",
    field: "awards",
    placeholder: "e.g. Employee of the Month, Dean's List",
    next: "volunteer_intro"
  },

  // 🌐 10. Volunteer Work
  {
    id: "volunteer_intro",
    type: "info",
    title: "🌐 Section 8: Volunteer Work",
    content: "Volunteering shows character and extra skills.",
    next: "volunteer_check"
  },
  {
    id: "volunteer_check",
    type: "question",
    content: "Would you like to include volunteer work?",
    options: [
      { label: "Yes", value: "yes", next: "volunteer_text" },
      { label: "No", value: "no", next: "additional_intro" }
    ]
  },
  {
    id: "volunteer_text",
    type: "question",
    content: "Describe your volunteer role and impact:",
    field: "volunteer",
    placeholder: "e.g. Taught coding at local library...",
    next: "additional_intro"
  },

  // 🧩 11. Additional Sections
  {
    id: "additional_intro",
    type: "info",
    title: "🧩 Section 9: Additional Information",
    content: "Languages, hobbies, or other details that make you unique.",
    next: "extra_langs"
  },
  {
    id: "extra_langs",
    type: "question",
    content: "Do you speak any additional languages?",
    field: "additionalLanguages",
    placeholder: "e.g. Spanish (Fluent), Japanese (Basic)",
    next: "extra_hobbies"
  },
  {
    id: "extra_hobbies",
    type: "question",
    content: "Do you want to list hobbies or interests?",
    field: "hobbies",
    placeholder: "e.g. Mountain Biking, Chess",
    next: "format_intro"
  },

  // 🧭 12. Formatting Preferences
  {
    id: "format_intro",
    type: "info",
    title: "🧭 Section 10: Formatting",
    content: "Almost done! How should the final resume look?",
    next: "format_layout"
  },
  {
    id: "format_layout",
    type: "question",
    content: "What style do you prefer?",
    options: [
      { label: "Modern", value: "modern", next: "format_pages" },
      { label: "Minimalist", value: "minimal", next: "format_pages" },
      { label: "Traditional", value: "traditional", next: "format_pages" }
    ],
    field: "layoutStyle"
  },
  {
    id: "format_pages",
    type: "question",
    content: "Target page count?",
    options: [
      { label: "One Page", value: "1", next: "finish_msg" },
      { label: "Two Pages", value: "2", next: "finish_msg" }
    ],
    field: "pageCount"
  },

  {
    id: "finish_msg",
    type: "message",
    content: "Success! I have everything I need to build your resume. 🎉",
    next: "cta"
  },
  {
    id: "cta",
    type: "final",
    content: "I'll generate your PDF now. To save this data to your One Profile and unlock the Browser Extension, please create your account.",
  }
];

// Live Resume Preview Component
const LiveResumePreview = ({ answers }) => {
  return (
    <Paper
      elevation={4}
      sx={{
        height: "100%",
        maxHeight: "80vh",
        overflowY: "auto",
        p: 4,
        bgcolor: "#fff",
        color: "#333",
        borderRadius: 2,
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'center' }}>
        Live Preview
      </Typography>

      {/* Header */}
      <Box sx={{ mb: 3, textAlign: "center", borderBottom: "2px solid #333", pb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", textTransform: "uppercase" }}>
          {answers.fullName || "Your Name"}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {[answers.location, answers.phone, answers.email, answers.website]
            .filter(Boolean)
            .join(" | ")}
        </Typography>
        {answers.linkedin && (
          <Typography variant="body2" color="primary">
            {answers.linkedin}
          </Typography>
        )}
      </Box>

      {/* Career Target */}
      {(answers.targetJobTitle || answers.headline) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1 }}>
            Career Target
          </Typography>
          {answers.targetJobTitle && (
            <Typography variant="subtitle1" fontWeight="bold">
              Target: {answers.targetJobTitle}
            </Typography>
          )}
          {answers.headline && (
            <Typography variant="body1" fontStyle="italic">
              "{answers.headline}"
            </Typography>
          )}
        </Box>
      )}

      {/* Skills */}
      {(answers.languages || answers.tools || answers.softSkills) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1 }}>
            Skills
          </Typography>
          <Typography variant="body2">
            {[answers.languages, answers.tools, answers.cloudTools, answers.softSkills]
              .filter(Boolean)
              .join(", ")}
          </Typography>
        </Box>
      )}

      {/* Work Experience */}
      {(answers.workHistory?.length > 0 || answers.temp_company) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1 }}>
            Experience
          </Typography>
          {/* Confirmed Jobs */}
          {answers.workHistory?.map((job, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {job.title} at {job.company}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {job.dates} | {job.location}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {job.desc}
              </Typography>
            </Box>
          ))}
          {/* Current Editing Job */}
          {answers.temp_company && (
            <Box sx={{ mb: 2, opacity: 0.7, borderLeft: "2px dashed #ccc", pl: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {answers.temp_work_title || "Job Title"} at {answers.temp_company}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {answers.temp_work_dates || "Dates"}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Projects */}
      {(answers.projects?.length > 0 || answers.temp_proj_name) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1 }}>
            Projects
          </Typography>
          {answers.projects?.map((proj, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {proj.name}
              </Typography>
              <Typography variant="body2">{proj.desc}</Typography>
            </Box>
          ))}
          {answers.temp_proj_name && (
            <Box sx={{ mb: 2, opacity: 0.7, borderLeft: "2px dashed #ccc", pl: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {answers.temp_proj_name}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Education */}
      {(answers.education?.length > 0 || answers.temp_edu_school) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2196f3", mb: 1 }}>
            Education
          </Typography>
          {answers.education?.map((edu, i) => (
            <Box key={i} sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {edu.school}
              </Typography>
              <Typography variant="body2">
                {edu.degree} ({edu.dates})
              </Typography>
            </Box>
          ))}
          {answers.temp_edu_school && (
            <Box sx={{ mb: 1, opacity: 0.7, borderLeft: "2px dashed #ccc", pl: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {answers.temp_edu_school}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

function EasyCvWizard() {
  const navigate = useNavigate();
  const [currentStepId, setCurrentStepId] = useState("intro");
  const [history, setHistory] = useState([]); 
  const [answers, setAnswers] = useState({ workHistory: [], projects: [], education: [] });
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const messagesEndRef = useRef(null);

  const currentStep = FLOW_STEPS.find(s => s.id === currentStepId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isTyping]);

  useEffect(() => {
    if (!currentStep) return;

    setIsTyping(true);
    const delay = currentStep.type === "message" ? 1000 : 600;

    const timer = setTimeout(() => {
      setIsTyping(false);
      
      const messageContent = currentStep.content;
      setHistory(prev => [...prev, { 
        role: "bot", 
        content: messageContent,
        type: currentStep.type,
        title: currentStep.title 
      }]);

      if (currentStep.type === "message" || currentStep.type === "info") {
         if (currentStep.next && !currentStep.options) {
             setTimeout(() => setCurrentStepId(currentStep.next), 1500);
         }
      }

    }, delay);

    return () => clearTimeout(timer);
  }, [currentStepId]);

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (currentStep.field) {
      setAnswers(prev => ({ ...prev, [currentStep.field]: inputValue }));
    }

    setHistory(prev => [...prev, { role: "user", content: inputValue }]);
    setInputValue("");

    if (currentStep.next) {
      setCurrentStepId(currentStep.next);
    }
  };

  const handleOptionClick = (option) => {
    // 1. Save specific field answer if present
    if (currentStep.field) {
       setAnswers(prev => ({ ...prev, [currentStep.field]: option.value }));
    }

    // 2. Logic to "Commit" repeating sections when user says "Yes" to adding another
    //    OR finishes the section loop.
    if (option.value === "yes" && (currentStep.id === "work_another" || currentStep.id === "project_another" || currentStep.id === "edu_another")) {
        setAnswers(prev => {
            const newEntry = {};
            // Work Loop
            if (currentStep.id === "work_another") {
                newEntry.company = prev.temp_company;
                newEntry.location = prev.temp_work_location;
                newEntry.title = prev.temp_work_title;
                newEntry.dates = prev.temp_work_dates;
                newEntry.desc = prev.temp_work_desc;
                return { 
                    ...prev, 
                    workHistory: [...prev.workHistory, newEntry],
                    // Clear temps
                    temp_company: "", temp_work_location: "", temp_work_title: "", temp_work_dates: "", temp_work_desc: "", temp_work_achievements: ""
                };
            }
            // Project Loop
            if (currentStep.id === "project_another") {
                newEntry.name = prev.temp_proj_name;
                newEntry.desc = prev.temp_proj_desc;
                return {
                    ...prev,
                    projects: [...prev.projects, newEntry],
                    temp_proj_name: "", temp_proj_desc: "", temp_proj_tools: "", temp_proj_impact: ""
                };
            }
            // Education Loop
            if (currentStep.id === "edu_another") {
                newEntry.school = prev.temp_edu_school;
                newEntry.degree = prev.temp_edu_degree;
                newEntry.dates = prev.temp_edu_dates;
                return {
                    ...prev,
                    education: [...prev.education, newEntry],
                    temp_edu_school: "", temp_edu_degree: "", temp_edu_dates: ""
                };
            }
            return prev;
        });
    }
    
    // Also commit if they say "No" (finish the section) - save the LAST entry
    if (option.value === "no" && (currentStep.id === "work_another" || currentStep.id === "project_another" || currentStep.id === "edu_another")) {
         setAnswers(prev => {
            const newEntry = {};
            if (currentStep.id === "work_another" && prev.temp_company) {
                newEntry.company = prev.temp_company;
                newEntry.title = prev.temp_work_title;
                newEntry.dates = prev.temp_work_dates;
                newEntry.desc = prev.temp_work_desc;
                return { ...prev, workHistory: [...prev.workHistory, newEntry] };
            }
            if (currentStep.id === "project_another" && prev.temp_proj_name) {
                newEntry.name = prev.temp_proj_name;
                newEntry.desc = prev.temp_proj_desc;
                return { ...prev, projects: [...prev.projects, newEntry] };
            }
            if (currentStep.id === "edu_another" && prev.temp_edu_school) {
                newEntry.school = prev.temp_edu_school;
                newEntry.degree = prev.temp_edu_degree;
                newEntry.dates = prev.temp_edu_dates;
                return { ...prev, education: [...prev.education, newEntry] };
            }
            return prev;
         });
    }

    setHistory(prev => [...prev, { role: "user", content: option.label }]);

    const nextStep = option.next || currentStep.next;
    if (nextStep) {
      setCurrentStepId(nextStep);
    }
  };

  const handleSaveAndExit = () => {
      navigate("/signup", { state: { savedAnswers: answers } });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#121212",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Top Bar */}
      <Box sx={{ width: "100%", px: 2, py: 1, bgcolor: "#1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333" }}>
        <IconButton onClick={() => navigate("/")} sx={{ color: "rgba(255,255,255,0.5)" }}>
            <CloseIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: "bold" }}>
            Easy CV Builder
        </Typography>
        <Button 
            startIcon={<SaveIcon />} 
            size="small" 
            variant="outlined" 
            color="secondary"
            onClick={() => setShowSaveDialog(true)}
        >
            Save Progress
        </Button>
      </Box>

      {/* Main Content: Split Layout */}
      <Box sx={{ display: "flex", width: "100%", maxWidth: "1400px", flexGrow: 1, overflow: "hidden" }}>
        
        {/* Left: Chat Interface */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", borderRight: "1px solid #333" }}>
            <Paper
                elevation={0}
                sx={{
                    flexGrow: 1,
                    bgcolor: "transparent",
                    overflowY: "auto",
                    px: 3,
                    pb: 12,
                    pt: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2
                }}
            >
                {history.map((msg, index) => (
                    <Box
                        key={index}
                        sx={{
                            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                            maxWidth: "85%",
                            width: msg.type === "info" ? "100%" : "auto"
                        }}
                    >
                        {msg.type === "info" && (
                            <Fade in={true}>
                                <Paper sx={{ p: 2, mb: 1, bgcolor: "rgba(253, 187, 45, 0.1)", border: "1px solid #fdbb2d", borderRadius: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold", color: "#fdbb2d" }}>
                                        {msg.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#ddd" }}>
                                        {msg.content}
                                    </Typography>
                                </Paper>
                            </Fade>
                        )}

                        {msg.type !== "info" && (
                            <Fade in={true}>
                                <Box sx={{ display: "flex", gap: 1, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                                    {msg.role === "bot" && (
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#fdbb2d" }}>
                                            <AiIcon sx={{ fontSize: 20, color: "#000" }} />
                                        </Avatar>
                                    )}
                                    <Paper
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: msg.role === "user" ? "#fdbb2d" : "#252525",
                                            color: msg.role === "user" ? "#000" : "#fff",
                                            borderTopLeftRadius: msg.role === "bot" ? 4 : 24,
                                            borderTopRightRadius: msg.role === "user" ? 4 : 24,
                                        }}
                                    >
                                        <Typography variant="body1">{msg.content}</Typography>
                                    </Paper>
                                </Box>
                            </Fade>
                        )}
                    </Box>
                ))}

                {isTyping && (
                    <Box sx={{ alignSelf: "flex-start", display: "flex", gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#fdbb2d" }}>
                            <AiIcon sx={{ fontSize: 20, color: "#000" }} />
                        </Avatar>
                        <Paper sx={{ p: 2, borderRadius: 3, bgcolor: "#252525", borderTopLeftRadius: 4 }}>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Box sx={{ width: 8, height: 8, bgcolor: "#666", borderRadius: "50%", animation: "pulse 1s infinite" }} />
                                <Box sx={{ width: 8, height: 8, bgcolor: "#666", borderRadius: "50%", animation: "pulse 1s infinite 0.2s" }} />
                                <Box sx={{ width: 8, height: 8, bgcolor: "#666", borderRadius: "50%", animation: "pulse 1s infinite 0.4s" }} />
                            </Box>
                        </Paper>
                    </Box>
                )}
                
                <div ref={messagesEndRef} />
            </Paper>

            <Box 
                sx={{ 
                    position: "absolute", 
                    bottom: 0, 
                    left: 0,
                    right: 0, 
                    p: 2, 
                    bgcolor: "#121212",
                    borderTop: "1px solid #333" 
                }}
            >
                {!isTyping && currentStep?.options && (
                    <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: "auto", pb: 1 }}>
                        {currentStep.options.map((opt, i) => (
                            <Chip 
                                key={i} 
                                label={opt.label} 
                                onClick={() => handleOptionClick(opt)}
                                sx={{ 
                                    bgcolor: "#fdbb2d", 
                                    color: "#000", 
                                    fontWeight: "bold",
                                    "&:hover": { bgcolor: "#fff" }
                                }} 
                                clickable
                            />
                        ))}
                    </Stack>
                )}

                {currentStep?.type === "final" && (
                    <Button 
                        fullWidth 
                        variant="contained" 
                        color="secondary" 
                        size="large"
                        onClick={handleSaveAndExit}
                    >
                        Generate & Create One Profile
                    </Button>
                )}

                {(!currentStep?.options && currentStep?.type !== "final" && currentStep?.type !== "info" && currentStep?.type !== "message") && (
                    <form onSubmit={handleInputSubmit} style={{ display: "flex", gap: 1 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder={currentStep?.placeholder || "Type your answer..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isTyping}
                            autoFocus
                            sx={{
                                bgcolor: "#1e1e1e",
                                borderRadius: 1,
                                "& .MuiOutlinedInput-root": { color: "#fff" }
                            }}
                        />
                        <IconButton 
                            type="submit" 
                            color="secondary" 
                            disabled={!inputValue.trim() || isTyping}
                            sx={{ bgcolor: "rgba(253, 187, 45, 0.1)" }}
                        >
                            <SendIcon />
                        </IconButton>
                    </form>
                )}
            </Box>
        </Box>

        {/* Right: Live Preview (Hidden on mobile) */}
        <Box sx={{ 
            width: "400px", 
            p: 2, 
            display: { xs: "none", md: "block" },
            bgcolor: "#f5f5f5" // Light background for document feel
        }}>
            <LiveResumePreview answers={answers} />
        </Box>

      </Box>

      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Progress?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To save your answers and continue later, you need to create a free account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveAndExit} variant="contained" color="primary">
            Create Account
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default EasyCvWizard;
