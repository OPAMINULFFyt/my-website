-- ১. রিভিউ টেবিলের ফরেন কি (Foreign Key) আপডেট
-- user_id কে সরাসরি profiles টেবিলের সাথে লিঙ্ক করা হচ্ছে যাতে জয়েন (Join) সহজ হয়
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ২. ইনডেক্স তৈরি (পারফরম্যান্সের জন্য)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
