-- Seed kuota awal
-- P4 Jakarta - Kuota Seeder

USE P4;

-- Insert initial kuota for current year
INSERT INTO kuota_p4 (tahun_ajaran, max_peserta, peserta_terdaftar, status) VALUES 
('2025/2026', 50, 0, 'open');

-- Verification
SELECT * FROM kuota_p4;