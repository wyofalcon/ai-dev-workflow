import React from "react";
import { Container, Typography, Box, Paper, Divider, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const TermsPage = () => {
  const navigate = useNavigate();

  const Section = ({ title, children }) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "#fdbb2d" }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
        {children}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#121212", py: 8 }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 4, color: "text.secondary" }}
        >
          Back
        </Button>

        <Paper elevation={3} sx={{ p: 6, bgcolor: "#1e1e1e" }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
            Terms and Conditions
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mb: 4, color: "text.secondary", fontStyle: "italic" }}>
            Last Updated: {new Date().toLocaleDateString()}
          </Typography>

          <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.1)" }} />

          <Section title="1. Introduction">
            Welcome to CVstomize. By accessing or using our website and services, you agree to be bound by these Terms and Conditions. Our services are designed to help you identify, articulate, and present your professional skills through AI-assisted resume generation and career tools.
          </Section>

          <Section title="2. Accuracy and Truthfulness of Information">
            <strong style={{ color: "#fff" }}>Important Notice regarding Employer Interactions:</strong><br /><br />
            You acknowledge that the purpose of CVstomize is to uncover <em>authentic</em> skills and potential. When you use our services to create resumes, profiles, or other career documents, <strong>you agree to provide only true, accurate, current, and complete information.</strong>
            <br /><br />
            If you choose to opt-in to features that share your data with third parties (including recruiters, hiring managers, and employers), you bear full responsibility for the accuracy of that data. Falsifying education, experience, skills, or credentials can lead to:
            <ul style={{ marginTop: "8px" }}>
              <li>Immediate termination of your CVstomize account.</li>
              <li>Disqualification from job opportunities.</li>
              <li>Legal liability or reputational damage.</li>
            </ul>
            CVstomize is a tool for <em>discovery</em>, not fabrication. We strictly prohibit the use of our AI tools to generate false work history or exaggerated claims.
          </Section>

          <Section title="3. User Conduct">
            You agree not to use the Service to:
            <ul style={{ marginTop: "8px" }}>
              <li>Upload or transmit content that is unlawful, harmful, threatening, abusive, or discriminatory.</li>
              <li>Impersonate any person or entity or falsely state your affiliation with a person or entity.</li>
              <li>Generate resumes for individuals other than yourself without their explicit permission.</li>
              <li>Interfere with or disrupt the servers or networks connected to the Service.</li>
            </ul>
          </Section>

          <Section title="4. Intellectual Property Rights">
            The generated resume content (the text describing your specific skills and history) belongs to you. However, the design, layout, graphics, code, and "CVstomize" brand elements are the property of CVstomize. You are granted a limited license to use these assets solely for your personal career development.
          </Section>

          <Section title="5. Disclaimer of Warranties">
            Our Service is provided "AS IS" and "AS AVAILABLE." While we strive to provide the most helpful and accurate AI insights, CVstomize does not guarantee:
            <ul style={{ marginTop: "8px" }}>
              <li>That your resume will result in job interviews or offers.</li>
              <li>That the AI's interpretation of your skills will be perfectly accurate in every instance.</li>
              <li>That our service will be error-free or uninterrupted.</li>
            </ul>
          </Section>

          <Section title="6. Limitation of Liability">
            To the fullest extent permitted by law, CVstomize shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or employment opportunities, arising out of your use or inability to use the Service.
          </Section>

          <Section title="7. Data Privacy and Sharing">
            Your privacy is critical. We only share your personal data with third parties (such as employers) when you explicitly opt-in to such sharing. Please refer to our Privacy Policy for full details on how we collect, use, and protect your data.
          </Section>

          <Box sx={{ mt: 8, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2">
              Questions about these Terms? Contact us at support@cvstomize.com
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default TermsPage;
