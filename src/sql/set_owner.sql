-- Update the role of the specified user to 'owner'
UPDATE profiles
SET role = 'owner'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'mr.personal01939@gmail.com'
);

-- Ensure the user has the necessary permissions (if any specific ones are needed for owner)
-- For example, if there's an admins table or similar.
