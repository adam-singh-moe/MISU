# HeritagePal - Educational AI for Guyanese Social Studies

HeritagePal is an educational application for Guyanese primary school students (grades 1-6) studying Social Studies. The app serves as an AI tutor that helps students learn, practice, and prepare for exams using curriculum-aligned materials.

## Features

- **AI-Powered Learning**: Interactive chats with contextual guidance based on grade level
- **Quizzes**: AI-generated quizzes with multiple-choice questions
- **Flashcards**: Digital flashcards for practicing key concepts
- **Topic Summaries**: Concise explanations of important topics
- **Progress Tracking**: Track learning across different topics (for registered users)
- **Admin Dashboard**: For uploading and managing educational materials

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm 
- A Google Gemini API key
- A Supabase account and project

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/heritagepal.git
   cd heritagepal
   ```

2. Install dependencies:
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Update with your API keys (see below)

4. Start the development servers:
   ```
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server (in a new terminal)
   cd frontend
   npm run dev
   ```

5. Access the application:
   - Frontend: http://localhost:3050
   - Backend API: http://localhost:3080

### Setting up API Keys

#### Google Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Navigate to "Get API key" in the documentation
4. Create a new API key
5. Add the key to your `.env` file as `GOOGLE_GEMINI_API_KEY`

The application currently uses the `gemini-2.0-flash-lite` model which is cost-effective for educational applications.

#### Supabase Configuration

1. Create a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Navigate to Project Settings > API
4. Copy the "Project URL" and "anon/public" key 
5. Add these to your `.env` file as `SUPABASE_URL` and `SUPABASE_KEY`

## Application Structure

- **Frontend**: Next.js React application with Tailwind CSS and shadcn/ui
- **Backend**: Node.js with Express API server
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API for content generation

## Authentication

- **Admin Access**: Dedicated admin login for content management
- **User Accounts**: Optional accounts for students to track progress
- **Public Access**: Basic functionality available without login

## Development

See the [Development Guide](docs/DEVELOPMENT.md) for more detailed information on project architecture and contribution guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 