# 📋 Product Requirements Document (PRD)
# Website P4 Jakarta - Fase 2: Bug Fixing & Complete Integration

---

## 📊 Document Information

| Item | Detail |
|------|--------|
| **Project Name** | Website P4 Jakarta - Fase 2 |
| **Version** | 2.0 |
| **Date** | Januari 2026 |
| **Status** | Planning |
| **Owner** | Tim Development P4 |
| **Based On** | Analisis Bug & Issues dari Fase 1 |

---

## 🎯 Executive Summary

Fase 2 berfokus pada **perbaikan bug kritis, integrasi database-frontend yang belum tersambung, responsivitas UI, dan memfungsikan semua tombol/fitur yang belum bekerja**. Dokumen ini disusun berdasarkan hasil analisis mendalam terhadap seluruh codebase yang mengidentifikasi **49 issues** yang terbagi dalam berbagai kategori prioritas.

---

## 📈 Summary Hasil Analisis Fase 1

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Bugs | 5 | 2 | 3 | 0 | **10** |
| DB-Frontend Disconnect | 2 | 2 | 1 | 0 | **5** |
| Non-working Features | 0 | 3 | 4 | 1 | **8** |
| Responsiveness | 0 | 1 | 2 | 1 | **4** |
| Missing Features | 0 | 2 | 4 | 2 | **8** |
| Security | 0 | 2 | 3 | 1 | **6** |
| Error Handling | 0 | 2 | 2 | 0 | **4** |
| UI/UX | 0 | 0 | 3 | 1 | **4** |
| **Total** | **7** | **14** | **22** | **6** | **49** |

---

## 🎪 Project Scope - Fase 2

### ✅ In Scope (Harus Selesai)

1. **Bug Fixing - Critical & High Priority**
   - Fix semua bugs yang teridentifikasi
   - Perbaikan database schema
   - Perbaikan koneksi DB-Frontend

2. **Button & Feature Functionality**
   - Semua tombol harus berfungsi
   - Semua form harus terintegrasi dengan backend
   - Konfirmasi delete/approve/reject bekerja

3. **Responsive Design**
   - Mobile-friendly untuk semua halaman
   - Tablet optimization
   - Sidebar toggle yang smooth

4. **Security Enhancement**
   - Rate limiting
   - CSRF protection
   - Environment validation
   - Fix file upload security

5. **Error Handling**
   - Proper API error responses
   - User-friendly error messages
   - Database connection handling

6. **Missing Features from Fase 1**
   - Activity logging
   - Forgot password (basic)
   - Terms & Privacy pages
   - Contact form handler

### ❌ Out of Scope (Fase Selanjutnya)
- Payment gateway
- Advanced email notifications
- Learning Management System (LMS)
- Mobile application
- Third-party API integration
- Advanced reporting dengan charts

---

## 🐛 SPRINT 1: Critical Bug Fixes (Week 1)

### 1.1 Fix Peserta Dashboard NISN Reference
**File**: `src/views/peserta/dashboard.ejs`
**Problem**: View memanggil `user.nisn` tapi field tersebut tidak ada di session user
**Solution**: 
```ejs
<!-- BEFORE (BUG) -->
<p class="text-sm text-gray-500">NISN: <%= user.nisn %></p>

<!-- AFTER (FIX) -->
<p class="text-sm text-gray-500">NIK: <%= currentUser.pesertaDetail?.nik || '-' %></p>
```
**Impact**: Peserta bisa melihat NIK mereka dengan benar

---

### 1.2 Fix Pendaftaran Status Check
**File**: `src/views/peserta/dashboard.ejs`
**Problem**: View menggunakan status `approved`, `pending`, `rejected` tapi database menggunakan `registered`, `cancelled`
**Solution**:
```ejs
<!-- BEFORE (BUG) -->
<%= pendaftaran.status === 'approved' ? 'Diterima' : ... %>

<!-- AFTER (FIX) -->
<%= pendaftaran.status === 'registered' ? 'Terdaftar' : 'Dibatalkan' %>
```
**Database Reference**:
- `registered` = Terdaftar (aktif)
- `cancelled` = Dibatalkan

---

### 1.3 Fix Approve-Guru Tab Status Values
**File**: `src/views/admin/approve-guru.ejs`
**Problem**: Tab link menggunakan `?status=verified` tapi tidak ada status `verified` di database
**Solution**:
```ejs
<!-- BEFORE (BUG) -->
<a href="?status=verified">Terverifikasi</a>

<!-- AFTER (FIX) -->
<a href="?status=active">Terverifikasi</a>
```
**Status yang valid**: `pending`, `active`, `reject`

---

### 1.4 Add Rejection Reason Input to Dashboard Quick-Reject
**File**: `src/views/admin/dashboard.ejs`
**Problem**: Tombol "Tolak" tidak memiliki input untuk alasan penolakan, tapi controller membutuhkannya
**Solution**:
```ejs
<!-- BEFORE (BUG) -->
<form action="/admin/guru/<%= guru.id %>/reject" method="POST">
    <button type="submit">Tolak</button>
</form>

<!-- AFTER (FIX) -->
<form action="/admin/guru/<%= guru.id %>/reject" method="POST" 
      onsubmit="return promptRejectReason(this)">
    <input type="hidden" name="reason" id="reject-reason-<%= guru.id %>">
    <button type="submit">Tolak</button>
</form>

<script>
function promptRejectReason(form) {
    const reason = prompt('Masukkan alasan penolakan:');
    if (!reason || reason.trim() === '') {
        alert('Alasan penolakan wajib diisi!');
        return false;
    }
    form.querySelector('input[name="reason"]').value = reason;
    return true;
}
</script>
```

---

### 1.5 Fix Recent Pendaftaran Field Name
**File**: `src/views/admin/dashboard.ejs`
**Problem**: View menggunakan `p.nama_peserta` tapi JOIN query mengembalikan `p.nama`
**Solution**:
```javascript
// File: src/controllers/adminController.js - ubah JOIN query alias
// ATAU
// File: src/views/admin/dashboard.ejs - ubah referensi field
<%= p.nama || '-' %>  // bukan nama_peserta
```

---

## 🗄️ SPRINT 2: Database Schema Updates (Week 1-2)

### 2.1 Migration: Add Missing Columns to Peserta Table

**File Baru**: `database/migrations/007_add_peserta_columns.sql`
```sql
-- Migration: Add missing columns to peserta table
-- Required for complete registration form data

ALTER TABLE peserta
ADD COLUMN no_hp VARCHAR(20) NULL AFTER link_dokumen,
ADD COLUMN sekolah_asal VARCHAR(255) NULL AFTER no_hp,
ADD COLUMN kelas VARCHAR(20) NULL AFTER sekolah_asal;

-- Add index for search optimization
CREATE INDEX idx_peserta_sekolah ON peserta(sekolah_asal);
```

---

### 2.2 Migration: Add Missing Columns to Guru Table

**File Baru**: `database/migrations/008_add_guru_columns.sql`
```sql
-- Migration: Add missing columns to guru table
-- Required for complete registration form data

ALTER TABLE guru
ADD COLUMN no_hp VARCHAR(20) NULL AFTER link_dokumen,
ADD COLUMN sekolah_asal VARCHAR(255) NULL AFTER no_hp,
ADD COLUMN mata_pelajaran VARCHAR(255) NULL AFTER sekolah_asal;

-- Add index for search optimization
CREATE INDEX idx_guru_sekolah ON guru(sekolah_asal);
CREATE INDEX idx_guru_mapel ON guru(mata_pelajaran);
```

---

### 2.3 Update Peserta Model

