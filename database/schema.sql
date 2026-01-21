-- Complete database schema
-- P4 Jakarta Website - Database Schema
-- Version: 1.0 - Fase 1

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS P4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE P4;

-- =====================================================
-- TABLE: users
-- Description: Tabel utama untuk semua user (admin, guru, peserta)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
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
-- =====================================================
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    added_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES admin(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: guru
-- Description: Data tambahan untuk guru dengan sistem approval
-- =====================================================
CREATE TABLE IF NOT EXISTS guru (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nip VARCHAR(20) NOT NULL UNIQUE,
    link_dokumen VARCHAR(500),
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
-- =====================================================
CREATE TABLE IF NOT EXISTS peserta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nik VARCHAR(16) NOT NULL UNIQUE,
    link_dokumen VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_nik (nik)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: kuota_p4
-- Description: Manajemen kuota pendaftaran P4 (max 50 peserta)
-- =====================================================
CREATE TABLE IF NOT EXISTS kuota_p4 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tahun_ajaran VARCHAR(20) NOT NULL,
    max_peserta INT DEFAULT 50,
    peserta_terdaftar INT DEFAULT 0,
    status ENUM('open', 'closed', 'full') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tahun (tahun_ajaran),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: pendaftaran_p4
-- Description: Data pendaftaran peserta ke program P4
-- =====================================================
CREATE TABLE IF NOT EXISTS pendaftaran_p4 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    peserta_id INT NOT NULL,
    kuota_id INT NOT NULL,
    nomor_urut INT NOT NULL,
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'cancelled') DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (peserta_id) REFERENCES peserta(id) ON DELETE CASCADE,
    FOREIGN KEY (kuota_id) REFERENCES kuota_p4(id) ON DELETE CASCADE,
    UNIQUE KEY unique_peserta_kuota (peserta_id, kuota_id),
    INDEX idx_nomor_urut (nomor_urut),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: activity_log
-- Description: Log aktivitas user (optional)
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: materials
-- Description: Learning materials uploaded by gurus
-- =====================================================
CREATE TABLE IF NOT EXISTS materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guru_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TRIGGER: Update kuota status when full
-- =====================================================
DELIMITER //
CREATE TRIGGER update_kuota_status_after_insert
AFTER INSERT ON pendaftaran_p4
FOR EACH ROW
BEGIN
    UPDATE kuota_p4 
    SET peserta_terdaftar = peserta_terdaftar + 1,
        status = CASE 
            WHEN peserta_terdaftar + 1 >= max_peserta THEN 'full'
            ELSE status
        END
    WHERE id = NEW.kuota_id AND NEW.status = 'registered';
END//

CREATE TRIGGER update_kuota_status_after_cancel
AFTER UPDATE ON pendaftaran_p4
FOR EACH ROW
BEGIN
    IF OLD.status = 'registered' AND NEW.status = 'cancelled' THEN
        UPDATE kuota_p4 
        SET peserta_terdaftar = peserta_terdaftar - 1,
            status = CASE 
                WHEN status = 'full' THEN 'open'
                ELSE status
            END
        WHERE id = NEW.kuota_id;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- Initial Data: First Admin (password: admin123)
-- =====================================================
-- Note: Run this only once during initial setup
-- Password hash for 'admin123' using bcrypt