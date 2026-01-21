// ==============================================
// DASHBOARD.JS - Dashboard Interactions
// Website P4 Jakarta
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    initNotifications();
    initActivityLog();
    initQuickActions();
    initSearch();
});

// ==============================================
// CHART INITIALIZATION
// ==============================================
function initCharts() {
    // Pendaftaran Chart
    const pendaftaranCtx = document.getElementById('pendaftaranChart');
    if (pendaftaranCtx && typeof Chart !== 'undefined') {
        const chartData = pendaftaranCtx.dataset.values;
        const chartLabels = pendaftaranCtx.dataset.labels;
        
        try {
            new Chart(pendaftaranCtx, {
                type: 'line',
                data: {
                    labels: JSON.parse(chartLabels || '["Jan", "Feb", "Mar", "Apr", "May", "Jun"]'),
                    datasets: [{
                        label: 'Pendaftaran',
                        data: JSON.parse(chartData || '[0, 0, 0, 0, 0, 0]'),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        } catch (error) {
            console.error('Chart initialization error:', error);
        }
    }
    
    // Kuota Chart (Pie/Doughnut)
    const kuotaCtx = document.getElementById('kuotaChart');
    if (kuotaCtx && typeof Chart !== 'undefined') {
        const terisi = parseInt(kuotaCtx.dataset.terisi || '0');
        const tersedia = parseInt(kuotaCtx.dataset.tersedia || '100');
        
        try {
            new Chart(kuotaCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Terisi', 'Tersedia'],
                    datasets: [{
                        data: [terisi, tersedia - terisi],
                        backgroundColor: ['rgb(34, 197, 94)', 'rgb(229, 231, 235)'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        } catch (error) {
            console.error('Kuota chart error:', error);
        }
    }
}

// ==============================================
// NOTIFICATIONS
// ==============================================
function initNotifications() {
    const notifBtn = document.getElementById('notifButton');
    const notifPanel = document.getElementById('notifPanel');
    
    if (notifBtn && notifPanel) {
        notifBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notifPanel.classList.toggle('hidden');
        });
        
        document.addEventListener('click', function(e) {
            if (!notifPanel.contains(e.target) && e.target !== notifBtn) {
                notifPanel.classList.add('hidden');
            }
        });
    }
    
    // Mark notification as read
    document.querySelectorAll('.mark-read').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            const notifId = this.dataset.notifId;
            try {
                const response = await fetch(`/api/notifications/${notifId}/read`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    this.closest('.notification-item')?.classList.add('opacity-50');
                }
            } catch (error) {
                console.error('Mark read error:', error);
            }
        });
    });
}

// ==============================================
// ACTIVITY LOG
// ==============================================
function initActivityLog() {
    const loadMoreBtn = document.getElementById('loadMoreActivity');
    let currentPage = 1;
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', async function() {
            currentPage++;
            try {
                const response = await fetch(`/api/activity-log?page=${currentPage}`);
                const data = await response.json();
                
                if (data.success && data.activities.length > 0) {
                    const container = document.getElementById('activityContainer');
                    data.activities.forEach(activity => {
                        const activityHtml = createActivityItem(activity);
                        container.insertAdjacentHTML('beforeend', activityHtml);
                    });
                    
                    if (!data.hasMore) {
                        loadMoreBtn.classList.add('hidden');
                    }
                }
            } catch (error) {
                console.error('Load activity error:', error);
            }
        });
    }
}

function createActivityItem(activity) {
    const time = new Date(activity.created_at).toLocaleString('id-ID');
    return `
        <div class="flex items-start gap-3 py-2 border-b border-gray-100">
            <div class="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
            <div class="flex-1">
                <p class="text-sm text-gray-700">${escapeHtml(activity.description)}</p>
                <p class="text-xs text-gray-400">${time}</p>
            </div>
        </div>
    `;
}

// ==============================================
// QUICK ACTIONS
// ==============================================
function initQuickActions() {
    // Quick status toggle
    document.querySelectorAll('.quick-status-toggle').forEach(btn => {
        btn.addEventListener('click', async function() {
            const targetId = this.dataset.targetId;
            const targetType = this.dataset.targetType;
            const newStatus = this.dataset.newStatus;
            
            if (confirm('Ubah status menjadi ' + newStatus + '?')) {
                try {
                    const response = await fetch(`/api/${targetType}/${targetId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                    
                    if (response.ok) {
                        location.reload();
                    } else {
                        alert('Gagal mengubah status');
                    }
                } catch (error) {
                    console.error('Status toggle error:', error);
                    alert('Terjadi kesalahan');
                }
            }
        });
    });
}

// ==============================================
// SEARCH FUNCTIONALITY
// ==============================================
function initSearch() {
    const searchInput = document.getElementById('dashboardSearch');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;
    
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length < 2) {
                searchResults.classList.add('hidden');
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    
                    if (data.success && data.results.length > 0) {
                        searchResults.innerHTML = data.results.map(item => `
                            <a href="${item.url}" class="block px-4 py-2 hover:bg-gray-50">
                                <p class="text-sm font-medium text-gray-700">${escapeHtml(item.title)}</p>
                                <p class="text-xs text-gray-500">${escapeHtml(item.type)}</p>
                            </a>
                        `).join('');
                        searchResults.classList.remove('hidden');
                    } else {
                        searchResults.innerHTML = '<p class="px-4 py-2 text-sm text-gray-500">Tidak ada hasil</p>';
                        searchResults.classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        });
        
        // Close on click outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });
    }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto refresh dashboard data
function autoRefreshDashboard(interval = 60000) {
    setInterval(async () => {
        try {
            const response = await fetch('/api/dashboard/stats');
            const data = await response.json();
            
            if (data.success) {
                // Update displayed stats
                Object.keys(data.stats).forEach(key => {
                    const el = document.getElementById(`stat-${key}`);
                    if (el) el.textContent = data.stats[key];
                });
            }
        } catch (error) {
            console.error('Auto refresh error:', error);
        }
    }, interval);
}

// Format angka dengan separator
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

// Format tanggal Indonesia
function formatDate(date) {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(date));
}

console.log('Dashboard.js loaded');