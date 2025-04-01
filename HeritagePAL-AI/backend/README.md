# HeritagePal Backend

Backend API service for the HeritagePal educational application, designed to help Guyanese primary school students learn Social Studies.

## Features

- **Authentication**: Secure admin login system with JWT authentication
- **Content Management**: Upload and process educational materials
- **AI Integration**: Generate educational content using Google Gemini AI
- **Chat System**: Interactive AI tutor that responds to student questions
- **Quiz System**: Generate and score quizzes based on educational content
- **Flashcards**: Create flashcard sets for learning key concepts

## Technologies

- **Node.js & Express**: Backend API framework
- **Supabase**: Database and authentication
- **Google Gemini AI**: Artificial intelligence for content generation
- **JWT**: Secure authentication
- **Multer**: File upload management

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   cd backend
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your configuration values
4. Create the required tables in your Supabase database (see Database Schema section)
5. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get admin profile

### Content
- `GET /api/content/topics` - Get all topics
- `GET /api/content/topic/:topic` - Get content by topic
- `GET /api/content/grade/:grade` - Get content by grade
- `POST /api/content/summary` - Generate topic summary
- `GET /api/content/search` - Search content

### Chat
- `POST /api/chat/message` - Send message to AI tutor
- `GET /api/chat/history/:sessionId` - Get chat history

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes/practice-exam` - Generate practice exam
- `POST /api/quizzes/:id/submit` - Submit quiz answers
- `GET /api/quizzes/topics` - Get all quiz topics

### Flashcards
- `GET /api/flashcards` - Get all flashcards
- `GET /api/flashcards/sets` - Get all flashcard sets
- `GET /api/flashcards/topics` - Get all flashcard topics
- `POST /api/flashcards/generate` - Generate flashcards
- `GET /api/flashcards/set/:id` - Get flashcard set by ID

### Admin
- `POST /api/admin/content` - Upload educational content
- `GET /api/admin/content` - Get all uploaded content
- `GET /api/admin/content/:id` - Get content by ID
- `PUT /api/admin/content/:id` - Update content
- `DELETE /api/admin/content/:id` - Delete content
- `POST /api/admin/content/:id/generate-quiz` - Generate quiz from content

## Database Schema

The application requires the following tables in Supabase:

1. **admins**: Store admin user information
   - id, email, password, name, role, created_at

2. **educational_content**: Store uploaded educational materials
   - id, title, description, grade, topic, content_type, file_path, file_name, file_original_name, file_size, file_mime_type, processed_content, uploaded_by, created_at, updated_at

3. **chat_messages**: Store chat interactions between students and AI
   - id, session_id, role, content, created_at

4. **quizzes**: Store generated quizzes
   - id, title, description, content_id, grade, topic, questions, difficulty, created_by, created_at

5. **quiz_results**: Store quiz results
   - id, quiz_id, session_id, score, correct_count, total_questions, created_at

6. **practice_exams**: Store generated practice exams
   - id, title, description, grade, questions, created_at

7. **flashcard_sets**: Store flashcard sets
   - id, title, description, grade, topic, card_count, created_at

8. **flashcards**: Store individual flashcards
   - id, set_id, front, back, grade, topic, created_at

## License

This project is proprietary software.

## Contact

For any questions or support, please contact the development team. 