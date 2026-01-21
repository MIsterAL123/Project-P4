-- Migration: Add missing columns to peserta table
-- Required for complete registration form data
-- Run: mysql -u root -p p4_jakarta < database/migrations/007_add_peserta_columns.sql

-- Add no_hp column if not exists
SET @dbname = DATABASE();
SET @tablename = 'peserta';
SET @columnname = 'no_hp';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE peserta ADD COLUMN no_hp VARCHAR(20) NULL AFTER link_dokumen'
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
  'ALTER TABLE peserta ADD COLUMN sekolah_asal VARCHAR(255) NULL AFTER no_hp'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add kelas column if not exists
SET @columnname = 'kelas';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE peserta ADD COLUMN kelas VARCHAR(20) NULL AFTER sekolah_asal'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for search optimization (ignore error if exists)
-- CREATE INDEX idx_peserta_sekolah ON peserta(sekolah_asal);
