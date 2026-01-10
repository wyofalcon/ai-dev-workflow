# CVstomize: AI-Powered Resume Builder

## Project Overview

**CVstomize** is a comprehensive, AI-driven platform designed to help users create high-quality, ATS-optimized resumes. It goes beyond simple templates by using advanced AI to uncover "hidden skills" through conversation, assess personality traits (OCEAN model), and tailor content to specific job descriptions using RAG (Retrieval-Augmented Generation).

### Core Features
*   **Conversational Onboarding:** A chat interface that interviews users to build their resume from scratch.
*   **Gold Standard Assessment:** A scientific personality assessment (BFI-20) combined with narrative analysis to highlight soft skills.
*   **Smart Search:** An integrated search bar in the profile header to quickly find and edit profile sections or skills.
*   **AI Skill Organizer:** Uses a local LLM (Phi-3-mini) to auto-categorize skills and identify top strengths.
*   **Privacy-First AI:** Leverages `@mlc-ai/web-llm` to run powerful AI models directly in the user's browser via WebGPU, ensuring data privacy and reducing backend costs.

### Tech Stack
*   **Frontend:** React 18, Material-UI (MUI), Firebase Auth.
*   **Backend:** Node.js 20, Express, Prisma ORM.
*   **Database:** PostgreSQL 15 (Google Cloud SQL), pgvector for semantic search.
*   **AI & ML:**
    *   **Backend:** Google Vertex AI (Gemini Pro/Flash, text-embedding-004).
    *   **Frontend:** WebLLM (Phi-3-mini-4k-instruct) running in a Web Worker.
*   **Infrastructure:** Google Cloud Platform (Cloud Run, Cloud Build, Secret Manager).

## Building and Running

### Prerequisites
*   Node.js 20+
*   PostgreSQL 15+ (Local or Docker)
*   Google Cloud Credentials (for backend features like Vertex AI)

### Backend (`/api`)
The backend handles authentication, database interactions, and server-side AI operations.

1.  **Navigate to directory:** `cd api`
2.  **Install dependencies:** `npm install`
3.  **Setup Database:**
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```
4.  **Start Development Server:** `npm run dev` (Runs on port 3001)
5.  **Run Tests:** `npm test`

### Frontend (`/`)
The React application serves the user interface and local AI features.

1.  **Install dependencies:** `npm install`
2.  **Start Development Server:** `npm start` (Runs on port 3000)
3.  **Build for Production:** `npm run build`

## Development Conventions

### Code Structure
*   **`src/components`:** Reusable UI components. Complex pages (like `UserProfilePage.js`) are also located here but are candidates for refactoring into `src/pages`.
*   **`src/contexts`:** Global state management using React Context.
    *   `AuthContext.js`: Handles Firebase authentication and user profile syncing.
    *   `WebLlmContext.js`: Manages the local WebLLM worker, model loading, and inference.
*   **`src/workers`:** Web Workers for heavy background tasks (e.g., `llm.worker.js` for AI).
*   **`api/routes`:** Express route handlers, organized by feature (auth, profile, resume, search).
*   **`api/prisma`:** Database schema (`schema.prisma`) and migrations.

### Best Practices
*   **AI Integration:**
    *   Use **WebLLM** (frontend) for low-latency, privacy-sensitive, or interactive tasks (e.g., chat, sorting).
    *   Use **Vertex AI** (backend) for heavy-duty generation, embedding, or tasks requiring larger context windows.
*   **Styling:** Prefer Material-UI's `sx` prop for component-level styling over global CSS files.
*   **State:** Use Context for global data (User, Auth, AI Model) and local `useState`/`useReducer` for component logic.
*   **Security:** Never commit API keys. Use `.env` files and GCP Secret Manager. Frontend communicates with backend via `AuthContext`'s `createAuthAxios` to ensure requests are authenticated.

### Key Workflows
*   **Profile Updates:** User data is flattened for the frontend (`userProfile` object) but stored relationally in Postgres (`User` -> `UserProfile`, `Experience`, etc.).
*   **Local AI Caching:** The WebLLM model is cached in the browser. The `WebLlmContext` handles auto-restoration to prevent re-downloading on refresh.
