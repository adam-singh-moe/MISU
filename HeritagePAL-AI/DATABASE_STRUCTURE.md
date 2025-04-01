# HeritagePAL-AI Database Structure

This document outlines the database structure for the HeritagePAL-AI application, designed for educational content management with grade-based access control.

## Core Tables

### Users and Authentication

- **admins**: Admin users with content management privileges
- **users**: Regular student users who access educational content

### Grade Structure

- **grades**: Contains the grade levels (1-6) with their descriptions
- **user_grades**: Links users to their assigned grades
- **grade_topics**: Links grades to topics (many-to-many relationship)

### Educational Content

- **topics**: Main educational topics containing content and metadata
- **educational_content**: Specific educational materials linked to topics
- **quizzes**: Assessment content linked to topics
- **practice_exams**: Comprehensive assessment materials for grades
- **flashcard_sets**: Sets of flashcards for studying
- **flashcards**: Individual flashcards belonging to flashcard sets

### User Activity

- **chat_messages**: Individual messages in AI chat conversations
- **user_chat_sessions**: User chat session metadata
- **quiz_results**: User quiz performance records
- **flashcard_sessions**: Flashcard study session records
- **user_topic_history**: History of topics viewed by users
- **user_learning_sessions**: Tracks AI-generated learning content for users

## Key Relationships

1. **User-Grade Relationship**
   - Users are assigned to one or more grades through `user_grades` table
   - This controls what content they can access

2. **Grade-Topic Relationship**
   - Topics are assigned to grades through the `grade_topics` table
   - This determines what topics are available for each grade level

3. **Topic-Content Relationship**
   - Educational content, quizzes, and flashcards are linked to topics
   - This organizes content into appropriate categories

4. **User-Learning Content Relationship**
   - AI-generated content is linked to users through the `user_id` field
   - User learning sessions track what content has been generated for each user
   - Only logged-in users have their generated content saved to the database

## Access Control

- Row-Level Security (RLS) policies ensure:
  - Admin users can access and manage all content
  - Student users can only access content assigned to their grade(s)
  - Users can only view their own history and performance data
  - Users can only access AI-generated content that they've created

## Main Database Flow

1. Admins create topics and assign them to specific grades
2. Students select or are assigned to a grade
3. Students can only view topics and content assigned to their grade
4. The AI automatically generates learning content, quizzes, and flashcards for students
5. For logged-in students, generated content is saved to their profile for future sessions
6. For non-logged-in students, content is generated on-the-fly but not saved

This structure provides a flexible, secure system for delivering grade-appropriate educational content while maintaining proper access controls and leveraging AI for personalized learning experiences. 