**File**: `src/models/Peserta.js`
```javascript
// Update create method untuk menerima field tambahan
static async create(userData) {
    const { 
        nama, email, password, nik, link_dokumen,
        no_hp, sekolah_asal, kelas  // TAMBAH FIELDS BARU
    } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert ke users table
    const [userResult] = await pool.query(
        'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
        [nama, email, hashedPassword, 'peserta']
    );
    
    // Insert ke peserta table dengan fields tambahan
    const [pesertaResult] = await pool.query(
        `INSERT INTO peserta (user_id, nik, link_dokumen, no_hp, sekolah_asal, kelas) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userResult.insertId, nik, link_dokumen, no_hp, sekolah_asal, kelas]
    );
    
    return { userId: userResult.insertId, pesertaId: pesertaResult.insertId };
}
```

---

### 2.4 Update Guru Model

**File**: `src/models/Guru.js`
```javascript
// Update create method untuk menerima field tambahan
static async create(userData) {
    const { 
        nama, email, password, nip, link_dokumen,
        no_hp, sekolah_asal, mata_pelajaran  // TAMBAH FIELDS BARU
    } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert ke users table
    const [userResult] = await pool.query(
        'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
        [nama, email, hashedPassword, 'guru']
    );
    
    // Insert ke guru table dengan fields tambahan
    const [guruResult] = await pool.query(
        `INSERT INTO guru (user_id, nip, link_dokumen, no_hp, sekolah_asal, mata_pelajaran, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [userResult.insertId, nip, link_dokumen, no_hp, sekolah_asal, mata_pelajaran]
    );
    
    return { userId: userResult.insertId, guruId: guruResult.insertId };
}
```

---

## 🔘 SPRINT 3: Button & Function Fixes (Week 2)

### 3.1 Complete main.js with All Required Functions

**File**: `public/js/main.js`
```javascript
// ==============================================
// MAIN.JS - Complete JavaScript Functions
// Website P4 Jakarta
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initSidebarToggle();
    initDeleteConfirmations();
    initFormValidations();
    initAlertDismiss();
    initTableSearch();
    initDropdowns();
    initModals();
});

// ==============================================
// SIDEBAR TOGGLE
// ==============================================
function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !toggleBtn) return;
    
    toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('-translate-x-full');
        if (overlay) {
            overlay.classList.toggle('hidden');
        }
    });
    
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }
}

// ==============================================
// DELETE CONFIRMATIONS
// ==============================================
function initDeleteConfirmations() {
    document.querySelectorAll('.confirm-action').forEach(form => {
        form.addEventListener('submit', function(e) {
            const message = this.dataset.confirm || 'Apakah Anda yakin?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
    
    // Handle delete buttons dengan class confirm-delete
    document.querySelectorAll('.confirm-delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const message = this.dataset.confirm || 'Apakah Anda yakin ingin menghapus?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
}

// ==============================================
// FORM VALIDATIONS
// ==============================================
function initFormValidations() {
    // Password match validation
    const passwordConfirmFields = document.querySelectorAll('input[name="confirmPassword"]');
    passwordConfirmFields.forEach(field => {
        field.addEventListener('input', function() {
            const password = document.querySelector('input[name="password"]');
            if (password && this.value !== password.value) {
                this.setCustomValidity('Password tidak cocok');
            } else {
                this.setCustomValidity('');
            }
        });
    });
    
    // NIK validation (16 digits)
    const nikFields = document.querySelectorAll('input[name="nik"]');
    nikFields.forEach(field => {
        field.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 16);
            if (this.value.length !== 16 && this.value.length > 0) {
                this.setCustomValidity('NIK harus 16 digit');
            } else {
                this.setCustomValidity('');
            }
        });
    });
    
    // NIP validation (18 digits)
    const nipFields = document.querySelectorAll('input[name="nip"]');
    nipFields.forEach(field => {
        field.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 18);
            if (this.value.length !== 18 && this.value.length > 0) {
                this.setCustomValidity('NIP harus 18 digit');
            } else {
                this.setCustomValidity('');
            }
        });
    });
    
    // Phone number validation
    const phoneFields = document.querySelectorAll('input[name="no_hp"]');
    phoneFields.forEach(field => {
        field.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9+\-\s]/g, '');
        });
    });
}

// ==============================================
// ALERT DISMISS
// ==============================================
function initAlertDismiss() {
    document.querySelectorAll('.alert-dismiss').forEach(btn => {
        btn.addEventListener('click', function() {
            const alert = this.closest('.alert');
            if (alert) {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }
        });
    });
    
    // Auto-dismiss alerts after 5 seconds
    document.querySelectorAll('.alert-auto-dismiss').forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    });
}

// ==============================================
// TABLE SEARCH
// ==============================================
function initTableSearch() {
    const searchInputs = document.querySelectorAll('[data-table-search]');
    
    searchInputs.forEach(input => {
        const targetTable = document.querySelector(input.dataset.tableSearch);
        if (!targetTable) return;
        
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = targetTable.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    });
}

// ==============================================
// DROPDOWNS
// ==============================================
function initDropdowns() {
    document.querySelectorAll('[data-dropdown-toggle]').forEach(trigger => {
        const targetId = trigger.dataset.dropdownToggle;
        const target = document.getElementById(targetId);
        if (!target) return;
        
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            target.classList.toggle('hidden');
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(dropdown => {
            dropdown.classList.add('hidden');
        });
    });
}

// ==============================================
// MODALS
// ==============================================
function initModals() {
    // Open modal buttons
    document.querySelectorAll('[data-modal-toggle]').forEach(btn => {
        const modalId = btn.dataset.modalToggle;
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        btn.addEventListener('click', function() {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Close modal buttons
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal') || document.getElementById(this.dataset.modalClose);
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Close modal on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.style.overflow = '';
            }
        });
    });
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Format tanggal Indonesia
function formatDate(dateString) {
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Berhasil disalin!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Loading state for buttons
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText;
    }
}
```

---

### 3.2 Complete admin.js with Kuota Modal Functions

**File**: `public/js/admin.js`
```javascript
// ==============================================
// ADMIN.JS - Admin Panel JavaScript Functions
// Website P4 Jakarta
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    initKuotaModal();
    initAdminModal();
    initGuruApproval();
    initPesertaManagement();
    initPendaftaranActions();
    initReportExport();
});

// ==============================================
// KUOTA MODAL FUNCTIONS
// ==============================================
function initKuotaModal() {
    const modal = document.getElementById('kuotaModal');
    const openBtn = document.getElementById('openKuotaModal');
    const closeBtn = document.getElementById('closeKuotaModal');
    const cancelBtn = document.getElementById('cancelKuotaBtn');
    const form = document.getElementById('kuotaForm');
    
    // Open modal
    if (openBtn && modal) {
        openBtn.addEventListener('click', function() {
            document.getElementById('kuotaModalTitle').textContent = 'Tambah Kuota Baru';
            form.reset();
            form.action = '/admin/kuota';
            document.getElementById('kuotaMethod').value = 'POST';
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }
    
    // Close modal
    [closeBtn, cancelBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            });
        }
    });
    
    // Close on backdrop click
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }
}

// Edit kuota - dipanggil dari onclick di view
function editKuota(id, tahunAjaran, maxPeserta, status) {
    const modal = document.getElementById('kuotaModal');
    const form = document.getElementById('kuotaForm');
    
    document.getElementById('kuotaModalTitle').textContent = 'Edit Kuota';
    document.getElementById('tahunAjaran').value = tahunAjaran;
    document.getElementById('maxPeserta').value = maxPeserta;
    document.getElementById('statusKuota').value = status;
    
    form.action = `/admin/kuota/${id}`;
    document.getElementById('kuotaMethod').value = 'PUT';
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Delete kuota confirmation
function deleteKuota(id, tahunAjaran) {
    if (confirm(`Apakah Anda yakin ingin menghapus kuota tahun ajaran ${tahunAjaran}?`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/kuota/${id}/delete`;
        document.body.appendChild(form);
        form.submit();
    }
}

