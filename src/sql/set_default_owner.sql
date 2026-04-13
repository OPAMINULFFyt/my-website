-- ১. নির্দিষ্ট ইউজারকে (ID: 19554fd8-f748-417a-bcb8-36a1f48254fd) ডিফল্ট 'owner' হিসেবে সেট করা
UPDATE profiles 
SET role = 'owner' 
WHERE id = '19554fd8-f748-417a-bcb8-36a1f48254fd';

-- ২. সিকিউরিটি পলিসি আপডেট: শুধুমাত্র 'owner' অন্য কাউকে 'owner' বা 'admin' বানাতে পারবে
-- এটি আমরা অ্যাপ লেভেলে (AdminUsers.tsx) অলরেডি হ্যান্ডেল করেছি।
-- ডাটাবেস লেভেলে আরও সিকিউর করার জন্য একটি ফাংশন এবং ট্রিগার যোগ করা যেতে পারে।

CREATE OR REPLACE FUNCTION check_role_update_permission()
RETURNS TRIGGER AS $$
BEGIN
  -- যদি রোল পরিবর্তন করা হয়
  IF OLD.role <> NEW.role THEN
    -- চেক করা হচ্ছে যে রিকোয়েস্টকারী নিজে 'owner' কিনা
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'owner'
    ) THEN
      -- যদি রিকোয়েস্টকারী 'owner' না হয় এবং সে কাউকে 'admin' বা 'owner' বানাতে চায়
      IF NEW.role IN ('admin', 'owner') THEN
        RAISE EXCEPTION 'Only a SYSTEM_OWNER can assign ADMIN or OWNER roles.';
      END IF;
      
      -- অ্যাডমিনরা শুধু 'user' বা 'developer' সেট করতে পারবে, কিন্তু অন্য অ্যাডমিনকে পরিবর্তন করতে পারবে না
      IF OLD.role IN ('admin', 'owner') AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner') THEN
         RAISE EXCEPTION 'Insufficient permissions to modify this role.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_role_permission ON profiles;
CREATE TRIGGER ensure_role_permission
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_role_update_permission();
