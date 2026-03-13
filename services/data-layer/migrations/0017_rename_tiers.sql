-- Rename tier values: free -> creator, pro -> growth
UPDATE users SET tier = 'creator' WHERE tier = 'free';
UPDATE users SET tier = 'growth' WHERE tier = 'pro';
