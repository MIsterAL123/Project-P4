-- =====================================================
-- P4 Jakarta Website - Complete Database Schema
-- Version: 2.1 (Fully Analyzed from Models)
-- Generated: January 27, 2026
-- 
-- CARA IMPORT:
-- 1. Buka MySQL/phpMyAdmin/HeidiSQL
-- 2. Jalankan script ini atau import file ini
-- 3. Password default admin: admin123
--
-- CATATAN: Script ini sudah dianalisis dari semua file model
-- untuk memastikan semua kolom yang dibutuhkan tersedia
-- =====================================================

-- Drop database if exists (HATI-HATI: ini akan menghapus semua data!)
DROP DATABASE IF EXISTS P4;

-- Create database
CREATE DATABASE P4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE P4;

-- =====================================================
-- TABLE: users
-- Description: Tabel utama untuk semua user (admin, guru, peserta)
-- Used by: User.js, Admin.js, Guru.js, Peserta.js
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'guru', 'peserta') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: admin
-- Description: Data tambahan untuk admin
-- Used by: Admin.js
-- Columns: user_id, added_by, no_hp, is_active
-- =====================================================
CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    added_by INT NULL,
    no_hp VARCHAR(20) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES admin(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: guru
-- Description: Data tambahan untuk guru dengan sistem approval
-- Used by: Guru.js
-- Columns: user_id, nip, link_dokumen, no_hp, sekolah_asal, 
--          mata_pelajaran, status, verified_by, verified_at, rejection_reason
-- =====================================================
CREATE TABLE guru (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nip VARCHAR(20) NOT NULL UNIQUE,
    link_dokumen VARCHAR(500) NULL,
    no_hp VARCHAR(20) NULL,
    sekolah_asal VARCHAR(255) NULL,
    mata_pelajaran VARCHAR(255) NULL,
    status ENUM('pending', 'active', 'reject') DEFAULT 'pending',
    verified_by INT NULL,
    verified_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES admin(id) ON DELETE SET NULL,
    INDEX idx_nip (nip),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: peserta
-- Description: Data tambahan untuk peserta
-- Used by: Peserta.js
-- Columns: user_id, nik, link_dokumen, no_hp, sekolah_asal, kelas
-- =====================================================
CREATE TABLE peserta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nik VARCHAR(16) NOT NULL UNIQUE,
    link_dokumen VARCHAR(500) NULL,
    no_hp VARCHAR(20) NULL,
    sekolah_asal VARCHAR(255) NULL,
    kelas VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_nik (nik)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: kuota_p4
-- Description: Manajemen kuota pendaftaran P4 (Program Pelatihan)
-- Used by: KuotaP4.js, PendaftaranP4.js, PendaftaranGuruP4.js
-- Columns: judul_pelatihan, waktu_pelatihan, tanggal_mulai, tanggal_selesai,
--          target_peserta, deskripsi, tahun_ajaran, max_peserta, 
--          peserta_terdaftar, guru_terdaftar, status
-- =====================================================
CREATE TABLE kuota_p4 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul_pelatihan VARCHAR(255) NOT NULL DEFAULT 'Program P4',
    waktu_pelatihan VARCHAR(100) NULL,
    tanggal_mulai DATE NULL,
    tanggal_selesai DATE NULL,
    target_peserta ENUM('peserta', 'guru', 'semua') DEFAULT 'semua',
    deskripsi TEXT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL,
    max_peserta INT DEFAULT 50,
    peserta_terdaftar INT DEFAULT 0,
    guru_terdaftar INT DEFAULT 0,
    status ENUM('open', 'closed', 'full') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tahun (tahun_ajaran),
    INDEX idx_status (status),
    INDEX idx_target (target_peserta),
    INDEX idx_tanggal_mulai (tanggal_mulai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: pendaftaran_p4
-- Description: Data pendaftaran peserta ke program P4
-- Used by: PendaftaranP4.js
-- Columns: peserta_id, kuota_id, nomor_urut, tanggal_daftar, status
-- =====================================================
CREATE TABLE pendaftaran_p4 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    peserta_id INT NOT NULL,
    kuota_id INT NOT NULL,
    nomor_urut INT NOT NULL,
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected', 'registered', 'cancelled') DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (peserta_id) REFERENCES peserta(id) ON DELETE CASCADE,
    FOREIGN KEY (kuota_id) REFERENCES kuota_p4(id) ON DELETE CASCADE,
    UNIQUE KEY unique_peserta_kuota (peserta_id, kuota_id),
    INDEX idx_nomor_urut (nomor_urut),
    INDEX idx_status (status),
    INDEX idx_tanggal_daftar (tanggal_daftar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: pendaftaran_guru_p4
-- Description: Data pendaftaran guru ke program P4
-- Used by: PendaftaranGuruP4.js
-- Columns: guru_id, kuota_id, nomor_urut, surat_tugas, tanggal_daftar, status
-- =====================================================
CREATE TABLE pendaftaran_guru_p4 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guru_id INT NOT NULL,
    kuota_id INT NOT NULL,
    nomor_urut INT NOT NULL,
    surat_tugas VARCHAR(500) NULL,
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected', 'registered', 'cancelled') DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE,
    FOREIGN KEY (kuota_id) REFERENCES kuota_p4(id) ON DELETE CASCADE,
    UNIQUE KEY unique_guru_kuota (guru_id, kuota_id),
    INDEX idx_nomor_urut (nomor_urut),
    INDEX idx_status (status),
    INDEX idx_tanggal_daftar (tanggal_daftar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: articles
-- Description: Artikel untuk homepage
-- Used by: Article.js
-- Columns: title, slug, content, excerpt, featured_image, 
--          author_id, status, published_at
-- =====================================================
CREATE TABLE articles (
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
-- TABLE: materials
-- Description: Materi pembelajaran yang diupload guru
-- Used by: Material.js
-- Columns: guru_id, title, description, file_path, file_type
-- =====================================================
CREATE TABLE materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guru_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE,
    INDEX idx_guru_id (guru_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: activity_log
-- Description: Log aktivitas user
-- Columns: user_id, action, description, ip_address, user_agent
-- =====================================================
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEEDER DATA
-- =====================================================

-- Insert Super Admin (password: 12345678)
-- Hash dibuat dengan bcrypt salt rounds 10
INSERT INTO users (nama, email, password, role) VALUES 
('Super Admin', 'admin@p4.jakarta.go.id', '$2b$10$kOmrzOPQNe.PedS2dvGdgu4m36t8MLeLhWiQMrRBkAdGikzD/q/SK', 'admin');

INSERT INTO admin (user_id, added_by, no_hp, is_active) VALUES 
((SELECT id FROM users WHERE email = 'admin@p4.jakarta.go.id'), NULL, NULL, 1);

-- Insert initial kuota for current year 2025/2026
INSERT INTO kuota_p4 (
    judul_pelatihan, 
    waktu_pelatihan,
    tanggal_mulai,
    tanggal_selesai,
    target_peserta,
    deskripsi,
    tahun_ajaran, 
    max_peserta, 
    peserta_terdaftar, 
    guru_terdaftar, 
    status
) VALUES (
    'Program Pelatihan P4 Tahun 2025/2026',
    '08:00 - 16:00 WIB',
    '2026-02-01',
    '2026-02-28',
    'semua',
    'Program Pelatihan P4 untuk peserta didik dan tenaga kependidikan Jakarta',
    '2025/2026', 
    50, 
    0, 
    0, 
    'open'
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables created
SELECT 'Database P4 berhasil dibuat!' AS status;

-- Show all tables
SHOW TABLES;

-- Verify admin created
SELECT u.id, u.nama, u.email, u.role, a.id as admin_id, a.is_active
FROM users u 
JOIN admin a ON u.id = a.user_id 
WHERE u.role = 'admin';

-- Verify kuota created
SELECT id, judul_pelatihan, tahun_ajaran, target_peserta, max_peserta, status FROM kuota_p4;

-- =====================================================
-- TABLE SUMMARY
-- =====================================================
-- 1. users          - Tabel utama user (admin, guru, peserta)
-- 2. admin          - Data tambahan admin (no_hp, is_active)
-- 3. guru           - Data guru (nip, no_hp, sekolah_asal, mata_pelajaran, status approval)
-- 4. peserta        - Data peserta (nik, no_hp, sekolah_asal, kelas)
-- 5. kuota_p4       - Manajemen kuota pelatihan
-- 6. pendaftaran_p4 - Pendaftaran peserta ke pelatihan
-- 7. pendaftaran_guru_p4 - Pendaftaran guru ke pelatihan
-- 8. articles       - Artikel homepage
-- 9. materials      - Materi pembelajaran
-- 10. activity_log  - Log aktivitas
-- =====================================================
