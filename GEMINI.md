# Project Overview

This is a full-stack web application called CVstomize, an AI-powered resume builder. The frontend is a React application, and the backend is a Node.js application using Express and Prisma. The application is deployed on Google Cloud Platform, using Cloud Run for the frontend and backend, Cloud SQL for the database, and Cloud Storage for file storage. It also uses Firebase for authentication and Vertex AI for its AI features.

## Building and Running

### Frontend

To build and run the frontend, use the following commands:

```bash
npm install
npm start
```

### Backend

To build and run the backend, use the following commands:

```bash
cd api
npm install
npx prisma generate
npm run dev
```

### Testing

To run the tests for the backend, use the following command:

```bash
cd api
npm test
```

## Development Conventions

The project uses a conventional commit message format. The backend code is written in JavaScript (CommonJS), and the frontend code is written in JavaScript (ESM). The project uses ESLint for linting.
