const { model } = require('../config/geminiConfig');
const { supabase } = require('../config/supabaseConfig');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Get AI tutor response
 * @route   POST /api/chat/message
 * @access  Public
 */
const getChatResponse = async (req, res, next) => {
  try {
    const { message, sessionId, grade } = req.body;
    const userId = req.user?.id; // Will be undefined for non-authenticated users
    
    if (!message) {
      res.status(400);
      throw new Error('Please provide a message');
    }
    
    // Generate a new session ID if not provided
    const chatSessionId = sessionId || uuidv4();
    
    // First, store the user message in chat history
    await storeMessage(chatSessionId, 'user', message);
    
    // If user is authenticated, associate this chat session with the user
    if (userId && !sessionId) {
      try {
        await supabase
          .from('user_chat_sessions')
          .insert({
            user_id: userId,
            session_id: chatSessionId,
            created_at: new Date(),
            topic: message.substring(0, 50) // Use first 50 chars of message as topic
          });
      } catch (error) {
        console.error('Error associating chat with user:', error);
        // Continue execution even if association fails
      }
    }
    
    // Get relevant educational content based on the query
    const { data: relevantContent } = await supabase
      .from('educational_content')
      .select('*')
      .eq(grade ? 'grade' : 'id', grade || '0') // If grade specified, filter by grade
      .limit(5);
    
    // Extract the processed content from the retrieved documents
    let contextData = '';
    if (relevantContent && relevantContent.length > 0) {
      relevantContent.forEach(content => {
        contextData += `${content.title}: ${content.processed_content?.substring(0, 2000) || 'No content available'}\n\n`;
      });
    }
    
    // Retrieve the last 5 messages for context
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', chatSessionId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Format chat history
    let conversationContext = '';
    if (chatHistory && chatHistory.length > 0) {
      // Reverse to get chronological order
      const reversedHistory = [...chatHistory].reverse();
      reversedHistory.forEach(msg => {
        conversationContext += `${msg.role === 'user' ? 'Student' : 'HeritagePal'}: ${msg.content}\n`;
      });
    }
    
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
      ${conversationContext}
      
      Relevant educational content:
      ${contextData}
      
      Student's grade level: ${grade || 'unknown'}
      
      Student's question: ${message}
      
      Your response:
    `;
    
    let response;
    try {
      // Generate response
      const result = await model.generateContent(prompt);
      response = result.response.text();
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Provide a fallback response if AI generation fails
      response = "I'm sorry, I'm currently having trouble connecting to my knowledge base. " +
        "This could be due to a configuration issue or high demand. Please try again later or " +
        "contact the administrator if this problem persists.";
    }
    
    // Store the AI response in chat history
    await storeMessage(chatSessionId, 'assistant', response);
    
    res.json({
      message: response,
      sessionId: chatSessionId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Store chat message in database
 * @access  Private (internal helper function)
 */
const storeMessage = async (sessionId, role, content) => {
  try {
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        created_at: new Date(),
      });
  } catch (error) {
    console.error('Error storing chat message:', error);
    // Continue execution even if storage fails
  }
};

/**
 * @desc    Get previous chat session messages
 * @route   GET /api/chat/history/:sessionId
 * @access  Public for session-specific history, Private for all user history
 */
const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    
    if (!sessionId && !userId) {
      res.status(400);
      throw new Error('Session ID or authentication is required');
    }
    
    if (sessionId) {
      // Get specific chat session history
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        res.status(400);
        throw new Error('Error retrieving chat history: ' + error.message);
      }
      
      res.json(data || []);
    } else if (userId) {
      // Get all chat sessions for the authenticated user
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (sessionsError) {
        res.status(400);
        throw new Error('Error retrieving user chat sessions: ' + sessionsError.message);
      }
      
      res.json(sessions || []);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatResponse,
  getChatHistory,
}; 