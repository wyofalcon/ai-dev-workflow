const https = require('https');

const payload = {
  "jobDescription": "Software Engineer - Full Stack\n\nWe're looking for a talented Full Stack Software Engineer to join our growing team.\n\nResponsibilities:\n- Build and maintain web applications using React and Node.js\n- Design and implement RESTful APIs\n- Work with PostgreSQL databases\n- Collaborate with product and design teams\n- Write clean, maintainable code\n\nRequirements:\n- 3+ years of experience in web development\n- Strong knowledge of JavaScript, React, and Node.js\n- Experience with SQL databases\n- Understanding of RESTful API design\n- Bachelor's degree in Computer Science or equivalent",
  "personalStories": "Q1: I've been building web applications for about 4 years. I started with basic HTML/CSS and JavaScript, then learned React and Node.js. I've built several full-stack projects including an e-commerce site and a task management app. I really enjoy creating intuitive user interfaces and solving complex problems with clean code.\n\nQ2: I've worked extensively with PostgreSQL in my personal projects. I designed database schemas for a multi-tenant SaaS application, wrote complex queries with joins and aggregations, and implemented database migrations. I also have some experience with MongoDB for projects that needed flexible schemas.\n\nQ3: I once had to optimize a slow API endpoint that was timing out. I used database query analysis to find N+1 query issues, implemented caching with Redis, and added database indexes. The endpoint went from 8 seconds to under 200ms. It taught me a lot about performance optimization.\n\nQ4: In my last bootcamp project, I led a team of 3 developers building a social media app. I set up the project structure, handled code reviews, and made sure we followed best practices. We used Git for version control and had daily standups. The project was a success and got featured by the bootcamp.\n\nQ5: I love the feeling of solving problems and seeing users actually use what I built. I'm motivated by learning new technologies and improving my craft. I enjoy collaborating with others and learning from more experienced developers. The challenge of turning ideas into working software is what drives me.",
  "selectedSections": ["Professional Summary", "Core Competencies", "Professional Experience", "Education"],
  "sessionId": "e4d2f1b5c8a3d6e9f0a1b3c2d5e7f9a1"
};

const options = {
  hostname: 'cvstomize-api-351889420459.us-central1.run.app',
  path: '/api/resume/generate',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjM4MDI5MzRmZTBlZWM0NmE1ZWQwMDA2ZDE0YTFiYWIwMWUzNDUwODMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vY3ZzdG9taXplIiwiYXVkIjoiY3ZzdG9taXplIiwiYXV0aF90aW1lIjoxNzYzMTAyMDA4LCJ1c2VyX2lkIjoic3RhZ2luZy10ZXN0LXVzZXItMSIsInN1YiI6InN0YWdpbmctdGVzdC11c2VyLTEiLCJpYXQiOjE3NjMxMDIwMDgsImV4cCI6MTc2MzEwNTYwOCwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6e30sInNpZ25faW5fcHJvdmlkZXIiOiJjdXN0b20ifX0.YRoG3w16feVU3mXy068Ww2RX0DeR9HtmmdBbd-5FfIr1GBODHTYBE4FQI1LObupmnU7SgcAJLfkNR_ac0T2F1ee3e4XW5M7IUxNYMaY6bEfivknuMmQhsjL48sfoLwGThOZP7Af3hQjRZvZL2KaI9-ZERRgbkvpGabyZgjNIS6HH7up5tTxeTGIuCGUDuLwP4fMUo3_wRSYXyAz7Fotc0zWN21wu5x7lFgX_WM4TfBZIUwwuscx_HBI1kI6x_hRROn9Ln_vGPTt-2tF8for27PPn5HjUK9R7F09uvIrAhFdiIlnZDIC7srKJLyWsjf2M3h6S7R5MMzHKx07U69iInA',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(JSON.stringify(payload));
req.end();