// ==============================================
// ADMIN MODAL FUNCTIONS
// ==============================================
function initAdminModal() {
    const modal = document.getElementById('adminModal');
    const openBtn = document.getElementById('openAdminModal');
    const closeBtn = document.getElementById('closeAdminModal');
    const cancelBtn = document.getElementById('cancelAdminBtn');
    
    if (openBtn && modal) {
        openBtn.addEventListener('click', function() {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }
    
    [closeBtn, cancelBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            });
        }
    });
}

// ==============================================
// GURU APPROVAL FUNCTIONS
// ==============================================
function initGuruApproval() {
    // Quick approve dari dashboard
    document.querySelectorAll('.quick-approve-guru').forEach(btn => {
        btn.addEventListener('click', function() {
            const guruId = this.dataset.guruId;
            if (confirm('Apakah Anda yakin ingin menyetujui guru ini?')) {
                submitApproval(guruId, 'approve');
            }
        });
    });
}

function submitApproval(guruId, action) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/admin/guru/${guruId}/${action}`;
    document.body.appendChild(form);
    form.submit();
}

// Reject with reason modal
function openRejectModal(guruId, guruName) {
    const modal = document.getElementById('rejectModal');
    const form = document.getElementById('rejectForm');
    const nameSpan = document.getElementById('rejectGuruName');
    
    if (modal && form) {
        form.action = `/admin/guru/${guruId}/reject`;
        if (nameSpan) nameSpan.textContent = guruName;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeRejectModal() {
    const modal = document.getElementById('rejectModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// ==============================================
// PESERTA MANAGEMENT FUNCTIONS
// ==============================================
function initPesertaManagement() {
    // View detail peserta
    document.querySelectorAll('.view-peserta-detail').forEach(btn => {
        btn.addEventListener('click', function() {
            const pesertaId = this.dataset.pesertaId;
            window.location.href = `/admin/peserta/${pesertaId}`;
        });
    });
}

// ==============================================
// PENDAFTARAN ACTIONS
// ==============================================
function initPendaftaranActions() {
    // Cancel pendaftaran
    document.querySelectorAll('.cancel-pendaftaran').forEach(btn => {
        btn.addEventListener('click', function() {
            const pendaftaranId = this.dataset.pendaftaranId;
            if (confirm('Apakah Anda yakin ingin membatalkan pendaftaran ini?')) {
                cancelPendaftaran(pendaftaranId);
            }
        });
    });
}

function cancelPendaftaran(id) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/admin/pendaftaran/${id}/cancel`;
    document.body.appendChild(form);
    form.submit();
}

// ==============================================
// REPORT EXPORT FUNCTIONS
// ==============================================
function initReportExport() {
    const exportBtn = document.getElementById('exportReportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const format = document.getElementById('exportFormat')?.value || 'xlsx';
            const startDate = document.getElementById('startDate')?.value || '';
            const endDate = document.getElementById('endDate')?.value || '';
            
            window.location.href = `/admin/reports/export?format=${format}&start=${startDate}&end=${endDate}`;
        });
    }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Refresh statistics via AJAX
async function refreshStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.success) {
            // Update stat cards
            document.getElementById('totalAdmin')?.textContent = data.stats.totalAdmin;
            document.getElementById('totalGuru')?.textContent = data.stats.totalGuru;
            document.getElementById('totalPeserta')?.textContent = data.stats.totalPeserta;
            document.getElementById('kuotaTersedia')?.textContent = data.stats.kuotaTersedia;
        }
    } catch (error) {
        console.error('Failed to refresh stats:', error);
    }
}

// Print section
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print - P4 Jakarta</title>
                    <link href="/css/output.css" rel="stylesheet">
                </head>
                <body class="p-8">
                    ${section.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}
```

---

### 3.3 Complete dashboard.js

**File**: `public/js/dashboard.js`
```javascript
// ==============================================
// DASHBOARD.JS - Dashboard Interactions
// Website P4 Jakarta
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    initDashboardCharts();
    initQuickActions();
    initNotifications();
    initAutoRefresh();
});

// ==============================================
// DASHBOARD CHARTS (Simple Implementation)
// ==============================================
function initDashboardCharts() {
    // Placeholder for future chart implementations
    // Can integrate with Chart.js in future phases
    
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        // Add loading state or placeholder
        if (!container.querySelector('canvas')) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Chart akan tersedia segera</p>';
        }
    });
}

// ==============================================
// QUICK ACTIONS
// ==============================================
function initQuickActions() {
    // Quick action buttons dengan keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt + N = New item
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            const newBtn = document.querySelector('[data-quick-action="new"]');
            if (newBtn) newBtn.click();
        }
        
        // Alt + S = Search
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            const searchInput = document.querySelector('[data-table-search]');
            if (searchInput) searchInput.focus();
        }
    });
}

// ==============================================
// NOTIFICATIONS
// ==============================================
function initNotifications() {
    const notificationBell = document.getElementById('notificationBell');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (notificationBell && notificationDropdown) {
        notificationBell.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('hidden');
        });
        
        document.addEventListener('click', function() {
            notificationDropdown.classList.add('hidden');
        });
    }
    
    // Mark notification as read
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            this.classList.remove('bg-blue-50');
            this.classList.add('bg-white');
            updateNotificationCount();
        });
    });
}

function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item.bg-blue-50').length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// ==============================================
// AUTO REFRESH
// ==============================================
function initAutoRefresh() {
    // Auto refresh stats every 5 minutes
    if (typeof refreshStats === 'function') {
        setInterval(refreshStats, 5 * 60 * 1000);
    }
}

// ==============================================
// PROFILE DROPDOWN
// ==============================================
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('profileDropdown');
    const trigger = document.getElementById('profileTrigger');
    
    if (dropdown && !dropdown.contains(e.target) && !trigger?.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});
```

---

### 3.4 Complete form-validation.js

**File**: `public/js/form-validation.js`
```javascript
// ==============================================
// FORM-VALIDATION.JS - Form Validation Functions
// Website P4 Jakarta
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    initAllFormValidations();
});

function initAllFormValidations() {
    // Registration forms
    initRegistrationValidation();
    
    // Login form
    initLoginValidation();
    
    // Profile forms
    initProfileValidation();
    
    // Password change form
    initPasswordChangeValidation();
    
    // Real-time validation feedback
    initRealTimeValidation();
}

// ==============================================
// REGISTRATION VALIDATION
// ==============================================
function initRegistrationValidation() {
    const pesertaForm = document.getElementById('registerPesertaForm');
    const guruForm = document.getElementById('registerGuruForm');
    
    [pesertaForm, guruForm].forEach(form => {
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            const errors = validateRegistrationForm(this);
            if (errors.length > 0) {
                e.preventDefault();
                showFormErrors(errors);
            }
        });
    });
}

