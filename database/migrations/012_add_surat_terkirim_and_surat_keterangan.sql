-- Migration: Add surat_terkirim status and surat_keterangan column
-- Date: 2026-02-25
-- Description:
-- 1) Add 'surat_terkirim' into status enum for pendaftaran_p4 and pendaftaran_guru_p4
-- 2) Ensure pendaftaran_p4 has surat_keterangan column
--
-- Notes:
-- - Do not hardcode database name (USE ...). Run this on the active DB from your environment.
-- - Avoid ADD COLUMN IF NOT EXISTS because it is not supported consistently in all MySQL setups.

ALTER TABLE pendaftaran_p4
MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'registered', 'surat_terkirim', 'cancelled') DEFAULT 'registered';

ALTER TABLE pendaftaran_guru_p4
MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'registered', 'surat_terkirim', 'cancelled') DEFAULT 'pending';

SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'pendaftaran_p4'
  AND column_name = 'surat_keterangan';

SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE pendaftaran_p4 ADD COLUMN surat_keterangan VARCHAR(500) NULL AFTER nomor_urut',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
