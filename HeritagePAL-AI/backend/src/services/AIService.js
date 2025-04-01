/**
 * AI Service
 * Handles interactions with Google's Gemini API for AI-powered features
 */

const { model } = require('../config/geminiConfig');

/**
 * Generate a response to a chat message
 * @param {string} message - The user's message
 * @param {string} conversationContext - Previous messages in the conversation
 * @param {string} educationalContext - Relevant educational content for context
 * @param {number} [grade] - Student's grade level (1-6)
 * @returns {Promise<string>} The AI-generated response
 */
async function generateChatResponse(message, conversationContext, educationalContext, grade) {
  try {
    // Prepare the prompt for the AI
    const prompt = `
      You are HeritagePal, an educational AI tutor designed specifically for Guyanese primary school students (grades 1-6) 
      studying Social Studies. You should respond in a friendly, encouraging, and age-appropriate manner.
      
      Your knowledge is based on the Guyanese Social Studies curriculum. You should only provide information that is 
      factually accurate and relevant to the Guyanese context. If you're not sure about something, admit that you don't know 
      rather than making up information.
      
      When explaining concepts, use simple language appropriate for the student's grade level. For younger students (grades 1-3),
      use very simple explanations with short sentences. For older students (grades 4-6), you can use more complex vocabulary 
      and longer explanations.
      
      Recent conversation history:
      ${conversationContext || 'This is the start of the conversation.'}
      
      Relevant educational content:
      ${educationalContext || 'No specific content provided.'}
      
      Student's grade level: ${grade || 'unknown'}
      
      Student's question: ${message}
      
      Your response:
    `;
    
    // Generate response
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating chat response:', error);
    if (error.message === 'Invalid API key') {
      return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.";
    }
    throw error;
  }
}

/**
 * Generate quiz questions based on educational content
 * @param {string} topic - The topic to generate questions about
 * @param {number} grade - Grade level (1-6)
 * @param {string} difficulty - Difficulty level ("easy", "medium", "challenging")
 * @param {string} contentContext - Educational content to base questions on
 * @param {number} [questionCount=10] - Number of questions to generate
 * @returns {Promise<Object>} Generated quiz questions
 */
async function generateQuizQuestions(topic, grade, difficulty, contentContext, questionCount = 10) {
  try {
    // Prepare the prompt for generating questions
    const prompt = `
      Generate ${questionCount} multiple-choice questions about "${topic}" for Guyanese grade ${grade} Social Studies students.
      
      Based on the following educational content:
      ${contentContext}
      
      The questions should be at ${difficulty} difficulty level.
      
      Format the response as a JSON array where each question has:
      - question_text: the question
      - options: array of 4 possible answers
      - correct_answer: the index of the correct option (0-3)
      - explanation: brief explanation of why the answer is correct
      - topic: "${topic}"
      - difficulty: "${difficulty}"
      
      Make questions appropriate for grade ${grade} students. Focus on factual knowledge related to Guyanese Social Studies.
    `;
    
    // Generate questions
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the JSON from the response
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Error parsing quiz questions response:', parseError);
      console.log('Raw response:', response);
      // If parsing fails, return a structured error
      return { error: 'Failed to generate valid quiz questions' };
    }
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    if (error.message === 'Invalid API key') {
      return { error: 'AI service unavailable' };
    }
    throw error;
  }
}

/**
 * Generate flashcards for studying
 * @param {string} topic - The topic to generate flashcards for
 * @param {number} grade - Grade level (1-6)
 * @param {string} contentContext - Educational content to base flashcards on
 * @param {number} [count=10] - Number of flashcards to generate
 * @returns {Promise<Object>} Generated flashcards
 */
async function generateFlashcards(topic, grade, contentContext, count = 10) {
  try {
    // Prepare the prompt for generating flashcards
    const prompt = `
      Generate ${count} flashcards about "${topic}" for Guyanese grade ${grade} Social Studies students.
      
      Based on the following educational content:
      ${contentContext}
      
      Format the response as a JSON array where each flashcard has:
      - term: the term or concept (front of card)
      - definition: the definition or explanation (back of card)
      - example: a brief example to illustrate the concept (optional)
      - topic: "${topic}"
      - grade: ${grade}
      
      Focus on key terms, concepts, and facts that are important for grade ${grade} students to understand about "${topic}".
    `;
    
    // Generate flashcards
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the JSON from the response
    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error('Error parsing flashcards response:', parseError);
      console.log('Raw response:', response);
      // If parsing fails, return a structured error
      return { error: 'Failed to generate valid flashcards' };
    }
  } catch (error) {
    console.error('Error generating flashcards:', error);
    if (error.message === 'Invalid API key') {
      return { error: 'AI service unavailable' };
    }
    throw error;
  }
}

