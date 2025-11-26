<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get single newborn
            $id = $_GET['id'];
            $stmt = $db->prepare("SELECT * FROM newborns WHERE id = ?");
            $stmt->execute([$id]);
            $newborn = $stmt->fetch();
            
            if ($newborn) {
                echo json_encode($newborn);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Newborn not found"]);
            }
        } else {
            // Get all newborns
            $search = $_GET['search'] ?? '';
            $query = "SELECT * FROM newborns";
            
            if ($search) {
                $query .= " WHERE first_name LIKE ? OR last_name LIKE ? OR mother_name LIKE ? OR contact_number LIKE ?";
                $searchParam = "%$search%";
                $stmt = $db->prepare($query);
                $stmt->execute([$searchParam, $searchParam, $searchParam, $searchParam]);
            } else {
                $stmt = $db->prepare($query);
                $stmt->execute();
            }
            
            $newborns = $stmt->fetchAll();
            echo json_encode($newborns);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        $stmt = $db->prepare("INSERT INTO newborns (first_name, last_name, date_of_birth, gender, weight_at_birth, mother_name, father_name, contact_number, address, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $result = $stmt->execute([
            $data['first_name'],
            $data['last_name'],
            $data['date_of_birth'],
            $data['gender'],
            $data['weight_at_birth'] ?? null,
            $data['mother_name'],
            $data['father_name'] ?? null,
            $data['contact_number'] ?? null,
            $data['address'] ?? null,
            $data['registration_date'] ?? date('Y-m-d')
        ]);
        
        if ($result) {
            $newbornId = $db->lastInsertId();
            
            // Auto-generate vaccination schedules based on recommended vaccines
            $vaccineStmt = $db->prepare("SELECT * FROM vaccines ORDER BY recommended_age_weeks, dose_number");
            $vaccineStmt->execute();
            $vaccines = $vaccineStmt->fetchAll();
            
            foreach ($vaccines as $vaccine) {
                $dob = new DateTime($data['date_of_birth']);
                $scheduledDate = clone $dob;
                $scheduledDate->modify("+{$vaccine['recommended_age_weeks']} weeks");
                
                $scheduleStmt = $db->prepare("INSERT INTO vaccination_schedules (newborn_id, vaccine_id, scheduled_date, status) VALUES (?, ?, ?, 'Pending')");
                $scheduleStmt->execute([$newbornId, $vaccine['id'], $scheduledDate->format('Y-m-d')]);
            }
            
            http_response_code(201);
            echo json_encode(["message" => "Newborn registered successfully", "id" => $newbornId]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Failed to register newborn"]);
        }
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $_GET['id'] ?? $data['id'];
        
        $stmt = $db->prepare("UPDATE newborns SET first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, weight_at_birth = ?, mother_name = ?, father_name = ?, contact_number = ?, address = ? WHERE id = ?");
        
        $result = $stmt->execute([
            $data['first_name'],
            $data['last_name'],
            $data['date_of_birth'],
            $data['gender'],
            $data['weight_at_birth'] ?? null,
            $data['mother_name'],
            $data['father_name'] ?? null,
            $data['contact_number'] ?? null,
            $data['address'] ?? null,
            $id
        ]);
        
        if ($result) {
            echo json_encode(["message" => "Newborn updated successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Failed to update newborn"]);
        }
        break;
        
    case 'DELETE':
        $id = $_GET['id'];
        $stmt = $db->prepare("DELETE FROM newborns WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            echo json_encode(["message" => "Newborn deleted successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Failed to delete newborn"]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}