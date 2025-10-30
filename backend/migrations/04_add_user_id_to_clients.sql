-- Add user_id column to clients table
-- This creates a direct relationship between clients and users

ALTER TABLE clients
ADD COLUMN user_id INT NULL,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_clients_user_id ON clients(user_id);

-- Update existing clients to link with users based on email match
UPDATE clients c
INNER JOIN users u ON c.email = u.email
SET c.user_id = u.id
WHERE c.user_id IS NULL AND u.email IS NOT NULL AND u.email != '';

