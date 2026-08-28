ReviseAI — AI Study Notes Generator

Project Documentation / README

🌐 Live Demo
https://ai-study-notes-sable.vercel.app/

📚 Overview
ReviseAI is an AI-powered study assistant that transforms lengthy study material into concise, structured, and revision-friendly content. Users can paste notes, textbook content, lecture material, or a study topic and generate summaries, key points, quizzes, flashcards, and explanations through the AI Study Assistant.

Goal: Study smarter, not harder.

✨ Features
📚 Study Material Input — Paste class notes, textbook content, lecture material, technical documentation, study topics, or revision material. Supports up to 50,000 characters.

📋 AI Summary — Generates a concise explanation of submitted study material.

🔑 Key Points — Extracts important concepts in an easy-to-review numbered format.

❓ Interactive Quiz — Generates multiple-choice questions with answer selection, feedback, progress, and next-question navigation.

🧠 Flashcards — Converts important concepts into question-and-answer revision cards with an internal scrolling area.

🤖 AI Study Assistant — Lets users ask questions about their study material and request simpler explanations or examples.

📱 Responsive UI — Uses responsive layouts, flexible cards, scrollable sections, and responsive typography.

🛠️ Tech Stack
Frontend: Next.js, React, TypeScript, CSS
AI: OpenAI API
Backend / API: Next.js API Routes and Python backend
Deployment: Vercel
Version Control: Git and GitHub

🏗️ Project Architecture

ai-study-notes/
├── backend/
│   └── app/
│       └── main.py
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assistant/route.ts
│   │   │   └── generate/route.ts
│   │   ├── AssistantChat.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── eslint.config.mjs
├── .gitignore
└── README.md

🔄 How ReviseAI Works
1. User enters study material.
2. The material is sent to the AI generation API.
3. AI analyzes the material and creates structured learning content.
4. The application displays study material, summary, key points, quiz, and flashcards.
5. The AI Study Assistant can answer questions using the study material as context.

📂 Main Components

page.tsx — Main application interface handling study material input, character counter, generation, generated results, quiz, flashcards, and assistant integration.
AssistantChat.tsx — Provides the AI Study Assistant interface.
/api/generate/route.ts — Handles AI study-material generation.
/api/assistant/route.ts — Handles AI Study Assistant requests.
globals.css — Contains global styling, dark theme, cards, buttons, responsive layout, quiz states, flashcards, and scrollable content areas.

🎨 UI Design
Dark navy background
Blue accent colors
Rounded cards
Minimal visual distractions
Responsive layout
Dedicated study sections
Scrollable content areas

⚙️ Installation
1. Clone: git clone https://github.com/SaherM26/ai-study-notes.git
2. Enter project: cd ai-study-notes
3. Enter frontend: cd frontend
4. Install dependencies: npm install
5. Create frontend/.env.local with: OPENAI_API_KEY=your_api_key_here
6. Start: npm run dev

Local application: http://localhost:3000

🔐 Environment Variables & Security

Store API credentials in environment variables and never commit them to GitHub. Keep .env, .env.local, and other credential files out of version control.

🚀 Deployment
ReviseAI is deployed on Vercel and connected to the GitHub repository SaherM26/ai-study-notes.
Production: https://ai-study-notes-sable.vercel.app/

🧪 Example Study Material
HTML (HyperText Markup Language) is the standard markup language used to create and structure content on the web. Semantic HTML uses elements that describe the meaning or purpose of their content, such as header, nav, main, article, section, and footer. CSS controls the visual presentation and styling of web content. HTTP is used to send resources from web servers to web browsers. MIME types help browsers identify the type of content being received, such as text/html.

💡 Example Use Cases
College students — convert lecture notes into revision material.
Exam preparation — generate summaries and flashcards.
Technical learning — simplify programming and technical documentation.
Quick revision — use key points and flashcards for last-minute study.
Active learning — use quizzes to test understanding.

🔮 Future Improvements

PDF upload support
DOCX upload support
Multiple study subjects
User accounts
Cloud-saved study notes
Quiz performance tracking
Study progress dashboard
AI-generated audio explanations
Multi-language support
Personalized study plans
Exam countdown and revision planner
Export notes as PDF
Share generated study notes
Bookmark important flashcards

📌 Project Status

Status: ✅ Completed
✅ Study material input
✅ AI summaries
✅ Key points
✅ Interactive quizzes
✅ Flashcards
✅ Scrollable flashcard section
✅ AI Study Assistant
✅ Responsive UI
✅ Vercel deployment

👩‍💻 Author
Saher Bhatkar
GitHub: https://github.com/SaherM26

📎 Project Links
Live Demo: https://ai-study-notes-sable.vercel.app/
GitHub Repository: https://github.com/SaherM26/ai-study-notes

📄 License
This project is created for educational and portfolio purposes.
