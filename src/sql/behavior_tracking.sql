-- ১. উইশলিস্ট (Wishlist) টেবিল তৈরি
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- ২. প্রোডাক্ট ভিউ (Product Views) টেবিল তৈরি (ইউজার বিহেভিয়ার ট্র্যাক করার জন্য)
CREATE TABLE IF NOT EXISTS product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE, -- নাল হতে পারে যদি গেস্ট ইউজার হয়
  product_id UUID REFERENCES products ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ৩. RLS চালু করা
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- ৪. উইশলিস্ট পলিসি
CREATE POLICY "Users can manage own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- ৫. প্রোডাক্ট ভিউ পলিসি
CREATE POLICY "Anyone can insert views" ON product_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all stats" ON product_views
  FOR SELECT USING (true); -- এনালাইসিসের জন্য পাবলিক রিড রাখা হলো
