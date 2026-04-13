-- Products টেবিলকে আরও অ্যাডভান্সড করার জন্য নতুন কলাম যোগ করা
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS demo_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
