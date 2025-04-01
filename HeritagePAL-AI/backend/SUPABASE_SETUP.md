# Supabase Setup Guide for HeritagePAL-AI

This guide will walk you through setting up Supabase for authentication and database management for the HeritagePAL-AI application.

## Step 1: Create a Supabase Account and Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one.
2. Create a new project with a name like "heritage-pal-ai" or similar.
3. Note down the project URL and API keys which will be required later.

## Step 2: Set Up the Database Schema

1. Navigate to the "SQL Editor" in your Supabase dashboard.
2. Copy and paste the SQL from the `backend/src/db/schema.sql` file into the SQL editor.
3. Run the SQL to create the required tables and security policies.

## Step 3: Configure Environment Variables

Update your `.env` file with the following Supabase-related variables:

```
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

- `SUPABASE_URL`: Your Supabase project URL (found in Project Settings > API)
- `SUPABASE_KEY`: Your public anon key (found in Project Settings > API)
- `SUPABASE_SERVICE_KEY`: Your service role key (found in Project Settings > API)

## Step 4: Create an Initial Admin User

To create your first admin user, you'll need to:

1. Register a regular user through your app's registration endpoint
2. Use the Supabase SQL Editor to elevate this user to admin status

Run the following SQL in the Supabase SQL Editor (replace the values as needed):

```sql
-- Insert into admins table
INSERT INTO admins (id, name, email, role)
VALUES (
  'auth-user-id-here',  -- Get this from auth.users table
  'Admin Name',
  'admin@example.com',
  'admin'
);
```

## Step 5: Enable Email Auth Provider

1. Go to Authentication > Providers
2. Ensure the Email provider is enabled
3. Configure password requirements and redirect URLs as needed

## Step 6: Email Templates (Optional)

If you want to customize email templates:

1. Go to Authentication > Email Templates
2. Customize the templates for:
   - Confirmation
   - Invitation
   - Magic Link
   - Reset Password
   - Change Email

## Step 7: Row Level Security (RLS) Verification

The schema script already sets up RLS policies, but verify they are active:

1. Go to Database > Tables
2. Click on each table (admins, users, learning_history)
3. Go to the "Policies" tab
4. Ensure the policies are set up correctly as defined in the schema

## Troubleshooting

### RLS Policy Violations

If you encounter errors like "new row violates row-level security policy":

1. Ensure you're using the service role key for admin operations that bypass RLS
2. Check that your auth middleware is correctly setting the JWT claims
3. Verify the RLS policies match your application's authorization model

### Authentication Issues

If users can't log in or register:

1. Check that the Supabase URL and keys are correct
2. Ensure the Email provider is enabled
3. Check for any email delivery issues in the Supabase logs

## Testing Supabase Setup

To verify your Supabase setup is working correctly:

1. Try to register a new user through your application
2. Try to log in with the registered user
3. Try to create an admin user following the steps in "Create an Initial Admin User"
4. Verify that RLS policies are enforced by testing different API endpoints

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security) 