# PERMINTAAN PERUBAHAN BESAR WEBSITE P4 JAKARTA TIMUR

## 1. HALAMAN UTAMA (BERANDA)
- Tampilkan artikel/artikel tentang P4 Jakarta Timur yang dapat ditulis dan dikelola langsung oleh admin melalui dashboard admin.
- Bagian "Program" diubah menjadi "Pelatihan". Tampilkan daftar pelatihan dalam bentuk tabel dengan kolom:
  - Judul Pelatihan
  - Tanggal Pelatihan (dari tanggal berapa sampai tanggal berapa)
  - Waktu Mulai
  - Kuota Tersedia
  - Target Peserta (Murid atau Tenaga Kependidikan)
  - Tombol "Daftar" (hanya muncul jika kuota masih tersedia dan user belum melebihi batas pendaftaran)
- Data pelatihan diambil dari data yang dibuat admin, dan update secara real-time.
- Bagian "Hubungi Kami": Hilangkan fitur/form kirim pesan, cukup tampilkan informasi kontak saja.

## 2. DASHBOARD MURID
- Hilangkan/matikan fitur "Kursus Saya" karena tidak digunakan.
- Pada halaman "Daftar P4", tampilkan semua kuota pelatihan P4 yang dibuat admin.
- Batasi: Dalam 1 tahun, murid hanya bisa mendaftar maksimal 3 kali pelatihan P4. Jika sudah 3x, tombol daftar dinonaktifkan.
- Tampilkan riwayat pendaftaran pelatihan yang pernah diikuti murid.

## 3. DASHBOARD GURU
- Ubah semua label "Guru" menjadi "Pendidik/Tenaga Kependidikan".
- Hilangkan/matikan fitur "Materi" dan "Peserta Didik".
- Buat halaman pendaftaran pelatihan seperti murid, sehingga guru juga bisa mendaftar pelatihan P4 yang dibuat admin.
- Saat guru mendaftar mengikuti pelatihan P4, guru wajib mengupload surat tugas sebagai syarat pendaftaran.
- Batasi: Dalam 1 tahun, guru hanya bisa mendaftar maksimal 3 kali pelatihan P4. Jika sudah 3x, tombol daftar dinonaktifkan.
- Tampilkan riwayat pendaftaran pelatihan yang pernah diikuti guru.

## 4. DASHBOARD ADMIN
- Pada "Kelola Kuota Pendaftaran P4", saat menambah kuota, form harus berisi:
  - Judul Pelatihan
  - Waktu Pelatihan
  - Tanggal Mulai
  - Kuota Tersedia
  - Target Peserta (Murid atau Tenaga Kependidikan)
- Perbaiki fitur "Kelola Admin" yang error/tidak bisa menambah admin baru.
- Pada "Kelola Peserta", tampilkan data peserta dan guru yang mendaftar pelatihan, sesuai format baru.
- Pada "Pendaftaran P4", sesuaikan dengan format baru pelatihan dan pendaftaran.
- Perbaiki halaman "Laporan" agar menampilkan data yang benar dan sesuai dengan data pendaftaran pelatihan.
- Tambahkan halaman khusus agar admin bisa menulis, mengedit, dan menghapus artikel tentang P4 yang akan ditampilkan di halaman utama.

## 5. UMUM & RESPONSIVITAS
- Pastikan seluruh halaman dan fitur responsive di semua device, terutama di HP/smartphone.
- Perbaiki semua bug dan error yang ada di seluruh sistem.
- Pastikan validasi data berjalan dengan baik (misal: pembatasan pendaftaran 3x/tahun, validasi form, dsb).
- Pastikan tampilan UI/UX konsisten, modern, dan mudah digunakan.

## 6. PENAMBAHAN (JIKA DIPERLUKAN)
- Tambahkan fitur pencarian dan filter pada daftar pelatihan.
- Tambahkan notifikasi (misal: jika pendaftaran berhasil/gagal, kuota penuh, dsb).
- Pastikan keamanan data (validasi input, proteksi akses, dsb).
- Dokumentasikan perubahan dan update README jika ada perubahan besar pada struktur atau penggunaan aplikasi.
