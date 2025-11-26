<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
	http_response_code(500);
	echo json_encode(['message' => 'Database connection unavailable.']);
	exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
	case 'GET':
		handleGetInventory($db);
		break;
	case 'POST':
		handleAddInventory($db);
		break;
	default:
		http_response_code(405);
		echo json_encode(['message' => 'Method not allowed.']);
}

function handleGetInventory(PDO $db): void {
	$sql = "SELECT i.id, i.vaccine_id, v.vaccine_name, v.category, i.quantity, i.expiration_date,
				   i.batch_number, i.created_at
			FROM inventory i
			INNER JOIN vaccines v ON v.id = i.vaccine_id
			ORDER BY i.created_at DESC";

	$stmt = $db->prepare($sql);
	$stmt->execute();
	echo json_encode($stmt->fetchAll());
}

function handleAddInventory(PDO $db): void {
	$payload = json_decode(file_get_contents('php://input'), true);
	if (!$payload) {
		http_response_code(400);
		echo json_encode(['message' => 'Invalid JSON payload.']);
		return;
	}

	$required = ['vaccine_id', 'quantity', 'expiration_date', 'batch_number'];
	foreach ($required as $field) {
		if (empty($payload[$field])) {
			http_response_code(422);
			echo json_encode(['message' => ucfirst(str_replace('_', ' ', $field)) . ' is required.']);
			return;
		}
	}

	if ((int)$payload['quantity'] < 1) {
		http_response_code(422);
		echo json_encode(['message' => 'Quantity must be 1 or higher.']);
		return;
	}

	$expirationDate = DateTime::createFromFormat('Y-m-d', $payload['expiration_date']);
	if (!$expirationDate || $expirationDate < new DateTime('today')) {
		http_response_code(422);
		echo json_encode(['message' => 'Expiration date must be a future date.']);
		return;
	}

	// Ensure vaccine exists
	$checkVaccine = $db->prepare("SELECT id, vaccine_name FROM vaccines WHERE id = ?");
	$checkVaccine->execute([(int)$payload['vaccine_id']]);
	$vaccine = $checkVaccine->fetch();
	if (!$vaccine) {
		http_response_code(404);
		echo json_encode(['message' => 'Vaccine not found.']);
		return;
	}

	try {
		$stmt = $db->prepare(
			"INSERT INTO inventory (vaccine_id, quantity, expiration_date, batch_number)
			 VALUES (:vaccine_id, :quantity, :expiration, :batch)"
		);
		$stmt->execute([
			':vaccine_id' => (int)$payload['vaccine_id'],
			':quantity' => (int)$payload['quantity'],
			':expiration' => $payload['expiration_date'],
			':batch' => trim($payload['batch_number'])
		]);

		$newId = $db->lastInsertId();
		$recordStmt = $db->prepare(
			"SELECT i.id, i.vaccine_id, v.vaccine_name, v.category, i.quantity, i.expiration_date,
					i.batch_number, i.created_at
			 FROM inventory i
			 INNER JOIN vaccines v ON v.id = i.vaccine_id
			 WHERE i.id = ?"
		);
		$recordStmt->execute([$newId]);
		$newRecord = $recordStmt->fetch();

		http_response_code(201);
		echo json_encode([
			'message' => 'Stock added successfully.',
			'inventory' => $newRecord
		]);
	} catch (PDOException $exception) {
		http_response_code(500);
		echo json_encode(['message' => 'Failed to add inventory record.']);
	}
}