function validateRegistrationForm(form) {
    const errors = [];
    const formData = new FormData(form);
    
    // Nama validation
    const nama = formData.get('nama')?.trim();
    if (!nama || nama.length < 3) {
        errors.push('Nama harus minimal 3 karakter');
    }
    
    // Email validation
    const email = formData.get('email')?.trim();
    if (!email || !isValidEmail(email)) {
        errors.push('Format email tidak valid');
    }
    
    // NIK validation (for peserta)
    const nik = formData.get('nik')?.trim();
    if (nik && nik.length !== 16) {
        errors.push('NIK harus 16 digit');
    }
    
    // NIP validation (for guru)
    const nip = formData.get('nip')?.trim();
    if (nip && nip.length !== 18) {
        errors.push('NIP harus 18 digit');
    }
    
    // Password validation
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (!password || password.length < 6) {
        errors.push('Password harus minimal 6 karakter');
    }
    
    if (password !== confirmPassword) {
        errors.push('Konfirmasi password tidak cocok');
    }
    
    // Link dokumen validation
    const linkDokumen = formData.get('link_dokumen')?.trim();
    if (linkDokumen && !isValidUrl(linkDokumen)) {
        errors.push('Format link dokumen tidak valid');
    }
    
    // Phone validation
    const noHp = formData.get('no_hp')?.trim();
    if (noHp && !isValidPhone(noHp)) {
        errors.push('Format nomor HP tidak valid');
    }
    
    return errors;
}

// ==============================================
// LOGIN VALIDATION
// ==============================================
function initLoginValidation() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = this.querySelector('input[name="email"]')?.value?.trim();
            const password = this.querySelector('input[name="password"]')?.value;
            
            const errors = [];
            
            if (!email || !isValidEmail(email)) {
                errors.push('Masukkan email yang valid');
            }
            
            if (!password) {
                errors.push('Password wajib diisi');
            }
            
            if (errors.length > 0) {
                e.preventDefault();
                showFormErrors(errors);
            }
        });
    }
}

// ==============================================
// PROFILE VALIDATION
// ==============================================
function initProfileValidation() {
    const profileForm = document.getElementById('profileForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            const nama = this.querySelector('input[name="nama"]')?.value?.trim();
            
            if (!nama || nama.length < 3) {
                e.preventDefault();
                showFormErrors(['Nama harus minimal 3 karakter']);
            }
        });
    }
}

// ==============================================
// PASSWORD CHANGE VALIDATION
// ==============================================
function initPasswordChangeValidation() {
    const passwordForm = document.getElementById('changePasswordForm');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            const errors = [];
            const currentPassword = this.querySelector('input[name="currentPassword"]')?.value;
            const newPassword = this.querySelector('input[name="newPassword"]')?.value;
            const confirmPassword = this.querySelector('input[name="confirmPassword"]')?.value;
            
            if (!currentPassword) {
                errors.push('Password saat ini wajib diisi');
            }
            
            if (!newPassword || newPassword.length < 6) {
                errors.push('Password baru harus minimal 6 karakter');
            }
            
            if (newPassword !== confirmPassword) {
                errors.push('Konfirmasi password tidak cocok');
            }
            
            if (currentPassword === newPassword) {
                errors.push('Password baru harus berbeda dari password saat ini');
            }
            
            if (errors.length > 0) {
                e.preventDefault();
                showFormErrors(errors);
            }
        });
    }
}

// ==============================================
// REAL-TIME VALIDATION
// ==============================================
function initRealTimeValidation() {
    // Email real-time validation
    document.querySelectorAll('input[type="email"]').forEach(input => {
        input.addEventListener('blur', function() {
            const isValid = isValidEmail(this.value);
            toggleInputError(this, !isValid && this.value, 'Format email tidak valid');
        });
    });
    
    // Password strength indicator
    document.querySelectorAll('input[name="password"]').forEach(input => {
        input.addEventListener('input', function() {
            updatePasswordStrength(this);
        });
    });
    
    // Confirm password match check
    document.querySelectorAll('input[name="confirmPassword"]').forEach(input => {
        input.addEventListener('input', function() {
            const password = this.form.querySelector('input[name="password"]')?.value;
            const isMatch = this.value === password;
            toggleInputError(this, !isMatch && this.value, 'Password tidak cocok');
        });
    });
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9+\-\s]{10,15}$/;
    return phoneRegex.test(phone);
}

function showFormErrors(errors) {
    // Remove existing error container
    const existingErrors = document.querySelector('.form-errors');
    if (existingErrors) existingErrors.remove();
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'form-errors bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4';
    
    const errorList = document.createElement('ul');
    errorList.className = 'list-disc list-inside text-sm';
    
    errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        errorList.appendChild(li);
    });
    
    errorContainer.appendChild(errorList);
    
    // Insert at top of form
    const form = document.querySelector('form');
    if (form) {
        form.insertBefore(errorContainer, form.firstChild);
        
        // Scroll to error
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function toggleInputError(input, showError, message) {
    const existingError = input.parentNode.querySelector('.input-error');
    
    if (showError) {
        input.classList.add('border-red-500');
        input.classList.remove('border-gray-300');
        
        if (!existingError) {
            const errorSpan = document.createElement('span');
            errorSpan.className = 'input-error text-red-500 text-xs mt-1 block';
            errorSpan.textContent = message;
            input.parentNode.appendChild(errorSpan);
        }
    } else {
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-300');
        
        if (existingError) {
            existingError.remove();
        }
    }
}

function updatePasswordStrength(input) {
    const password = input.value;
    let strength = 0;
    let label = '';
    let colorClass = '';
    
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch (strength) {
        case 0:
        case 1:
            label = 'Sangat Lemah';
            colorClass = 'bg-red-500';
            break;
        case 2:
            label = 'Lemah';
            colorClass = 'bg-orange-500';
            break;
        case 3:
            label = 'Sedang';
            colorClass = 'bg-yellow-500';
            break;
        case 4:
            label = 'Kuat';
            colorClass = 'bg-green-500';
            break;
        case 5:
            label = 'Sangat Kuat';
            colorClass = 'bg-green-600';
            break;
    }
    
    // Update or create strength indicator
    let indicator = input.parentNode.querySelector('.password-strength');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'password-strength mt-2';
        input.parentNode.appendChild(indicator);
    }
    
    indicator.innerHTML = `
        <div class="flex items-center gap-2">
            <div class="flex-1 h-1 bg-gray-200 rounded">
                <div class="h-full ${colorClass} rounded" style="width: ${strength * 20}%"></div>
            </div>
            <span class="text-xs text-gray-500">${label}</span>
        </div>
    `;
}
```

---

## 📱 SPRINT 4: Responsive Design (Week 2-3)

### 4.1 Complete Responsive CSS

**File**: `public/css/responsive.css`
```css
/* ==============================================
   RESPONSIVE.CSS - Mobile-First Responsive Styles
   Website P4 Jakarta
   ============================================== */

/* ==============================================
   BASE MOBILE STYLES (Default)
   ============================================== */

/* Typography */
html {
    font-size: 14px;
}

h1 { font-size: 1.75rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }
h4 { font-size: 1.125rem; }

/* Container */
.container {
    padding-left: 1rem;
    padding-right: 1rem;
}

/* ==============================================
   SIDEBAR RESPONSIVE
   ============================================== */

/* Mobile: Sidebar hidden by default */
@media (max-width: 767px) {
    #sidebar {
        position: fixed;
        z-index: 40;
        width: 280px;
        height: 100vh;
        transform: translateX(-100%);
        transition: transform 0.3s ease-in-out;
    }
    
    #sidebar.open {
        transform: translateX(0);
    }
    
    #sidebarOverlay {
        display: none;
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 30;
    }
    
    #sidebarOverlay.active {
        display: block;
    }
    
    /* Main content full width on mobile */
    .main-content {
        margin-left: 0 !important;
        width: 100%;
    }
}

/* Tablet and up: Sidebar visible */
@media (min-width: 768px) {
    #sidebar {
        transform: translateX(0);
    }
    
    #sidebarToggleBtn {
        display: none;
    }
    
    .main-content {
        margin-left: 280px;
    }
}

/* ==============================================
   TABLE RESPONSIVE
   ============================================== */

