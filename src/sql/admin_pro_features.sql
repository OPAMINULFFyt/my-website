-- ১. সিস্টেম লগ (System Logs) টেবিল তৈরি
-- অ্যাডমিনদের অ্যাকশন ট্র্যাক করার জন্য
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ২. অ্যানাউন্সমেন্ট (Announcements) টেবিল তৈরি
-- সাইট-ওয়াইড মেসেজ দেখানোর জন্য
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, warning, success, danger
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ৩. প্রোফাইল টেবিলে ব্যান স্ট্যাটাস যোগ করা
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- ৪. প্রোডাক্ট টেবিলে ফিচারড এবং স্টক স্ট্যাটাস যোগ করা
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock'; -- in_stock, out_of_stock, pre_order

-- ৫. আরএলএস (RLS) পলিসি
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- সিস্টেম লগ শুধুমাত্র অ্যাডমিনরা দেখতে পারবে
CREATE POLICY "Admins can view logs" ON system_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- অ্যানাউন্সমেন্ট সবাই দেখতে পারবে কিন্তু শুধু অ্যাডমিনরা ম্যানেজ করবে
CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
