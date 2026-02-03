-- Migration: Update pendaftaran_p4 status enum to support approval workflow
-- Date: 2026-02-03
-- Description: Add 'pending', 'approved', 'rejected' to pendaftaran_p4.status enum

ALTER TABLE pendaftaran_p4 
MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'registered', 'cancelled') DEFAULT 'registered';
