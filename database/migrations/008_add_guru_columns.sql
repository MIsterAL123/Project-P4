-- Migration: Add missing columns to guru table
-- Required for complete registration form data
-- Run: mysql -u root -p p4_jakarta < database/migrations/008_add_guru_columns.sql

-- Add no_hp column if not exists
SET @dbname = DATABASE();
SET @tablename = 'guru';
SET @columnname = 'no_hp';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE guru ADD COLUMN no_hp VARCHAR(20) NULL AFTER link_dokumen'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add sekolah_asal column if not exists
SET @columnname = 'sekolah_asal';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE guru ADD COLUMN sekolah_asal VARCHAR(255) NULL AFTER no_hp'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add mata_pelajaran column if not exists
SET @columnname = 'mata_pelajaran';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE guru ADD COLUMN mata_pelajaran VARCHAR(255) NULL AFTER sekolah_asal'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add indexes for search optimization (ignore error if exists)
-- CREATE INDEX idx_guru_sekolah ON guru(sekolah_asal);
-- CREATE INDEX idx_guru_mapel ON guru(mata_pelajaran);
