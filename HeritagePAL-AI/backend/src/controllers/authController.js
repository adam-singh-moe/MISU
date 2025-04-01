const { supabase, adminSupabase } = require('../config/supabaseConfig');

/**
 * @desc    Authenticate admin
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    console.log(`Login attempt for email: ${email}`);

    // Try to login with standard auth first
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // If we get an "Email not confirmed" error, try to confirm it with admin powers
    if (error && error.message === "Email not confirmed") {
      console.log('Email not confirmed, attempting to confirm and retry login...');
      
      try {
        // Find the user by email
        const { data: userData, error: userError } = await adminSupabase.auth.admin.listUsers();
        
        if (userError) {
          console.error('Error listing users:', userError);
          res.status(401);
          throw new Error(`Authentication failed: ${error.message}. Please contact support.`);
        }
        
        const user = userData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
          console.error('User not found in admin list');
          res.status(401);
          throw new Error('User not found');
        }
        
        // Confirm the email
        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error('Error confirming email:', updateError);
          res.status(401);
          throw new Error(`Failed to confirm email: ${updateError.message}`);
        }
        
        console.log('Email confirmed, trying login again');
        
        // Try login again
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (retryError) {
          console.error('Login failed after confirming email:', retryError);
          res.status(401);
          throw new Error(`Authentication failed after confirming email: ${retryError.message}`);
        }
        
        // Update the data variable for the rest of the function
        Object.assign(data || {}, retryData || {});
      } catch (confirmError) {
        console.error('Error during email confirmation process:', confirmError);
        res.status(401);
        throw new Error(confirmError.message || 'Failed to authenticate');
      }
    } else if (error) {
      console.error('Login error from Supabase Auth:', error.message);
      res.status(401);
      throw new Error(`Authentication failed: ${error.message}`);
    }

    // If we got here, we should have valid data
    if (!data || !data.user) {
      console.error('No user data after authentication');
      res.status(401);
      throw new Error('Authentication failed - no user data returned');
    }

    console.log('Supabase Auth successful for user:', data.user.id);

    // Check if the user is an admin in our admins table
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, name, email, role')
      .eq('id', data.user.id)
      .single();

    let adminData = admin;

    if (adminError) {
      console.error('Error fetching admin record:', adminError.message);
      // Check if the adminError is because no rows were found
      if (adminError.code === 'PGRST116') {
        // Try to create the admin record if it doesn't exist
        console.log('Admin record not found, attempting to create it');
        
        try {
          adminData = {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: email.toLowerCase(),
            role: 'admin',
            created_at: new Date(),
            // Add password field if needed
            password: 'supabase-auth-managed'
          };
          
          const { error: createError } = await adminSupabase
            .from('admins')
            .insert([adminData]);
            
          if (createError) {
            console.error('Failed to create admin record:', createError.message);
            adminData = null;
          } else {
            console.log('Created missing admin record successfully');
          }
        } catch (createError) {
          console.error('Exception when creating admin record:', createError);
          adminData = null;
        }
      }
    }

    // If we still don't have an admin record, return error
    if (!adminData) {
      console.error('User authenticated but not in admins table and could not be added');
      res.status(403);
      throw new Error('Not authorized as an admin. Please contact system administrator.');
    }

    console.log('Login successful for admin:', adminData.email);

    // Return admin details with the session token
    res.json({
      id: adminData.id,
      name: adminData.name,
      email: adminData.email,
      role: adminData.role,
      token: data.session.access_token
    });
  } catch (error) {
    console.error('Login error:', error.message);
    next(error);
  }
};

/**
 * @desc    Register a new admin user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    // Check if a user with this email already exists
    const { data: existingUser, error: checkError } = await adminSupabase.auth.admin.listUsers();
    if (!checkError && existingUser) {
      const exists = existingUser.users.some(user => user.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        // Try to auto-confirm the email if it exists but isn't confirmed
        try {
          console.log('User exists, attempting to confirm email and force update the password...');
          await adminSupabase.auth.admin.updateUserById(
            existingUser.users.find(user => user.email.toLowerCase() === email.toLowerCase()).id,
            { 
              email_confirm: true,
              password: password
            }
          );
          
          // Now sign them in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            console.error('Error signing in after updating user:', signInError);
            res.status(400);
            throw new Error('Email confirmed, but login failed. Please try logging in directly.');
          }
          
          // Return success with the token
          return res.status(200).json({
            id: signInData.user.id,
            name,
            email,
            role: 'admin',
            token: signInData.session.access_token,
            message: 'Account updated and logged in successfully'
          });
        } catch (updateError) {
          console.error('Error updating existing user:', updateError);
          res.status(400);
          throw new Error('A user with this email address already exists. Please try logging in or use a different email.');
        }
      }
    }

    // Create new user with admin API to force email confirmation
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Force email confirmation
      user_metadata: { 
        name,
        role: role || 'admin'
      }
    });

    if (authError) {
      res.status(400);
      throw new Error('Error creating user: ' + authError.message);
    }

    // Check if the user was created successfully
    if (!authData.user) {
      res.status(400);
      throw new Error('User creation failed');
    }

    console.log('User created in Supabase Auth with forced email confirmation:', authData.user.id);

    // Now insert into the admins table using admin client to bypass RLS
    const adminData = {
      id: authData.user.id,
      name,
      email: email.toLowerCase(),
      role: role || 'admin',
      created_at: new Date(),
      // Add a dummy password if the column exists and is not nullable
      password: 'supabase-auth-managed' 
    };

    const { data: admin, error: createError } = await adminSupabase
      .from('admins')
      .insert([adminData])
      .select();

    if (createError) {
      console.error('Error adding user to admins table:', createError);
      
      // Try again with a different approach if the first one failed
      if (createError.message.includes('violates not-null constraint')) {
        try {
          // Execute a raw SQL query with all required fields
          const { error } = await adminSupabase.rpc('insert_admin', { 
            admin_id: authData.user.id,
            admin_name: name,
            admin_email: email.toLowerCase(),
            admin_role: role || 'admin',
            admin_password: 'managed-by-supabase-auth' // Temporary password to satisfy constraint
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          console.log('Admin record created using RPC function');
        } catch (altError) {
          console.error('Alternative approach also failed:', altError);
          console.log('Proceeding with auth token generation despite admin table insert failure');
        }
      } else {
        console.warn('Non-constraint error when creating admin record:', createError.message);
      }
    }
    
    // Sign in the user to get a session token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.error('Error signing in after registration:', signInError);
      // We still want to return success since the user was created
      res.status(201).json({
        id: authData.user.id,
        name,
        email,
        role: role || 'admin',
        message: 'Admin user created successfully, but automatic login failed. Please log in manually.'
      });
      return;
    }
    
    // Return admin details with the token
    res.status(201).json({
      id: authData.user.id,
      name,
      email,
      role: role || 'admin',
      token: signInData.session.access_token,
      message: 'Admin user created and logged in successfully'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

/**
 * @desc    Get admin profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getAdminProfile = async (req, res, next) => {
  try {
    // req.user is set in authMiddleware
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }
    
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  registerAdmin,
  getAdminProfile,
}; 