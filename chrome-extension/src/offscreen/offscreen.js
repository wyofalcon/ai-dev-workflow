import { CreateMLCEngine } from "@mlc-ai/web-llm";

// Constants
const MODEL_ID = "Phi-3-mini-4k-instruct-q4f16_1-MLC";

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'run_inference') {
    console.log("Offscreen received job text:", message.data);
    const jobDescription = message.data;
    const token = message.token;
    
    // In future: Fetch user profile using token
    let userContext = "";
    if (token) {
        console.log("✅ Auth token received, can fetch profile...");
        // TODO: Fetch profile from API using token
        // const profile = await fetchProfile(token);
        // userContext = JSON.stringify(profile);
    } else {
        console.log("⚠️ No auth token, running in anonymous mode");
    }

    try {
      // 1. Initialize Engine
      chrome.runtime.sendMessage({ 
        action: 'ai_progress', 
        progress: 0, 
        text: 'Loading AI Model (this may take a moment)...' 
      });

      const engine = await CreateMLCEngine(
        MODEL_ID,
        { 
          initProgressCallback: (report) => {
            chrome.runtime.sendMessage({ 
              action: 'ai_progress', 
              progress: report.progress, 
              text: report.text 
            });
          }
        }
      );

      // 2. Generate
      chrome.runtime.sendMessage({ 
        action: 'ai_progress', 
        progress: 1, 
        text: 'Analyzing Job Description...' 
      });

      const messages = [
        { role: "system", content: "You are an expert resume tailorer. Your goal is to analyze a job description and suggest key skills and keywords to include in a resume." },
        { role: "user", content: `Analyze the following job description and list the top 5 most important technical skills and 3 key soft skills required. Also suggest a 1-sentence professional summary tailored to this role.\n\nJOB DESCRIPTION:\n${jobDescription}` }
      ];

      const completion = await engine.chat.completions.create({
        messages,
        temperature: 0.7,
      });

      const resultText = completion.choices[0].message.content;

      // 3. Send Results
      chrome.runtime.sendMessage({ 
        action: 'ai_complete', 
        result: resultText 
      });

    } catch (error) {
      console.error("AI Error:", error);
      chrome.runtime.sendMessage({ 
        action: 'ai_progress', 
        progress: 0, 
        text: `Error: ${error.message}` 
      });
    }
  }
});
