/**
 * Flashcard Model
 * Represents the structure of flashcards in the application
 */

/**
 * @typedef {Object} Flashcard
 * @property {string} id - Unique identifier
 * @property {string} term - The term or concept on the front side
 * @property {string} definition - The definition or explanation on the back side
 * @property {string} topic - Topic category
 * @property {number} grade - Grade level (1-6)
 * @property {string} [example] - Optional example to illustrate the term
 * @property {Date} created_at - Date when the flashcard was created
 */

/**
 * @typedef {Object} FlashcardSet
 * @property {string} id - Unique identifier
 * @property {string} title - Set title
 * @property {string} description - Brief description
 * @property {string} topic - Topic category
 * @property {number} grade - Grade level (1-6)
 * @property {Flashcard[]} flashcards - Array of flashcards in the set
 * @property {Date} created_at - Date when the set was created
 * @property {Date} updated_at - Date when the set was last updated
 */

/**
 * Validates flashcard data
 * @param {Flashcard} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateFlashcard(data) {
  const errors = [];

  if (!data.term || data.term.trim() === '') {
    errors.push('Term is required');
  }

  if (!data.definition || data.definition.trim() === '') {
    errors.push('Definition is required');
  }

  if (!data.topic || data.topic.trim() === '') {
    errors.push('Topic is required');
  }

  if (!data.grade || isNaN(data.grade) || data.grade < 1 || data.grade > 6) {
    errors.push('Grade must be a number between 1 and 6');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates flashcard set data
 * @param {FlashcardSet} data - The data to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateFlashcardSet(data) {
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

  if (!data.flashcards || !Array.isArray(data.flashcards) || data.flashcards.length === 0) {
    errors.push('Flashcard set must have at least one flashcard');
  } else {
    // Validate each flashcard
    data.flashcards.forEach((flashcard, index) => {
      const validation = validateFlashcard(flashcard);
      if (!validation.isValid) {
        errors.push(`Flashcard ${index + 1} has the following errors: ${validation.errors.join(', ')}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateFlashcard,
  validateFlashcardSet
}; 