-- Migration: Update activity_log table with metadata column
-- Run: mysql -u root -p p4_jakarta < database/migrations/009_update_activity_log.sql

-- Create activity_log table if not exists
CREATE TABLE IF NOT EXISTS activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add metadata column if not exists
SET @dbname = DATABASE();
SET @tablename = 'activity_log';
SET @columnname = 'metadata';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE activity_log ADD COLUMN metadata JSON NULL AFTER description'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add indexes for performance (ignore if exists)
-- CREATE INDEX idx_activity_user ON activity_log(user_id);
-- CREATE INDEX idx_activity_action ON activity_log(action);
-- CREATE INDEX idx_activity_date ON activity_log(created_at);
