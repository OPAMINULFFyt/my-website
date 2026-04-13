-- ১. Profiles টেবিলের রোল চেক কনস্ট্রেইনট আপডেট করা (Owner যোগ করা)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'admin', 'developer', 'owner'));

-- ২. RLS পলিসিগুলো আপডেট করা (Owner, Admin, Developer এর জন্য আলাদা পারমিশন)

-- PRODUCTS টেবিল
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins and Devs can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'developer', 'owner'))
  );

-- ORDERS টেবিল
DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins and Owners can manage orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- ANNOUNCEMENTS টেবিল
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Admins and Owners can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- SYSTEM_LOGS টেবিল (সবাই দেখতে পারবে না, শুধু Admin/Dev/Owner)
DROP POLICY IF EXISTS "Admins can view logs" ON system_logs;
CREATE POLICY "Staff can view logs" ON system_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'developer', 'owner'))
  );

-- PROFILES টেবিল (রোল পরিবর্তন করার ক্ষমতা শুধু Owner এর থাকবে)
-- নোট: সাধারণ প্রোফাইল আপডেট সবাই করতে পারবে নিজেরটা, কিন্তু রোল পরিবর্তন চেক করতে হবে।
-- এখানে আমরা একটি ট্রিগার ব্যবহার করতে পারি অথবা অ্যাপ লেভেলে হ্যান্ডেল করতে পারি।
-- আপাতত RLS দিয়ে অ্যাডমিনদের ইউজার ম্যানেজমেন্ট পারমিশন দিচ্ছি।
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
CREATE POLICY "Admins and Owners can manage profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );
