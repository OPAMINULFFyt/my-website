-- Add new profile customization fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS telegram_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Update RLS if necessary (usually profiles are already open for owners to update)
-- Assuming existing policy: "Users can update own profile"
