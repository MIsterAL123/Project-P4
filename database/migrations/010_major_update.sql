-- =====================================================
-- MIGRATION 010: Major Website Update
-- P4 Jakarta Website
-- Date: 2026-01-23
-- =====================================================

USE P4;

-- =====================================================
-- 1. UPDATE TABLE: kuota_p4 - Add new columns for pelatihan
-- =====================================================
ALTER TABLE kuota_p4 
ADD COLUMN judul_pelatihan VARCHAR(255) NOT NULL DEFAULT 'Program P4' AFTER id,
ADD COLUMN waktu_pelatihan VARCHAR(100) NULL AFTER judul_pelatihan,
ADD COLUMN tanggal_mulai DATE NULL AFTER waktu_pelatihan,
ADD COLUMN tanggal_selesai DATE NULL AFTER tanggal_mulai,
ADD COLUMN target_peserta ENUM('peserta', 'guru', 'semua') DEFAULT 'semua' AFTER tanggal_selesai,
ADD COLUMN deskripsi TEXT NULL AFTER target_peserta,
ADD COLUMN guru_terdaftar INT DEFAULT 0 AFTER peserta_terdaftar;

-- Rename tahun_ajaran to keep backwards compatibility (optional)
-- ALTER TABLE kuota_p4 CHANGE tahun_ajaran periode VARCHAR(50);

-- =====================================================
-- 2. CREATE TABLE: articles - For homepage articles
-- =====================================================
CREATE TABLE IF NOT EXISTS articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT NULL,
    featured_image VARCHAR(500) NULL,
    author_id INT NOT NULL,
    status ENUM('draft', 'published') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admin(id) ON DELETE CASCADE,
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CREATE TABLE: pendaftaran_guru_p4 - Guru registration for pelatihan
-- =====================================================
CREATE TABLE IF NOT EXISTS pendaftaran_guru_p4 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guru_id INT NOT NULL,
    kuota_id INT NOT NULL,
    nomor_urut INT NOT NULL,
    surat_tugas VARCHAR(500) NULL,
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected', 'registered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE,
    FOREIGN KEY (kuota_id) REFERENCES kuota_p4(id) ON DELETE CASCADE,
    UNIQUE KEY unique_guru_kuota (guru_id, kuota_id),
    INDEX idx_nomor_urut (nomor_urut),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. Add columns to track yearly registration limits
-- =====================================================
-- We'll track registration count programmatically by counting registrations in current year

-- =====================================================
-- 5. Update admin table for phone and active status
-- =====================================================
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS no_hp VARCHAR(20) NULL AFTER added_by,
ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1 AFTER no_hp;

-- =====================================================
-- END OF MIGRATION 010
-- =====================================================
