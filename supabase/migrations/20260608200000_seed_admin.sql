-- ===== SEED INITIAL ADMIN CREDENTIALS =====
-- This migration inserts a default user for development access.

-- Insert user into auth.users (ID is generated, password is 'admin123' hashed)
-- Note: The password hash below is for 'admin123' using Supabase's standard Blowfish/BCrypt
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@paperflow.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    NULL,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"System Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (email) DO NOTHING;

-- The trigger 'on_auth_user_created' we created earlier will automatically 
-- insert the profile into public.user_profiles when this migration runs.
