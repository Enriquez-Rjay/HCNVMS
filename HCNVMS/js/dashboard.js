/**
 * Dashboard JavaScript
 */

let dashboardStats = {};

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadRecentRegistrations();
    loadUpcomingVaccinations();
});

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    try {
        const stats = await apiRequest('dashboard.php');
        dashboardStats = stats;
        
        // Update stat cards
        document.getElementById('totalNewborns').textContent = stats.total_newborns || 0;
        document.getElementById('totalVaccines').textContent = stats.total_vaccines || 0;
        document.getElementById('pendingVaccinations').textContent = stats.pending_vaccinations || 0;
        document.getElementById('completedVaccinations').textContent = stats.completed_vaccinations || 0;
        document.getElementById('missedVaccinations').textContent = stats.missed_vaccinations || 0;
        document.getElementById('upcomingVaccinations').textContent = stats.upcoming_vaccinations || 0;

        const vaccinationRateEl = document.getElementById('vaccinationRate');
        if (vaccinationRateEl) {
            const rate = stats.vaccination_rate || 0;
            vaccinationRateEl.textContent = rate + '%';
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Load recent registrations
 */
async function loadRecentRegistrations() {
    try {
        const newborns = await apiRequest('newborns.php');
        const recent = newborns.slice(0, 5).sort((a, b) => 
            new Date(b.registration_date) - new Date(a.registration_date)
        );
        
        const container = document.getElementById('recentRegistrations');
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-state">No recent registrations</p>';
            return;
        }
        
        container.innerHTML = recent.map(newborn => `
            <div style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">
                <strong>${newborn.first_name} ${newborn.last_name}</strong><br>
                <small style="color: #6b7280;">
                    DOB: ${formatDate(newborn.date_of_birth)} | 
                    Registered: ${formatDate(newborn.registration_date)}
                </small>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('recentRegistrations').innerHTML = 
            '<p class="empty-state">Error loading recent registrations</p>';
    }
}

/**
 * Load upcoming vaccinations
 */
async function loadUpcomingVaccinations() {
    try {
        const schedules = await apiRequest('schedules.php?status=Pending');
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const upcoming = schedules
            .filter(schedule => {
                const scheduledDate = new Date(schedule.scheduled_date);
                return scheduledDate >= today && scheduledDate <= nextWeek;
            })
            .slice(0, 5)
            .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
        
        const container = document.getElementById('upcomingList');
        
        if (upcoming.length === 0) {
            container.innerHTML = '<p class="empty-state">No upcoming vaccinations</p>';
            return;
        }
        
        container.innerHTML = upcoming.map(schedule => `
            <div style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">
                <strong>${schedule.vaccine_name}</strong><br>
                <small style="color: #6b7280;">
                    ${schedule.first_name} ${schedule.last_name} | 
                    Scheduled: ${formatDate(schedule.scheduled_date)}
                </small>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('upcomingList').innerHTML = 
            '<p class="empty-state">Error loading upcoming vaccinations</p>';
    }
}