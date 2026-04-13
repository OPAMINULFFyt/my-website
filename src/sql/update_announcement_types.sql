-- announcements টেবিলের টাইপ কনস্ট্রেইনট (Check Constraint) আপডেট করা
-- UI তে ব্যবহৃত টাইপগুলোর সাথে সামঞ্জস্যপূর্ণ করা হচ্ছে

-- আগের কনস্ট্রেইনট ড্রপ করা
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_type_check;

-- নতুন কনস্ট্রেইনট যোগ করা (info, warning, success, danger)
ALTER TABLE announcements ADD CONSTRAINT announcements_type_check 
  CHECK (type IN ('info', 'warning', 'success', 'danger'));
