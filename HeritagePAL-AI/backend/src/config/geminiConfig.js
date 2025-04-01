const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

let genAI;
let model;

if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.warn('Missing or default Google Gemini API key. Please set GOOGLE_GEMINI_API_KEY in your .env file with a valid key.');
  // Create a more sophisticated mock model that returns a useful response
  model = {
    generateContent: async (prompt) => {
      console.log('Using mock Gemini model (no API key provided)');
      // Return a mock response that's useful for testing
      return {
        response: {
          text: () => {
            return "This is a mock response because no valid Gemini API key was provided. " +
              "To use the real AI functionality, please obtain an API key from https://ai.google.dev/ " +
              "and add it to your .env file as GOOGLE_GEMINI_API_KEY.";
          }
        }
      };
    }
  };
} else {
  try {
    // Initialize the Google Generative AI with your API key
    genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.0 Flash-Lite as it's the most cost-effective model
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    console.log('Google Gemini API initialized successfully with model: gemini-2.0-flash-lite');
  } catch (error) {
    console.error('Error initializing Google Gemini API:', error);
    // Provide a fallback mock if initialization fails
    model = {
      generateContent: async () => {
        return {
          response: {
            text: () => "Error initializing the Gemini API. Please check your API key and try again."
          }
        };
      }
    };
  }
}

module.exports = { genAI, model }; 