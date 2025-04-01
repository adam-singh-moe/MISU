/**
 * Test script to verify flashcard_sets table exists
 * 
 * Run with: node test_flashcard_sets.js
 */

// Load environment variables
require('dotenv').config();

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFlashcardSets() {
  console.log('Testing flashcard_sets table...');
  
  try {
    // Try to get the table definition
    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error accessing flashcard_sets table:', error.message);
      return false;
    }
    
    console.log('✅ flashcard_sets table exists and is accessible!');
    console.log(`Found ${data.length} records`);
    return true;
    
  } catch (err) {
    console.error('Exception when testing flashcard_sets table:', err.message);
    return false;
  }
}

// Run the test
testFlashcardSets().then(result => {
  if (!result) {
    console.log('\nTo fix this issue:');
    console.log('1. Edit the file "fix_flashcard_sets.bat" and add your Supabase URL and API Key');
    console.log('2. Run "fix_flashcard_sets.bat" from the command line');
    console.log('3. Restart your server');
  }
  process.exit(result ? 0 : 1);
}); 