/* Mobile: Convert tables to cards */
@media (max-width: 767px) {
    .responsive-table {
        border: 0;
    }
    
    .responsive-table thead {
        display: none;
    }
    
    .responsive-table tr {
        display: block;
        margin-bottom: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1rem;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .responsive-table td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border: none;
        border-bottom: 1px solid #f3f4f6;
    }
    
    .responsive-table td:last-child {
        border-bottom: none;
    }
    
    .responsive-table td::before {
        content: attr(data-label);
        font-weight: 600;
        color: #374151;
        margin-right: 1rem;
        flex-shrink: 0;
    }
    
    /* Action buttons stack vertically */
    .responsive-table .action-buttons {
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }
    
    .responsive-table .action-buttons form,
    .responsive-table .action-buttons a,
    .responsive-table .action-buttons button {
        width: 100%;
    }
}

/* ==============================================
   FORMS RESPONSIVE
   ============================================== */

/* Mobile form adjustments */
@media (max-width: 639px) {
    .form-grid {
        grid-template-columns: 1fr !important;
    }
    
    .form-row {
        flex-direction: column;
    }
    
    .form-row > * {
        width: 100%;
    }
    
    /* Full width inputs on mobile */
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="number"],
    input[type="tel"],
    select,
    textarea {
        width: 100%;
        font-size: 16px; /* Prevents zoom on iOS */
    }
    
    /* Stack form buttons */
    .form-actions {
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .form-actions button,
    .form-actions a {
        width: 100%;
        text-align: center;
    }
}

/* ==============================================
   CARDS RESPONSIVE
   ============================================== */

@media (max-width: 639px) {
    /* Stats cards stack */
    .stats-grid {
        grid-template-columns: 1fr !important;
    }
    
    .stat-card {
        padding: 1rem;
    }
    
    .stat-card .stat-value {
        font-size: 1.5rem;
    }
}

@media (min-width: 640px) and (max-width: 1023px) {
    /* Tablet: 2 columns */
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* ==============================================
   MODALS RESPONSIVE
   ============================================== */

@media (max-width: 639px) {
    .modal-content {
        width: 95%;
        max-width: 100%;
        margin: 1rem;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .modal-header,
    .modal-body,
    .modal-footer {
        padding: 1rem;
    }
    
    .modal-footer {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .modal-footer button {
        width: 100%;
    }
}

/* ==============================================
   NAVIGATION RESPONSIVE
   ============================================== */

@media (max-width: 767px) {
    /* Mobile header adjustments */
    .header-content {
        padding: 0.75rem 1rem;
    }
    
    .header-title {
        font-size: 1.125rem;
    }
    
    /* Hide some header elements on mobile */
    .header-search {
        display: none;
    }
    
    /* User menu compact */
    .user-menu .user-name {
        display: none;
    }
}

/* ==============================================
   DASHBOARD RESPONSIVE
   ============================================== */

@media (max-width: 767px) {
    /* Stack dashboard sections */
    .dashboard-grid {
        grid-template-columns: 1fr !important;
    }
    
    /* Recent activity list */
    .activity-list .activity-item {
        padding: 0.75rem;
    }
    
    .activity-item .activity-avatar {
        width: 32px;
        height: 32px;
        font-size: 0.875rem;
    }
    
    /* Quick actions grid */
    .quick-actions {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
    }
    
    .quick-action-btn {
        padding: 0.75rem;
        font-size: 0.75rem;
    }
}

/* ==============================================
   BUTTONS RESPONSIVE
   ============================================== */

@media (max-width: 639px) {
    /* Touch-friendly button sizes */
    .btn {
        min-height: 44px;
        padding: 0.75rem 1rem;
    }
    
    .btn-sm {
        min-height: 36px;
        padding: 0.5rem 0.75rem;
    }
    
    /* Icon buttons */
    .btn-icon {
        min-width: 44px;
        min-height: 44px;
    }
}

/* ==============================================
   ALERT/NOTIFICATION RESPONSIVE
   ============================================== */

@media (max-width: 639px) {
    .alert {
        padding: 0.75rem;
        font-size: 0.875rem;
    }
    
    /* Toast notifications */
    .toast {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        width: auto;
    }
}

/* ==============================================
   PUBLIC PAGES RESPONSIVE
   ============================================== */

/* Hero section */
@media (max-width: 767px) {
    .hero-section {
        padding: 2rem 1rem;
        text-align: center;
    }
    
    .hero-title {
        font-size: 1.75rem;
    }
    
    .hero-subtitle {
        font-size: 1rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .hero-buttons a {
        width: 100%;
    }
}

/* Features grid */
@media (max-width: 639px) {
    .features-grid {
        grid-template-columns: 1fr;
    }
}

@media (min-width: 640px) and (max-width: 1023px) {
    .features-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Footer */
@media (max-width: 767px) {
    .footer-grid {
        grid-template-columns: 1fr;
        text-align: center;
    }
    
    .footer-social {
        justify-content: center;
    }
}

/* ==============================================
   UTILITY RESPONSIVE CLASSES
   ============================================== */

/* Hide on mobile */
@media (max-width: 639px) {
    .hide-mobile {
        display: none !important;
    }
}

/* Show only on mobile */
@media (min-width: 640px) {
    .show-mobile-only {
        display: none !important;
    }
}

/* Hide on tablet */
@media (min-width: 640px) and (max-width: 1023px) {
    .hide-tablet {
        display: none !important;
    }
}

/* Hide on desktop */
@media (min-width: 1024px) {
    .hide-desktop {
        display: none !important;
    }
}

/* ==============================================
   PRINT STYLES
   ============================================== */

@media print {
    /* Hide non-essential elements */
    #sidebar,
    .header,
    .no-print,
    button,
    .btn,
    .modal {
        display: none !important;
    }
    
    /* Full width content */
    .main-content {
        margin-left: 0 !important;
        width: 100% !important;
    }
    
    /* Ensure text is readable */
    body {
        font-size: 12pt;
        color: black;
        background: white;
    }
    
    /* Show links */
    a[href]::after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: #666;
    }
    
    /* Page breaks */
    .page-break {
        page-break-before: always;
    }
    
    .no-break {
        page-break-inside: avoid;
    }
}

/* ==============================================
   ANIMATIONS
   ============================================== */

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* ==============================================
   DARK MODE SUPPORT (Future)
   ============================================== */

@media (prefers-color-scheme: dark) {
    /* Placeholder for future dark mode implementation */
    /* :root {
        --bg-primary: #1a1a2e;
        --bg-secondary: #16213e;
        --text-primary: #eaeaea;
        --text-secondary: #b8b8b8;
    } */
}
```

---

## 🔒 SPRINT 5: Security Enhancement (Week 3)

### 5.1 Environment Variable Validation

**File Baru**: `src/config/env.js`
```javascript
// ==============================================
// ENV.JS - Environment Variable Validation
// Website P4 Jakarta
// ==============================================

const requiredEnvVars = [
    'SESSION_SECRET',
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_NAME'
];

const optionalEnvVars = [
    'DB_PASSWORD',
    'DB_PORT',
    'PORT',
    'NODE_ENV',
    'SUPERADMIN_EMAIL',
    'SUPERADMIN_ID'
];

function validateEnv() {
    const missing = [];
    const warnings = [];
    
    // Check required variables
    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });
    
    // Check for weak secrets
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        warnings.push('JWT_SECRET should be at least 32 characters for security');
    }
    
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
        warnings.push('SESSION_SECRET should be at least 32 characters for security');
    }
    
    // Report issues
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\nPlease set these in your .env file');
        process.exit(1);
    }
    
    if (warnings.length > 0) {
        console.warn('⚠️  Security warnings:');
        warnings.forEach(w => console.warn(`   - ${w}`));
    }
    
    console.log('✅ Environment variables validated');
}

