-- System Logs টেবিলের জন্য পারমিশন ফিক্স
-- এই কোডটি Supabase SQL Editor-এ রান করুন

-- ১. আগের পলিসি ডিলিট করা
DROP POLICY IF EXISTS "Admins can view logs" ON system_logs;
DROP POLICY IF EXISTS "Staff can view logs" ON system_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON system_logs;

-- ২. অ্যাডমিন, ওনার এবং ডেভেলপারদের জন্য দেখার পারমিশন (SELECT)
CREATE POLICY "Staff can view logs" ON system_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner', 'developer')
    )
  );

-- ৩. অ্যাডমিন এবং ডেভেলপারদের জন্য লগ ইনসার্ট করার পারমিশন
CREATE POLICY "Admins can insert logs" ON system_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner', 'developer')
    )
  );

-- ৪. নিশ্চিত করা যে RLS এনাবল আছে
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
