 📚 StudyAI – AI Study Notes Generator

StudyAI is an AI-powered web application that transforms study material into concise, revision-friendly learning content.

Users can paste their notes, textbook content, or lecture material and generate:

- 📋 AI-generated summaries
- 🔑 Key points
- ❓ Interactive quizzes
- 🧠 Flashcards
- 🤖 AI Study Assistant for questions and simple explanations

 🚀 Live Demo

https://ai-study-notes-sable.vercel.app/

 ✨ Features

 📚 Study Material
Paste up to 50,000 characters of study material and use it as the source for AI-generated learning content.

 📋 Summary
Converts lengthy study material into a concise explanation.

 🔑 Key Points
Extracts the most important concepts from the provided material.

 ❓ Interactive Quiz
Generates multiple-choice questions based on the study material and provides immediate feedback.

 🧠 Flashcards
Creates revision-focused question-and-answer cards with internal scrolling for larger sets.

 🤖 AI Study Assistant
Allows users to ask questions about their study material and request simple explanations.

 🛠️ Tech Stack

- Next.js
- React
- TypeScript
- CSS
- Next.js API Routes
- OpenAI API
- Vercel

 🏗️ Project Structure

```text
ai-study-notes/
├── backend/
│   └── app/
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assistant/
│   │   │   └── generate/
│   │   ├── AssistantChat.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── package.json
│   └── next.config.ts
└── .gitignore


💡 How It Works
1. User pastes study material.
2. StudyAI sends the material to the AI generation API.
3. The AI analyzes the content.
4. The application generates summaries, key points, quiz questions, and flashcards.
5. Users can interact with the AI Study Assistant using their study material.

🌐 Deployment
The application is deployed using Vercel.

🎯 Project Goal
The goal of StudyAI is to make studying more efficient by transforming large amounts of study material into structured, revision-friendly content.

👩‍💻 Author
Saher Bhatkar
