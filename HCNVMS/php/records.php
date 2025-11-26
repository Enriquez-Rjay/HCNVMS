<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get single record by ID
            $id = $_GET['id'];
            $stmt = $db->prepare("
                SELECT vr.*, v.vaccine_name, v.description,
                       n.first_name, n.last_name, n.date_of_birth, n.mother_name
                FROM vaccination_records vr
                JOIN vaccines v ON vr.vaccine_id = v.id
                JOIN newborns n ON vr.newborn_id = n.id
                WHERE vr.id = ?
            ");
            $stmt->execute([$id]);
            $record = $stmt->fetch();
            if ($record) {
                echo json_encode($record);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Record not found"]);
            }
        } elseif (isset($_GET['newborn_id'])) {
            // Get records for a specific newborn
            $newbornId = $_GET['newborn_id'];
            $stmt = $db->prepare("
                SELECT vr.*, v.vaccine_name, v.description,
                       n.first_name, n.last_name, n.date_of_birth
                FROM vaccination_records vr
                JOIN vaccines v ON vr.vaccine_id = v.id
                JOIN newborns n ON vr.newborn_id = n.id
                WHERE vr.newborn_id = ?
                ORDER BY vr.administered_date DESC
            ");
            $stmt->execute([$newbornId]);
            $records = $stmt->fetchAll();
            echo json_encode($records);
        } else {
            // Get all records
            $stmt = $db->prepare("
                SELECT vr.*, v.vaccine_name, v.description,
                       n.first_name, n.last_name, n.date_of_birth, n.mother_name
                FROM vaccination_records vr
                JOIN vaccines v ON vr.vaccine_id = v.id
                JOIN newborns n ON vr.newborn_id = n.id
                ORDER BY vr.administered_date DESC
            ");
            $stmt->execute();
            $records = $stmt->fetchAll();
            echo json_encode($records);
        }
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Record ID is required"]);
            break;
        }

        $id = $_GET['id'];
        $data = json_decode(file_get_contents("php://input"), true);

        $stmt = $db->prepare("UPDATE vaccination_records
                              SET administered_date = ?,
                                  administered_by = ?,
                                  batch_number = ?,
                                  side_effects = ?,
                                  notes = ?
                              WHERE id = ?");

        $result = $stmt->execute([
            $data['administered_date'] ?? null,
            $data['administered_by'] ?? null,
            $data['batch_number'] ?? null,
            $data['side_effects'] ?? null,
            $data['notes'] ?? null,
            $id
        ]);

        if ($result) {
            echo json_encode(["message" => "Vaccination record updated successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Failed to update vaccination record"]);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Record ID is required"]);
            break;
        }

        $id = $_GET['id'];
        $stmt = $db->prepare("DELETE FROM vaccination_records WHERE id = ?");
        $result = $stmt->execute([$id]);

        if ($result) {
            echo json_encode(["message" => "Vaccination record deleted successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Failed to delete vaccination record"]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        $stmt = $db->prepare("INSERT INTO vaccination_records (schedule_id, newborn_id, vaccine_id, administered_date, administered_by, batch_number, next_due_date, side_effects, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $result = $stmt->execute([
            $data['schedule_id'] ?? null,
            $data['newborn_id'],
            $data['vaccine_id'],
            $data['administered_date'],
            $data['administered_by'],
            $data['batch_number'] ?? null,
            $data['next_due_date'] ?? null,
            $data['side_effects'] ?? null,
            $data['notes'] ?? null
        ]);
        
        if ($result) {
            // Update schedule status if schedule_id is provided
            if (isset($data['schedule_id'])) {
                $updateStmt = $db->prepare("UPDATE vaccination_schedules SET status = 'Completed', administered_date = ?, administered_by = ?, batch_number = ? WHERE id = ?");
                $updateStmt->execute([
                    $data['administered_date'],
                    $data['administered_by'],
                    $data['batch_number'] ?? null,
                    $data['schedule_id']
                ]);
            }
            
            http_response_code(201);
            echo json_encode(["message" => "Vaccination record created successfully", "id" => $db->lastInsertId()]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Failed to create vaccination record"]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}