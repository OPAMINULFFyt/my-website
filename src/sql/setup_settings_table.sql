-- ১. সেটিংস টেবিল তৈরি করা (যদি না থাকে)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ২. ডিফল্ট সেটিংস ডাটা ইনসার্ট করা (যদি আগে থেকে না থাকে)
INSERT INTO settings (key, value)
VALUES 
    ('site_name', 'OP AMINUL FF'),
    ('site_logo', ''),
    ('whatsapp', '+8801XXXXXXXXX'),
    ('telegram', '@username'),
    ('facebook', ''),
    ('youtube', ''),
    ('bkash', '01XXXXXXXXX'),
    ('nagad', '01XXXXXXXXX'),
    ('maintenance_mode', 'false'),
    ('review_points', '50'),
    ('global_announcement', 'Welcome to our new marketplace! Use code CYBER20 for 20% off.')
ON CONFLICT (key) DO NOTHING;

-- ৩. RLS (Row Level Security) পলিসি সেট করা
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- সবাই সেটিংস দেখতে পারবে (Public Read)
CREATE POLICY "Allow public read access on settings"
ON settings FOR SELECT
TO public
USING (true);

-- শুধুমাত্র অ্যাডমিন/ওনার/ডেভলপাররা সেটিংস আপডেট করতে পারবে
CREATE POLICY "Allow admin/owner/dev to update settings"
ON settings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin', 'developer')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin', 'developer')
    )
);

-- ৪. অটোমেটিক updated_at আপডেট করার জন্য ট্রিগার (ঐচ্ছিক কিন্তু ভালো)
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION update_settings_updated_at();
