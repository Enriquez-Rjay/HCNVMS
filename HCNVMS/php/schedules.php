<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['newborn_id'])) {
            // Get schedules for a specific newborn
            $newbornId = $_GET['newborn_id'];
            $stmt = $db->prepare("
                SELECT vs.*, v.vaccine_name, v.description, v.recommended_age_weeks,
                       n.first_name, n.last_name, n.date_of_birth
                FROM vaccination_schedules vs
                JOIN vaccines v ON vs.vaccine_id = v.id
                JOIN newborns n ON vs.newborn_id = n.id
                WHERE vs.newborn_id = ?
                ORDER BY vs.scheduled_date
            ");
            $stmt->execute([$newbornId]);
            $schedules = $stmt->fetchAll();
            echo json_encode($schedules);
        } else if (isset($_GET['status'])) {
            // Get schedules by status
            $status = $_GET['status'];
            $stmt = $db->prepare("
                SELECT vs.*, v.vaccine_name, v.description,
                       n.first_name, n.last_name, n.date_of_birth, n.mother_name, n.contact_number
                FROM vaccination_schedules vs
                JOIN vaccines v ON vs.vaccine_id = v.id
                JOIN newborns n ON vs.newborn_id = n.id
                WHERE vs.status = ?
                ORDER BY vs.scheduled_date
            ");
            $stmt->execute([$status]);
            $schedules = $stmt->fetchAll();
            echo json_encode($schedules);
        } else {
            // Get all schedules
            $stmt = $db->prepare("
                SELECT vs.*, v.vaccine_name, v.description,
                       n.first_name, n.last_name, n.date_of_birth
                FROM vaccination_schedules vs
                JOIN vaccines v ON vs.vaccine_id = v.id
                JOIN newborns n ON vs.newborn_id = n.id
                ORDER BY vs.scheduled_date DESC
            ");
            $stmt->execute();
            $schedules = $stmt->fetchAll();
            echo json_encode($schedules);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        $stmt = $db->prepare("INSERT INTO vaccination_schedules (newborn_id, vaccine_id, scheduled_date, status) VALUES (?, ?, ?, ?)");
        
        $result = $stmt->execute([
            $data['newborn_id'],
            $data['vaccine_id'],
            $data['scheduled_date'],
            $data['status'] ?? 'Pending'
        ]);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(["message" => "Schedule created successfully", "id" => $db->lastInsertId()]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Failed to create schedule"]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $_GET['id'] ?? $data['id'];
        
        $stmt = $db->prepare("UPDATE vaccination_schedules SET scheduled_date = ?, status = ?, administered_date = ?, administered_by = ?, batch_number = ?, notes = ? WHERE id = ?");
        
        $result = $stmt->execute([
            $data['scheduled_date'],
            $data['status'],
            $data['administered_date'] ?? null,
            $data['administered_by'] ?? null,
            $data['batch_number'] ?? null,
            $data['notes'] ?? null,
            $id
        ]);
        
        if ($result) {
            // If status is completed, create a vaccination record
            if ($data['status'] === 'Completed' && $data['administered_date']) {
                $scheduleStmt = $db->prepare("SELECT * FROM vaccination_schedules WHERE id = ?");
                $scheduleStmt->execute([$id]);
                $schedule = $scheduleStmt->fetch();
                
                if ($schedule) {
                    $recordStmt = $db->prepare("INSERT INTO vaccination_records (schedule_id, newborn_id, vaccine_id, administered_date, administered_by, batch_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $recordStmt->execute([
                        $id,
                        $schedule['newborn_id'],
                        $schedule['vaccine_id'],
                        $data['administered_date'],
                        $data['administered_by'],
                        $data['batch_number'] ?? null,
                        $data['notes'] ?? null
                    ]);
                }
            }
            
            echo json_encode(["message" => "Schedule updated successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Failed to update schedule"]);
        }
        break;
        
    case 'DELETE':
        $id = $_GET['id'];
        $stmt = $db->prepare("DELETE FROM vaccination_schedules WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            echo json_encode(["message" => "Schedule deleted successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Failed to delete schedule"]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}