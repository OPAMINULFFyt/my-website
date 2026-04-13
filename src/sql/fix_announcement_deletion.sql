-- Announcements টেবিলের জন্য ডিলিট এবং ম্যানেজমেন্ট পলিসি ফিক্স
-- এই কোডটি Supabase SQL Editor-এ রান করুন

-- ১. আগের সব পলিসি ডিলিট করা (যাতে কোনো কনফ্লিক্ট না থাকে)
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Admins and Owners can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;

-- ২. সাধারণ ইউজারদের জন্য শুধু অ্যাক্টিভ অ্যানাউন্সমেন্ট দেখার পারমিশন
CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT 
  USING (is_active = true);

-- ৩. অ্যাডমিন, ওনার এবং ডেভেলপারদের জন্য পূর্ণাঙ্গ পারমিশন (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Staff can manage announcements" ON announcements
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner', 'developer')
    )
  );

-- ৪. নিশ্চিত করা যে RLS এনাবল আছে
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
