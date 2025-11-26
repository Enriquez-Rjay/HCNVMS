<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

// Get dashboard statistics
$stats = [];

// Total newborns
$stmt = $db->query("SELECT COUNT(*) as total FROM newborns");   
$stats['total_newborns'] = $stmt->fetch()['total'];

// Total vaccines
$stmt = $db->query("SELECT COUNT(*) as total FROM vaccines");
$stats['total_vaccines'] = $stmt->fetch()['total'];

// Pending vaccinations
$stmt = $db->query("SELECT COUNT(*) as total FROM vaccination_schedules WHERE status = 'Pending'");
$stats['pending_vaccinations'] = $stmt->fetch()['total'];

// Completed vaccinations
$stmt = $db->query("SELECT COUNT(*) as total FROM vaccination_schedules WHERE status = 'Completed'");
$stats['completed_vaccinations'] = $stmt->fetch()['total'];

// Missed vaccinations
$stmt = $db->query("SELECT COUNT(*) as total FROM vaccination_schedules WHERE status = 'Missed'");
$stats['missed_vaccinations'] = $stmt->fetch()['total'];

// Upcoming vaccinations (next 7 days)
$stmt = $db->prepare("
    SELECT COUNT(*) as total 
    FROM vaccination_schedules 
    WHERE status = 'Pending' 
    AND scheduled_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
");
$stmt->execute();
$stats['upcoming_vaccinations'] = $stmt->fetch()['total'];

// Recent registrations (last 30 days)
$stmt = $db->query("
    SELECT COUNT(*) as total 
    FROM newborns 
    WHERE registration_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
");
$stats['recent_registrations'] = $stmt->fetch()['total'];

// Vaccination completion rate
if ($stats['total_newborns'] > 0) {
    $stmt = $db->query("
        SELECT 
            COUNT(DISTINCT newborn_id) as vaccinated_count
        FROM vaccination_records
    ");
    $vaccinatedCount = $stmt->fetch()['vaccinated_count'];
    $stats['vaccination_rate'] = round(($vaccinatedCount / $stats['total_newborns']) * 100, 2);
} else {
    $stats['vaccination_rate'] = 0;
}

echo json_encode($stats);