module.exports = { validateEnv };
```

---

### 5.2 Rate Limiting Implementation

**Update File**: `server.js`
```javascript
// Add at the top with other imports
const rateLimit = require('express-rate-limit');

// Create rate limiters
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    message: {
        error: 'Terlalu banyak request. Silakan coba lagi dalam 15 menit.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: {
        error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful logins
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: {
        error: 'Rate limit exceeded. Please slow down.'
    }
});

// Apply rate limiters
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/api/', apiLimiter);
app.use(generalLimiter);
```

---

### 5.3 CSRF Protection

**Update File**: `server.js`
```javascript
// Add with other imports
const csrf = require('csurf');

// CSRF protection (after session middleware)
const csrfProtection = csrf({ cookie: false }); // Use session-based

// Apply to all POST routes except API
app.use((req, res, next) => {
    // Skip CSRF for API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }
    csrfProtection(req, res, next);
});

// Make CSRF token available to all views
app.use((req, res, next) => {
    if (req.csrfToken) {
        res.locals.csrfToken = req.csrfToken();
    }
    next();
});
```

**Update semua form di views** untuk include CSRF token:
```ejs
<form method="POST" action="/some-action">
    <input type="hidden" name="_csrf" value="<%= csrfToken %>">
    <!-- form fields -->
</form>
```

---

### 5.4 Fix File Upload MIME Type Validation

**Update File**: `src/config/upload.js`
```javascript
// Fixed MIME type validation
const allowedMimeTypes = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

function fileFilter(req, file, cb) {
    // Check MIME type
    if (allowedMimeTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`Tipe file tidak diizinkan: ${file.mimetype}`), false);
    }
}
```

---

## 📝 SPRINT 6: Missing Features (Week 3-4)

### 6.1 Activity Logging Service

**File Baru**: `src/services/activityService.js`
```javascript
// ==============================================
// ACTIVITY SERVICE - Activity Logging
// Website P4 Jakarta
// ==============================================

const pool = require('../config/database');
const logger = require('../utils/logger');

class ActivityService {
    /**
     * Log user activity
     * @param {number} userId - User ID
     * @param {string} action - Action type (login, logout, create, update, delete, etc)
     * @param {string} description - Human readable description
     * @param {object} metadata - Additional data (optional)
     */
    static async log(userId, action, description, metadata = null) {
        try {
            const [result] = await pool.query(
                `INSERT INTO activity_log (user_id, action, description, metadata, created_at) 
                 VALUES (?, ?, ?, ?, NOW())`,
                [userId, action, description, metadata ? JSON.stringify(metadata) : null]
            );
            
            return result.insertId;
        } catch (error) {
            logger.error('Failed to log activity:', error);
            // Don't throw - activity logging should not break main functionality
            return null;
        }
    }
    
    /**
     * Get recent activities
     * @param {number} limit - Number of activities to return
     * @param {number} userId - Filter by user (optional)
     */
    static async getRecent(limit = 20, userId = null) {
        try {
            let query = `
                SELECT 
                    al.*,
                    u.nama as user_nama,
                    u.role as user_role
                FROM activity_log al
                LEFT JOIN users u ON al.user_id = u.id
            `;
            
            const params = [];
            
            if (userId) {
                query += ' WHERE al.user_id = ?';
                params.push(userId);
            }
            
            query += ' ORDER BY al.created_at DESC LIMIT ?';
            params.push(limit);
            
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            logger.error('Failed to get activities:', error);
            return [];
        }
    }
    
    /**
     * Get activities by action type
     */
    static async getByAction(action, limit = 50) {
        try {
            const [rows] = await pool.query(
                `SELECT al.*, u.nama as user_nama, u.role as user_role
                 FROM activity_log al
                 LEFT JOIN users u ON al.user_id = u.id
                 WHERE al.action = ?
                 ORDER BY al.created_at DESC
                 LIMIT ?`,
                [action, limit]
            );
            return rows;
        } catch (error) {
            logger.error('Failed to get activities by action:', error);
            return [];
        }
    }
    
    /**
     * Predefined activity types
     */
    static get ACTIONS() {
        return {
            // Auth
            LOGIN: 'login',
            LOGOUT: 'logout',
            REGISTER: 'register',
            PASSWORD_CHANGE: 'password_change',
            PASSWORD_RESET: 'password_reset',
            
            // Admin
            ADMIN_CREATE: 'admin_create',
            GURU_APPROVE: 'guru_approve',
            GURU_REJECT: 'guru_reject',
            KUOTA_CREATE: 'kuota_create',
            KUOTA_UPDATE: 'kuota_update',
            KUOTA_DELETE: 'kuota_delete',
            
            // User
            PROFILE_UPDATE: 'profile_update',
            DOCUMENT_UPDATE: 'document_update',
            
            // Pendaftaran
            PENDAFTARAN_CREATE: 'pendaftaran_create',
            PENDAFTARAN_CANCEL: 'pendaftaran_cancel',
            
            // Material
            MATERIAL_CREATE: 'material_create',
            MATERIAL_UPDATE: 'material_update',
            MATERIAL_DELETE: 'material_delete'
        };
    }
}