/**
 * Generate a summary of educational content
 * @param {string} topic - The topic to summarize
 * @param {number} grade - Grade level (1-6)
 * @param {string} contentContext - Educational content to summarize
 * @returns {Promise<string>} Generated summary
 */
async function generateContentSummary(topic, grade, contentContext) {
  try {
    // Prepare the prompt for generating a summary
    const prompt = `
      Create an educational summary about "${topic}" for Guyanese grade ${grade} Social Studies students.
      
      Based on the following educational content:
      ${contentContext}
      
      Create a well-structured summary with these sections:
      1. Introduction: Brief explanation of what this topic is about
      2. Key Points: The most important facts and concepts (4-6 bullet points)
      3. Important Vocabulary: Key terms and definitions (3-5 terms)
      4. Summary: A concise paragraph summarizing the topic
      
      Make the language appropriate for grade ${grade} students. Keep your response focused on the factual content
      related to Guyanese Social Studies.
    `;
    
    // Generate summary
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating content summary:', error);
    if (error.message === 'Invalid API key') {
      return "Summary generation is currently unavailable. Please try again later.";
    }
    throw error;
  }
}

/**
 * Process and extract knowledge from educational content
 * @param {string} rawContent - The raw content to process
 * @param {string} topic - The topic of the content
 * @param {number} grade - Grade level (1-6)
 * @returns {Promise<string>} Processed content
 */
async function processEducationalContent(rawContent, topic, grade) {
  try {
    // Prepare the prompt for processing content
    const prompt = `
      You are an expert educational content processor for Guyanese Social Studies curriculum.
      
      Process the following raw educational content about "${topic}" for grade ${grade} students:
      
      ${rawContent}
      
      Extract and structure the key knowledge while maintaining the original educational value.
      Organize the content in a clear, structured format with headings, subheadings, and bullet points where appropriate.
      Ensure that the processed content is:
      1. Age-appropriate for grade ${grade} students
      2. Factually accurate and aligned with the Guyanese curriculum
      3. Well-structured for easy comprehension
      4. Complete (does not lose important information from the original)
      
      Return ONLY the processed content without any additional commentary.
    `;
    
    // Process content
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error processing educational content:', error);
    if (error.message === 'Invalid API key') {
      return "Content processing is currently unavailable. The original content will be preserved without AI processing.";
    }
    throw error;
  }
}

/**
 * Generate a complete learning set for a topic
 * @param {string} topicId - The ID of the topic
 * @param {string} topicTitle - The title of the topic
 * @param {string} topicContent - The content of the topic
 * @param {number} grade - Grade level (1-6)
 * @returns {Promise<Object>} Generated learning set with educational content, quiz, and flashcards
 */
async function generateLearningSet(topicId, topicTitle, topicContent, grade) {
  try {
    // Generate educational content summary
    const contentSummary = await generateContentSummary(topicTitle, grade, topicContent);
    
    // Generate quiz questions
    const quizQuestions = await generateQuizQuestions(
      topicTitle, 
      grade, 
      'medium', 
      topicContent, 
      10
    );
    
    // Generate flashcards
    const flashcards = await generateFlashcards(
      topicTitle,
      grade,
      topicContent,
      8
    );
    
    // Return complete learning set
    return {
      educational_content: {
        title: `${topicTitle} - Summary`,
        description: `A summary of ${topicTitle} for grade ${grade}`,
        topic_id: topicId,
        grade: grade,
        source: 'AI-Generated',
        raw_content: topicContent.substring(0, 1000), // Limit size
        processed_content: contentSummary
      },
      quiz: {
        title: `${topicTitle} - Quiz`,
        description: `A quiz about ${topicTitle} for grade ${grade}`,
        topic_id: topicId,
        grade: grade,
        difficulty: 'medium',
        questions: quizQuestions
      },
      flashcard_set: {
        title: `${topicTitle} - Flashcards`,
        description: `Flashcards for learning ${topicTitle} concepts`,
        topic_id: topicId,
        grade: grade,
        flashcards: flashcards
      }
    };
  } catch (error) {
    console.error('Error generating learning set:', error);
    throw error;
  }
}

module.exports = {
  generateChatResponse,
  generateQuizQuestions,
  generateFlashcards,
  generateContentSummary,
  processEducationalContent,
  generateLearningSet
}; 