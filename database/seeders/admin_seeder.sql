-- Seed admin pertama
-- P4 Jakarta - Admin Seeder
-- Password: admin123 (hashed with bcrypt)

USE P4;

-- Insert first admin user
INSERT INTO users (nama, email, password, role) VALUES 
('Super Admin', 'admin@p4.jakarta.go.id', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Get the user_id and insert into admin table
INSERT INTO admin (user_id, added_by) VALUES 
((SELECT id FROM users WHERE email = 'admin@p4.jakarta.go.id'), NULL);

-- Verification
SELECT u.id, u.nama, u.email, u.role, a.id as admin_id 
FROM users u 
JOIN admin a ON u.id = a.user_id 
WHERE u.role = 'admin';