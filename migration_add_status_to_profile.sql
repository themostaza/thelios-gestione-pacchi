-- Migration: Add status column to profile table
-- This migration adds a status column to track user registration status

-- Add status column with default value 'pending'
ALTER TABLE profile 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;

-- Add check constraint to ensure valid status values
ALTER TABLE profile 
ADD CONSTRAINT profile_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'registered'));

-- Update existing profiles to have appropriate status
-- Profiles with user_id are considered 'registered'
UPDATE profile 
SET status = 'registered' 
WHERE user_id IS NOT NULL;

-- Profiles without user_id are considered 'pending'
UPDATE profile 
SET status = 'pending' 
WHERE user_id IS NULL;

-- Create index on status for better query performance
CREATE INDEX idx_profile_status ON profile(status);

-- Add comment to document the status column
COMMENT ON COLUMN profile.status IS 'User registration status: pending, approved, rejected, registered'; 