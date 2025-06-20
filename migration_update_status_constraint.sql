-- Migration: Update status constraint to include reset_password
-- This migration updates the existing status column constraint

-- First, drop the existing constraint if it exists
ALTER TABLE profile 
DROP CONSTRAINT IF EXISTS profile_status_check;

-- Add the new constraint with reset_password included
ALTER TABLE profile 
ADD CONSTRAINT profile_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'registered', 'reset_password'));

-- Update the comment to include reset_password
COMMENT ON COLUMN profile.status IS 'User registration status: pending, approved, rejected, registered, reset_password';

-- Verify the constraint is working
-- This will fail if there are any invalid status values
SELECT DISTINCT status FROM profile WHERE status NOT IN ('pending', 'approved', 'rejected', 'registered', 'reset_password'); 