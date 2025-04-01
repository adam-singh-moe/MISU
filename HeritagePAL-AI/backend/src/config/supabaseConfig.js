const { createClient } = require('@supabase/supabase-js');

// Regular Supabase client (for user-level operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Admin Supabase client (for service-level operations requiring additional privileges)
const adminSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Check if the configuration is valid
const validateConfig = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('http')) {
    console.error('Invalid SUPABASE_URL. Please check your .env file.');
    process.exit(1);
  }
  
  if (!process.env.SUPABASE_KEY) {
    console.error('Missing SUPABASE_KEY. Please check your .env file.');
    process.exit(1);
  }
  
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_SERVICE_KEY. Please check your .env file.');
    process.exit(1);
  }
};

// Validate on import
validateConfig();

module.exports = { supabase, adminSupabase }; 