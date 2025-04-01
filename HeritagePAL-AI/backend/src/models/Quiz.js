/**
 * Quiz Model
 * Represents the structure of quizzes in the application
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {string} question_text - The question text
 * @property {string[]} options - Array of possible answers
 * @property {number} correct_answer - Index of the correct option (0-3)
 * @property {string} [explanation] - Explanation of the answer (optional)
 * @property {string} topic - The topic this question relates to
 * @property {string} difficulty - Difficulty level ("easy", "medium", "challenging")
 */

/**
 * @typedef {Object} Quiz
 * @property {string} id - Unique identifier
 * @property {string} title - Quiz title
 * @property {string} description - Brief description
 * @property {string} topic - Topic category
 * @property {number} grade - Grade level (1-6)
 * @property {string} difficulty - Difficulty level ("easy", "medium", "challenging")
 * @property {QuizQuestion[]} questions - Array of quiz questions
 * @property {Date} created_at - Date when the quiz was created
 * @property {Date} updated_at - Date when the quiz was last updated
 */

/**
 * Validates quiz data
 * @param {Quiz} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateQuiz(data) {
  const errors = [];

  if (!data.title || data.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!data.topic || data.topic.trim() === '') {
    errors.push('Topic is required');
  }

  if (!data.grade || isNaN(data.grade) || data.grade < 1 || data.grade > 6) {
    errors.push('Grade must be a number between 1 and 6');
  }

  if (!data.difficulty || !['easy', 'medium', 'challenging'].includes(data.difficulty)) {
    errors.push('Difficulty must be one of: easy, medium, challenging');
  }

  if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('Quiz must have at least one question');
  } else {
    // Validate each question
    data.questions.forEach((question, index) => {
      if (!question.question_text || question.question_text.trim() === '') {
        errors.push(`Question ${index + 1} must have text`);
      }

      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        errors.push(`Question ${index + 1} must have at least 2 options`);
      }

      if (question.correct_answer === undefined || 
          isNaN(question.correct_answer) || 
          question.correct_answer < 0 || 
          question.correct_answer >= (question.options?.length || 0)) {
        errors.push(`Question ${index + 1} must have a valid correct answer index`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateQuiz
}; 