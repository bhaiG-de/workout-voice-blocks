# Setting Up Authentication in Supabase

This guide will walk you through the steps to set up user authentication for the Workout Voice Blocks application.

## Prerequisites

- Access to your Supabase project dashboard
- Basic understanding of SQL and database management

## Steps to Set Up Authentication

### 1. Enable Authentication in Supabase

1. Go to your Supabase project dashboard
2. Navigate to the "Authentication" section in the sidebar
3. Under "Providers", ensure that "Email" is enabled
4. Configure your authentication settings:
   - Set the Site URL to your application's URL
   - Configure email templates if needed
   - Set up any additional security settings

### 2. Run the Database Migration

The migration script (`supabase/migrations/20240303_add_user_auth.sql`) will:

- Add a `user_id` column to the `workouts` table
- Create an index for faster queries
- Set up Row Level Security (RLS) policies to restrict access to data
- Enable Row Level Security on the tables

You can run this migration in one of two ways:

#### Option 1: Using the Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" section
3. Create a new query
4. Copy and paste the contents of the migration file
5. Run the query

#### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

### 3. Test Authentication

After setting up authentication:

1. Register a new user through your application
2. Verify that the user can only access their own workouts
3. Test that Row Level Security is working correctly by trying to access data from another user

## Row Level Security Policies

The migration sets up the following policies:

### Workouts Table

- Users can view, insert, and update only their own workouts
- Workouts with `NULL` user_id are accessible to all users (for backward compatibility)

### Blocks Table

- Users can view, insert, and update blocks only if they belong to their own workouts
- Blocks from workouts with `NULL` user_id are accessible to all users

## Troubleshooting

If you encounter issues:

1. Check that Row Level Security is enabled on both tables
2. Verify that the policies are correctly created
3. Test queries directly in the SQL Editor to ensure they work as expected
4. Check the Supabase logs for any authentication errors

## Additional Resources

- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signin) 