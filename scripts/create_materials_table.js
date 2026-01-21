const { query } = require('../src/config/database');

(async () => {
  try {
    await query(`CREATE TABLE IF NOT EXISTS materials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guru_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
    console.log('materials table created');
  } catch (err) {
    console.error('create error', err.message);
  } finally {
    process.exit();
  }
})();