-- Add status column to followRequest table
ALTER TABLE followRequest ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected'));

-- Migrate existing follow requests to 'approved' status
-- (existing requests were auto-approved in the previous system)
UPDATE followRequest SET status = 'approved' WHERE status = 'pending';
