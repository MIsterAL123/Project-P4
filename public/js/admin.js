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
    initConfirmActions();
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
            const titleEl = document.getElementById('kuotaModalTitle');
            if (titleEl) titleEl.textContent = 'Tambah Kuota Baru';
            if (form) {
                form.reset();
                form.action = '/admin/kuota';
            }
            const methodInput = document.getElementById('kuotaMethod');
            if (methodInput) methodInput.value = 'POST';
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }
    
    // Close modal functions
    function closeModal() {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Close on backdrop click
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }
}

// Edit kuota - dipanggil dari onclick di view
function editKuota(id, tahunAjaran, maxPeserta, status) {
    const modal = document.getElementById('kuotaModal');
    const form = document.getElementById('kuotaForm');
    
    const titleEl = document.getElementById('kuotaModalTitle');
    if (titleEl) titleEl.textContent = 'Edit Kuota';
    
    const tahunAjaranEl = document.getElementById('tahunAjaran');
    if (tahunAjaranEl) tahunAjaranEl.value = tahunAjaran;
    
    const maxPesertaEl = document.getElementById('maxPeserta');
    if (maxPesertaEl) maxPesertaEl.value = maxPeserta;
    
    const statusKuotaEl = document.getElementById('statusKuota');
    if (statusKuotaEl) statusKuotaEl.value = status;
    
    if (form) form.action = `/admin/kuota/${id}`;
    
    const methodEl = document.getElementById('kuotaMethod');
    if (methodEl) methodEl.value = 'PUT';
    
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
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
    
    function closeModal() {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }
    
    if (openBtn && modal) {
        openBtn.addEventListener('click', function() {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    // Close on backdrop click
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }
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

// Reject with reason - called from dashboard quick reject
function promptRejectReason(form) {
    const reason = prompt('Masukkan alasan penolakan:');
    if (!reason || reason.trim() === '') {
        alert('Alasan penolakan wajib diisi!');
        return false;
    }
    const input = form.querySelector('input[name="rejection_reason"]');
    if (input) input.value = reason;
    return true;
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
// CONFIRM ACTIONS
// ==============================================
function initConfirmActions() {
    document.querySelectorAll('.confirm-action').forEach(form => {
        form.addEventListener('submit', function(e) {
            const message = this.dataset.confirm || 'Apakah Anda yakin?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
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
            const totalAdminEl = document.getElementById('totalAdmin');
            if (totalAdminEl) totalAdminEl.textContent = data.stats.totalAdmin;
            
            const totalGuruEl = document.getElementById('totalGuru');
            if (totalGuruEl) totalGuruEl.textContent = data.stats.totalGuru;
            
            const totalPesertaEl = document.getElementById('totalPeserta');
            if (totalPesertaEl) totalPesertaEl.textContent = data.stats.totalPeserta;
            
            const kuotaTersediaEl = document.getElementById('kuotaTersedia');
            if (kuotaTersediaEl) kuotaTersediaEl.textContent = data.stats.kuotaTersedia;
        }
    } catch (error) {
        console.error('Failed to refresh stats:', error);
    }
}

// Print section
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const clone = section.cloneNode(true);
        // Remove elements that shouldn't appear in print (marked .no-print)
        clone.querySelectorAll('.no-print').forEach(el => el.remove());

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Tidak dapat membuka jendela cetak. Pastikan pop-up tidak diblokir.');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print - P4 Jakarta</title>
                    <link href="/css/output.css" rel="stylesheet">
                    <style>
                        body { padding: 2rem; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    ${clone.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
    }
}

// Register print button handler (CSP-friendly)
document.addEventListener('DOMContentLoaded', function() {
    const printBtn = document.getElementById('btn-print-report');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            printSection('report-root');
        });
    }
});

console.log('Admin.js loaded');