module.exports = ActivityService;
```

---

### 6.2 Migration: Update Activity Log Table

**File Baru**: `database/migrations/009_update_activity_log.sql`
```sql
-- Migration: Update activity_log table with metadata column

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add metadata column if not exists
ALTER TABLE activity_log
ADD COLUMN IF NOT EXISTS metadata JSON NULL AFTER description;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);
```

---

### 6.3 Terms & Privacy Pages

**File Baru**: `src/views/public/terms.ejs`
```ejs
<%- include('../layouts/main', { 
    title: 'Syarat & Ketentuan - P4 Jakarta',
    content: `
        <div class="max-w-4xl mx-auto px-4 py-12">
            <h1 class="text-3xl font-bold text-gray-900 mb-8">Syarat & Ketentuan</h1>
            
            <div class="prose prose-lg max-w-none">
                <h2>1. Pendahuluan</h2>
                <p>Selamat datang di Website P4 Jakarta. Dengan mengakses dan menggunakan layanan kami, Anda menyetujui untuk terikat dengan syarat dan ketentuan berikut.</p>
                
                <h2>2. Definisi</h2>
                <ul>
                    <li><strong>P4</strong>: Pusat Pelatihan dan Pengembangan Pendidikan Jakarta</li>
                    <li><strong>Pengguna</strong>: Setiap orang yang mengakses atau menggunakan layanan</li>
                    <li><strong>Layanan</strong>: Platform pendaftaran dan manajemen pelatihan online</li>
                </ul>
                
                <h2>3. Pendaftaran Akun</h2>
                <p>Untuk menggunakan layanan, pengguna harus:</p>
                <ul>
                    <li>Memberikan informasi yang akurat dan lengkap</li>
                    <li>Menjaga kerahasiaan password</li>
                    <li>Bertanggung jawab atas aktivitas akun</li>
                    <li>Melaporkan akses tidak sah</li>
                </ul>
                
                <h2>4. Kuota Pendaftaran</h2>
                <p>Pendaftaran program P4 terbatas pada kuota yang tersedia. Pendaftaran dilakukan berdasarkan sistem first-come-first-served.</p>
                
                <h2>5. Hak dan Kewajiban</h2>
                <h3>5.1 Hak Pengguna</h3>
                <ul>
                    <li>Mengakses layanan sesuai role</li>
                    <li>Mendapatkan informasi program</li>
                    <li>Mengubah data profil</li>
                </ul>
                
                <h3>5.2 Kewajiban Pengguna</h3>
                <ul>
                    <li>Mematuhi peraturan yang berlaku</li>
                    <li>Tidak menyalahgunakan layanan</li>
                    <li>Menjaga kerahasiaan informasi</li>
                </ul>
                
                <h2>6. Pembatasan Tanggung Jawab</h2>
                <p>P4 Jakarta tidak bertanggung jawab atas kerugian yang timbul dari penggunaan layanan, termasuk namun tidak terbatas pada kerusakan data atau gangguan layanan.</p>
                
                <h2>7. Perubahan Ketentuan</h2>
                <p>P4 Jakarta berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui website.</p>
                
                <h2>8. Kontak</h2>
                <p>Untuk pertanyaan terkait syarat dan ketentuan, hubungi kami di:</p>
                <p>Email: info@p4jakarta.go.id<br>Telepon: (021) 1234-5678</p>
                
                <p class="text-sm text-gray-500 mt-8">Terakhir diperbarui: Januari 2026</p>
            </div>
        </div>
    `
}) %>
```

**File Baru**: `src/views/public/privacy.ejs`
```ejs
<%- include('../layouts/main', { 
    title: 'Kebijakan Privasi - P4 Jakarta',
    content: `
        <div class="max-w-4xl mx-auto px-4 py-12">
            <h1 class="text-3xl font-bold text-gray-900 mb-8">Kebijakan Privasi</h1>
            
            <div class="prose prose-lg max-w-none">
                <h2>1. Informasi yang Kami Kumpulkan</h2>
                <p>Kami mengumpulkan informasi berikut:</p>
                <ul>
                    <li><strong>Data Pribadi</strong>: Nama, email, NIK/NIP, nomor telepon</li>
                    <li><strong>Data Pendaftaran</strong>: Sekolah asal, kelas/mata pelajaran</li>
                    <li><strong>Data Teknis</strong>: IP address, browser type, cookies</li>
                </ul>
                
                <h2>2. Penggunaan Informasi</h2>
                <p>Informasi yang dikumpulkan digunakan untuk:</p>
                <ul>
                    <li>Memproses pendaftaran dan verifikasi</li>
                    <li>Mengelola akun pengguna</li>
                    <li>Mengirim informasi terkait program</li>
                    <li>Meningkatkan layanan</li>
                </ul>
                
                <h2>3. Keamanan Data</h2>
                <p>Kami menerapkan langkah-langkah keamanan:</p>
                <ul>
                    <li>Enkripsi password dengan bcrypt</li>
                    <li>Koneksi HTTPS</li>
                    <li>Akses terbatas ke database</li>
                    <li>Monitoring keamanan berkala</li>
                </ul>
                
                <h2>4. Berbagi Informasi</h2>
                <p>Kami tidak menjual atau membagikan data pribadi kepada pihak ketiga, kecuali:</p>
                <ul>
                    <li>Diperlukan oleh hukum</li>
                    <li>Untuk melindungi hak dan keamanan</li>
                    <li>Dengan persetujuan pengguna</li>
                </ul>
                
                <h2>5. Cookies</h2>
                <p>Website kami menggunakan cookies untuk:</p>
                <ul>
                    <li>Menyimpan preferensi pengguna</li>
                    <li>Menjaga sesi login</li>
                    <li>Analitik penggunaan</li>
                </ul>
                
                <h2>6. Hak Pengguna</h2>
                <p>Pengguna memiliki hak untuk:</p>
                <ul>
                    <li>Mengakses data pribadi</li>
                    <li>Memperbaiki data yang tidak akurat</li>
                    <li>Meminta penghapusan data</li>
                    <li>Menarik persetujuan</li>
                </ul>
                
                <h2>7. Retensi Data</h2>
                <p>Data disimpan selama akun aktif atau sesuai kebutuhan hukum. Data dapat dihapus atas permintaan pengguna.</p>
                
                <h2>8. Kontak</h2>
                <p>Untuk pertanyaan terkait privasi:</p>
                <p>Email: privacy@p4jakarta.go.id<br>Telepon: (021) 1234-5678</p>
                
                <p class="text-sm text-gray-500 mt-8">Terakhir diperbarui: Januari 2026</p>
            </div>
        </div>
    `
}) %>
```

**Update Routes** (`src/routes/publicRoutes.js`):
```javascript
// Add routes for terms and privacy
router.get('/terms', (req, res) => {
    res.render('public/terms', {
        title: 'Syarat & Ketentuan',
        currentUser: req.session.user || null
    });
});

router.get('/privacy', (req, res) => {
    res.render('public/privacy', {
        title: 'Kebijakan Privasi',
        currentUser: req.session.user || null
    });
});
```

---

### 6.4 Contact Form Handler

**Update Controller** (`src/controllers/publicController.js` atau buat baru):
```javascript
// Contact form handler
const submitContact = async (req, res) => {
    try {
        const { nama, email, subjek, pesan } = req.body;
        
        // Validate input
        if (!nama || !email || !subjek || !pesan) {
            req.session.error = 'Semua field wajib diisi';
            return res.redirect('/contact');
        }
        
        // Store in database or send email
        // For now, just log it
        const ActivityService = require('../services/activityService');
        await ActivityService.log(
            null, // No user ID for anonymous contact
            'contact_submit',
            `Pesan dari ${nama} (${email}): ${subjek}`,
            { nama, email, subjek, pesan }
        );
        
        // TODO: Implement email sending in future phase
        
        req.session.success = 'Pesan Anda telah terkirim. Kami akan menghubungi Anda segera.';
        res.redirect('/contact');
        
    } catch (error) {
        console.error('Contact form error:', error);
        req.session.error = 'Terjadi kesalahan. Silakan coba lagi.';
        res.redirect('/contact');
    }
};
```

---

### 6.5 Remember Me Functionality

**Update Auth Controller** (`src/controllers/authController.js`):
```javascript
const login = async (req, res) => {
    try {
        const { email, password, remember } = req.body;
        
        // ... existing login logic ...
        
        // If login successful and remember me checked
        if (remember === 'on') {
            // Extend session maxAge to 30 days
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        } else {
            // Default session (browser close = logout)
            req.session.cookie.expires = false;
        }
        
        // ... rest of login logic ...
    } catch (error) {
        // ... error handling ...
    }
};
```

---

## ⚠️ SPRINT 7: Error Handling Improvements (Week 4)

### 7.1 API Error Response Handler

**Update File**: `src/middlewares/errorMiddleware.js`
```javascript
// ==============================================
// ERROR MIDDLEWARE - Enhanced Error Handling
// Website P4 Jakarta
// ==============================================

const logger = require('../utils/logger');

/**
 * Custom error class
 */
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not Found handler
 */
const notFound = (req, res, next) => {
    const error = new AppError(`Not found: ${req.originalUrl}`, 404);
    next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        user: req.session?.user?.id || 'anonymous'
    });
    
    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    
    // Check if API request
    const isApiRequest = req.path.startsWith('/api/') || 
                         req.xhr || 
                         req.headers.accept?.includes('application/json');
    
    if (isApiRequest) {
        // API error response
        return res.status(statusCode).json({
            success: false,
            error: {
                message: err.message || 'Internal Server Error',
                code: err.code || 'INTERNAL_ERROR',
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        });
    }
    
    // HTML error response
    const errorData = {
        title: `Error ${statusCode}`,
        message: err.message || 'Terjadi kesalahan',
        statusCode,
        currentUser: req.session?.user || null,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    
    // Render appropriate error page
    switch (statusCode) {
        case 403:
            return res.status(403).render('errors/403', errorData);
        case 404:
            return res.status(404).render('errors/404', errorData);
        default:
            return res.status(statusCode).render('errors/500', errorData);
    }
};

/**
 * Async handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error handler
 */
const validationErrorHandler = (errors, req, res) => {
    const isApiRequest = req.path.startsWith('/api/') || 
                         req.xhr || 
                         req.headers.accept?.includes('application/json');
    
    if (isApiRequest) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors
            }
        });
    }
    
    // For regular requests, flash errors and redirect back
    req.session.error = errors.map(e => e.msg || e.message).join(', ');
    return res.redirect('back');
};

