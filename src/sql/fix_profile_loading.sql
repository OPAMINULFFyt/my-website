-- ১. Profiles টেবিল সবার জন্য দেখার অনুমতি দেওয়া (যাতে প্রোফাইল পেজ লোড হয়)
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable" ON profiles 
  FOR SELECT USING (true);

-- ২. Orders টেবিলের জন্য পলিসি আপডেট: 
-- সবাই অনুমোদিত (approved) অর্ডারগুলো দেখতে পারবে (যাতে প্রোফাইলে 'Assets Owned' দেখা যায়)
-- কিন্তু নিজের অর্ডার সব স্ট্যাটাসেই দেখতে পারবে
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR status = 'approved');

-- ৩. অ্যাডমিন এবং ওনারদের জন্য সব অর্ডার দেখার অনুমতি (আগের পলিসি বজায় রাখা বা আপডেট করা)
DROP POLICY IF EXISTS "Admins and Owners can manage orders" ON orders;
CREATE POLICY "Admins and Owners can manage orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- ৪. প্রোফাইল আপডেটের জন্য পলিসি (নিজেরটা নিজে আপডেট করতে পারবে)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
