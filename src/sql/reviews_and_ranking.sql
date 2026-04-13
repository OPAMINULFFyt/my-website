-- ১. প্রোফাইল টেবিল আপডেট (Points যোগ করা হয়েছে)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- ২. রিভিউ টেবিল তৈরি
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, product_id) -- একজন ইউজার একটি প্রোডাক্টে একবারই রিভিউ দিতে পারবে
);

-- ৩. RLS চালু করা
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ৪. রিভিউ পলিসি
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage reviews" ON reviews FOR ALL USING (is_admin());

-- ৫. প্রোফাইল পাবলিক রিড পলিসি (যাতে র‍্যাঙ্কিং দেখা যায়)
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);

-- ৬. অটোমেটিক পয়েন্ট আপডেট ফাংশন (অর্ডার অ্যাপ্রুভ হলে পয়েন্ট বাড়বে)
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE profiles 
    SET points = points + 100 -- প্রতিটি সফল অর্ডারে ১০০ পয়েন্ট
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_approved ON orders;
CREATE TRIGGER on_order_approved
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_user_points();
