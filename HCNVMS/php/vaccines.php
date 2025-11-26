<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
	case 'GET':
		if (isset($_GET['id'])) {
			$id = $_GET['id'];
			$stmt = $db->prepare("SELECT * FROM vaccines WHERE id = ?");
			$stmt->execute([$id]);
			$vaccine = $stmt->fetch();
			
			if ($vaccine) {
				echo json_encode($vaccine);
			} else {
				http_response_code(404);
				echo json_encode(["message" => "Vaccine not found"]);
			}
		} else {
			$stmt = $db->prepare("SELECT * FROM vaccines ORDER BY recommended_age_weeks, dose_number");
			$stmt->execute();
			$vaccines = $stmt->fetchAll();
			echo json_encode($vaccines);
		}
		break;
		
	case 'POST':
		$data = json_decode(file_get_contents("php://input"), true);
		
		$stmt = $db->prepare("INSERT INTO vaccines (vaccine_name, description, recommended_age_weeks, dose_number, is_mandatory)
						  VALUES (?, ?, ?, ?, ?)");
					  
		$result = $stmt->execute([
			$data['vaccine_name'],
			$data['description'] ?? null,
			$data['recommended_age_weeks'],
			$data['dose_number'],
			$data['is_mandatory'] ?? true
		]);
					  
		if ($result) {
			http_response_code(201);
			echo json_encode(["message" => "Vaccine added successfully", "id" => $db->lastInsertId()]);
		} else {
			http_response_code(400);
			echo json_encode(["message" => "Failed to add vaccine"]);
		}
		break;
		
	case 'PUT':
		$data = json_decode(file_get_contents("php://input"), true);
		$id = $_GET['id'] ?? $data['id'];
		
		$stmt = $db->prepare("UPDATE vaccines SET vaccine_name = ?, description = ?, recommended_age_weeks = ?, dose_number = ?, is_mandatory = ? WHERE id = ?");
					  
		$result = $stmt->execute([
			$data['vaccine_name'],
			$data['description'] ?? null,
			$data['recommended_age_weeks'],
			$data['dose_number'],
			$data['is_mandatory'] ?? true,
			$id
		]);
					  
		if ($result) {
			echo json_encode(["message" => "Vaccine updated successfully"]);
		} else {
			http_response_code(400);
			echo json_encode(["message" => "Failed to update vaccine"]);
		}
		break;
		
	case 'DELETE':
		$id = $_GET['id'];
		$stmt = $db->prepare("DELETE FROM vaccines WHERE id = ?");
		$result = $stmt->execute([$id]);
				  
		if ($result) {
			echo json_encode(["message" => "Vaccine deleted successfully"]);
		} else {
			http_response_code(400);
			echo json_encode(["message" => "Failed to delete vaccine"]);
		}
		break;
		
	default:
		http_response_code(405);
		echo json_encode(["message" => "Method not allowed"]);
		break;
}