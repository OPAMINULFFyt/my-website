-- ১. প্রোডাক্ট টেবিলে টিউটোরিয়াল ভিডিও ইউআরএল (tutorial_url) যোগ করা
ALTER TABLE products ADD COLUMN IF NOT EXISTS tutorial_url TEXT;

-- ২. কমেন্ট যোগ করা (ঐচ্ছিক, বোঝার সুবিধার্থে)
COMMENT ON COLUMN products.tutorial_url IS 'Optional video tutorial link for files or hardware kits';
