// Script untuk membuat data kuota P4 default
const { query } = require('./src/config/database');

async function createDefaultKuota() {
  try {
    console.log('Creating default kuota P4...');

    // Check if kuota already exists for current year
    const currentYear = new Date().getFullYear();
    const tahunAjaran = `${currentYear}/${currentYear + 1}`;

    const existingKuota = await query(
      'SELECT * FROM kuota_p4 WHERE tahun_ajaran = ?',
      [tahunAjaran]
    );

    if (existingKuota.length > 0) {
      console.log('✅ Kuota for', tahunAjaran, 'already exists');
      return;
    }

    // Create new kuota
    const kuotaSql = `
      INSERT INTO kuota_p4 (tahun_ajaran, max_peserta, peserta_terdaftar, status) 
      VALUES (?, ?, ?, ?)
    `;

    await query(kuotaSql, [
      tahunAjaran,
      50, // max kuota
      0,  // jumlah terdaftar
      'open'
    ]);

    console.log('✅ Default kuota created successfully!');
    console.log('📅 Tahun Ajaran:', tahunAjaran);
    console.log('👥 Kuota:', 50);
    console.log('📊 Status: open');

  } catch (error) {
    console.error('❌ Error creating kuota:', error.message);
    console.error('Full error:', error);
  }
}

createDefaultKuota();