module.exports = {
    AppError,
    notFound,
    errorHandler,
    asyncHandler,
    validationErrorHandler
};
```

---

### 7.2 Database Connection Retry

**Update File**: `src/config/database.js`
```javascript
// Add connection retry logic
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const testConnection = async (retries = MAX_RETRIES) => {
    try {
        const connection = await pool.getConnection();
        logger.info('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        logger.error(`❌ Database connection failed (attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, error.message);
        
        if (retries > 0) {
            logger.info(`⏳ Retrying in ${RETRY_DELAY/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return testConnection(retries - 1);
        }
        
        logger.error('❌ All database connection attempts failed');
        return false;
    }
};

// Graceful startup
const initDatabase = async () => {
    const connected = await testConnection();
    if (!connected) {
        logger.error('Cannot start application without database connection');
        process.exit(1);
    }
};
```

---

## 📊 SPRINT 8: Testing & Quality Assurance (Week 4)

### 8.1 Test Cases Checklist

| Test ID | Category | Test Case | Expected Result | Priority |
|---------|----------|-----------|-----------------|----------|
| TC001 | Auth | Login dengan kredensial valid | Redirect ke dashboard sesuai role | Critical |
| TC002 | Auth | Login dengan kredensial invalid | Error message tampil | Critical |
| TC003 | Auth | Register peserta baru | Akun terbuat, bisa login | Critical |
| TC004 | Auth | Register guru baru | Status pending, tunggu approval | Critical |
| TC005 | Auth | Rate limit login (6x gagal) | Blocked 15 menit | High |
| TC006 | Admin | Approve guru | Status berubah active | Critical |
| TC007 | Admin | Reject guru dengan alasan | Status reject, alasan tersimpan | Critical |
| TC008 | Admin | Tambah kuota baru | Kuota tersimpan | High |
| TC009 | Admin | Edit kuota | Data terupdate | High |
| TC010 | Admin | Delete kuota | Kuota terhapus (konfirmasi) | High |
| TC011 | Peserta | Daftar P4 (kuota tersedia) | Pendaftaran berhasil | Critical |
| TC012 | Peserta | Daftar P4 (kuota penuh) | Error kuota penuh | High |
| TC013 | Mobile | Sidebar toggle | Sidebar open/close smooth | Medium |
| TC014 | Mobile | Form responsive | Form readable di mobile | High |
| TC015 | Mobile | Table responsive | Table scrollable/card view | Medium |

---

### 8.2 Manual Testing Script

```markdown
## Manual Testing Checklist - Fase 2

### A. Authentication Tests
- [ ] Login sebagai Admin
- [ ] Login sebagai Guru (active)
- [ ] Login sebagai Guru (pending) - should redirect to pending page
- [ ] Login sebagai Peserta
- [ ] Login dengan password salah
- [ ] Register peserta baru dengan semua field
- [ ] Register guru baru dengan semua field
- [ ] Logout dari setiap role

### B. Admin Dashboard Tests
- [ ] View semua statistics cards
- [ ] Recent pendaftaran tampil dengan nama
- [ ] Guru pending tampil di dashboard
- [ ] Quick approve guru
- [ ] Quick reject guru (harus ada alasan)
- [ ] Link ke halaman lain berfungsi

### C. Kuota Management Tests
- [ ] Buka modal tambah kuota
- [ ] Submit form tambah kuota
- [ ] Edit kuota existing
- [ ] Delete kuota (konfirmasi muncul)
- [ ] Cancel button modal berfungsi

### D. Guru Approval Tests
- [ ] Tab "Pending" menampilkan guru pending
- [ ] Tab "Terverifikasi" menampilkan guru active
- [ ] Tab "Ditolak" menampilkan guru reject
- [ ] Approve dengan modal
- [ ] Reject dengan alasan wajib

### E. Responsive Tests
- [ ] Mobile: Sidebar toggle berfungsi
- [ ] Mobile: Tables scrollable
- [ ] Mobile: Forms usable
- [ ] Tablet: Layout proper
- [ ] Desktop: Full layout

### F. Security Tests
- [ ] CSRF token ada di semua form
- [ ] Rate limit aktif (coba 6x login gagal)
- [ ] File upload hanya terima format valid
- [ ] Session expires setelah idle
```

---

## 📅 Timeline & Milestones

| Sprint | Durasi | Deliverables | Status |
|--------|--------|--------------|--------|
| Sprint 1 | Week 1 (Day 1-3) | Critical Bug Fixes | 🔲 TODO |
| Sprint 2 | Week 1-2 (Day 3-6) | Database Schema Updates | 🔲 TODO |
| Sprint 3 | Week 2 (Day 7-10) | Button & Function Fixes | 🔲 TODO |
| Sprint 4 | Week 2-3 (Day 10-14) | Responsive Design | 🔲 TODO |
| Sprint 5 | Week 3 (Day 14-17) | Security Enhancement | 🔲 TODO |
| Sprint 6 | Week 3-4 (Day 17-21) | Missing Features | 🔲 TODO |
| Sprint 7 | Week 4 (Day 21-24) | Error Handling | 🔲 TODO |
| Sprint 8 | Week 4 (Day 24-28) | Testing & QA | 🔲 TODO |

---

## 📋 Definition of Done (DoD)

Setiap item dianggap selesai jika:

1. ✅ Code di-commit ke repository
2. ✅ Tidak ada error di console (browser & server)
3. ✅ Fungsi bekerja sesuai expected behavior
4. ✅ Responsive di mobile, tablet, dan desktop
5. ✅ Manual testing passed
6. ✅ Code review (jika tim)
7. ✅ Dokumentasi di-update (jika perlu)

---

## 🎯 Success Metrics

| Metric | Target Fase 2 | Cara Ukur |
|--------|---------------|-----------|
| Bug Count | 0 Critical, 0 High | Issue tracker |
| Page Load Time | < 3 detik | Lighthouse |
| Mobile Usability | Score > 90 | Lighthouse |
| Form Success Rate | > 95% | Manual test |
| Button Functionality | 100% working | Checklist |
| Security Score | Grade A | Security audit |

---

## 📝 Notes untuk Developer

### Quick Reference - Files yang Sering Diubah

| Purpose | Files |
|---------|-------|
| Bug fixes views | `src/views/peserta/dashboard.ejs`, `src/views/admin/*.ejs` |
| Database changes | `database/migrations/`, `src/models/` |
| JavaScript fixes | `public/js/main.js`, `public/js/admin.js` |
| Responsive CSS | `public/css/responsive.css` |
| Security updates | `server.js`, `src/config/` |
| Error handling | `src/middlewares/errorMiddleware.js` |

### Command Reference

```bash
# Run development
npm run dev

# Run Tailwind CSS watch
npx tailwindcss -i ./src/input.css -o ./public/css/output.css --watch

# Run migrations
mysql -u root -p p4_jakarta < database/migrations/007_add_peserta_columns.sql

# Test database connection
node -e "require('./src/config/database').testConnection()"
```

---

## 📞 Contact & Support

- **Technical Lead**: [TBD]
- **Repository**: [TBD]
- **Documentation**: `/docs/`
- **Issue Tracker**: [TBD]

---

**Document Version**: 2.0
**Created**: Januari 2026
**Last Updated**: Januari 2026
**Author**: Tim Development P4 Jakarta
