-- ১. system_logs টেবিলের ফরেন কি (Foreign Key) ফিক্স
-- admin_id কে profiles টেবিলের সাথে লিঙ্ক করা হচ্ছে যাতে Supabase জয়েন (Join) করতে পারে
ALTER TABLE system_logs DROP CONSTRAINT IF EXISTS system_logs_admin_id_fkey;
ALTER TABLE system_logs ADD CONSTRAINT system_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ২. announcements টেবিলের RLS পলিসি ফিক্স
-- বর্তমানে শুধু SELECT পলিসি আছে, তাই ডাটা সেভ হচ্ছিল না। 
-- এখন অ্যাডমিনদের জন্য সব পারমিশন (INSERT, UPDATE, DELETE) যোগ করা হচ্ছে।

-- আগের ভুল পলিসি ডিলিট করা (যদি থাকে)
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;

-- নতুন পূর্ণাঙ্গ ম্যানেজমেন্ট পলিসি
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL -- INSERT, UPDATE, DELETE সবকিছুর জন্য
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ৩. system_logs এর জন্য INSERT পলিসি যোগ করা
-- অ্যাডমিনরা যখন কোনো কাজ করবে তখন যাতে লগ সেভ হতে পারে
DROP POLICY IF EXISTS "Admins can insert logs" ON system_logs;
CREATE POLICY "Admins can insert logs" ON system_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'developer')
    )
  );
