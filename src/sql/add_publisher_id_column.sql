-- products টেবিলে publisher_id কলাম যোগ করা
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS publisher_id UUID REFERENCES profiles(id);

-- publisher_id এর জন্য ফরেন কি রিলেশনশিপ নিশ্চিত করা
-- (যদি আগে থেকে না থাকে তবে এটি রিলেশনশিপ তৈরি করবে)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_publisher_id_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_publisher_id_fkey 
    FOREIGN KEY (publisher_id) REFERENCES profiles(id);
  END IF;
END $$;

-- ইনডেক্স তৈরি করা যাতে সার্চিং ফাস্ট হয়
CREATE INDEX IF NOT EXISTS idx_products_publisher_id ON products(publisher_id);
