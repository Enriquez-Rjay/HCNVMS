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
		handleGet($db);
		break;
	case 'POST':
		handlePost($db);
		break;
	default:
		http_response_code(405);
		echo json_encode(['message' => 'Method not allowed.']);
}

function handleGet(PDO $db): void {
	$query = "SELECT id, first_name, middle_name, last_name, suffix, date_of_birth, gender, 
						email, phone, address, city, state_province, zip_code, nationality,
						emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
						created_at
					FROM patients
					ORDER BY created_at DESC";

	$stmt = $db->prepare($query);
	$stmt->execute();
	echo json_encode($stmt->fetchAll());
}

function handlePost(PDO $db): void {
	$payload = json_decode(file_get_contents('php://input'), true);

	if (!$payload) {
		http_response_code(400);
		echo json_encode(['message' => 'Invalid JSON payload.']);
		return;
	}

	$requiredFields = [
		'firstName', 'lastName', 'dateOfBirth', 'gender',
		'email', 'phone', 'address', 'city', 'state', 'zipCode',
		'emergencyName', 'emergencyRelationship', 'emergencyPhone'
	];

	foreach ($requiredFields as $field) {
		if (empty(trim($payload[$field] ?? ''))) {
			http_response_code(422);
			echo json_encode(['message' => ucfirst($field) . ' is required.']);
			return;
		}
	}

	$nameFields = ['firstName', 'middleName', 'lastName'];
	$namePattern = "/^[A-Za-z\s\-.]+$/";
	foreach ($nameFields as $nameField) {
		if (isset($payload[$nameField]) && $payload[$nameField] !== '' && !preg_match($namePattern, $payload[$nameField])) {
			http_response_code(422);
			echo json_encode(['message' => 'Special characters are not allowed in name fields.']);
			return;
		}
	}

	// Ensure newborn age <= 12 months
	$dob = DateTime::createFromFormat('Y-m-d', $payload['dateOfBirth']);
	if (!$dob) {
		http_response_code(422);
		echo json_encode(['message' => 'Invalid date of birth.']);
		return;
	}
	$now = new DateTime();
	$ageInterval = $now->diff($dob);
	if ($dob > $now || $ageInterval->y > 1 || ($ageInterval->y === 1 && $ageInterval->m > 0)) {
		http_response_code(422);
		echo json_encode(['message' => 'Only newborn patients up to 12 months old can be registered.']);
		return;
	}

	$phonePattern = "/^\d{11}$/";
	if (!preg_match($phonePattern, $payload['phone']) || !preg_match($phonePattern, $payload['emergencyPhone'])) {
		http_response_code(422);
		echo json_encode(['message' => 'Phone numbers must be exactly 11 digits.']);
		return;
	}

	try {
		$stmt = $db->prepare(
			"INSERT INTO patients
				(first_name, middle_name, last_name, suffix, date_of_birth, gender,
				 nationality, email, phone, address, city, state_province, zip_code,
				 emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
				 blood_type, allergies, medical_conditions, other_conditions)
			 VALUES
				(:first_name, :middle_name, :last_name, :suffix, :dob, :gender,
				 :nationality, :email, :phone, :address, :city, :state, :zip,
				 :emergency_name, :emergency_phone, :emergency_relationship,
				 :blood_type, :allergies, :medical_conditions, :other_conditions)"
		);

		$medicalConditions = $payload['medicalConditions'] ?? [];
		if (is_array($medicalConditions)) {
			$medicalConditions = array_filter($medicalConditions);
		}

		$stmt->execute([
			':first_name' => trim($payload['firstName']),
			':middle_name' => trim($payload['middleName'] ?? '') ?: null,
			':last_name' => trim($payload['lastName']),
			':suffix' => trim($payload['suffixName'] ?? '') ?: null,
			':dob' => $payload['dateOfBirth'],
			':gender' => $payload['gender'],
			':nationality' => trim($payload['nationality'] ?? '') ?: null,
			':email' => trim($payload['email']),
			':phone' => $payload['phone'],
			':address' => trim($payload['address']),
			':city' => trim($payload['city']),
			':state' => trim($payload['state']),
			':zip' => trim($payload['zipCode']),
			':emergency_name' => trim($payload['emergencyName']),
			':emergency_phone' => $payload['emergencyPhone'],
			':emergency_relationship' => trim($payload['emergencyRelationship']),
			':blood_type' => $payload['bloodType'] ?? null,
			':allergies' => trim($payload['allergies'] ?? '') ?: null,
			':medical_conditions' => !empty($medicalConditions) ? implode(',', $medicalConditions) : null,
			':other_conditions' => trim($payload['otherConditions'] ?? '') ?: null,
		]);

		http_response_code(201);
		echo json_encode([
			'message' => 'Newborn registered successfully.',
			'patientId' => $db->lastInsertId()
		]);
	} catch (PDOException $exception) {
		http_response_code(500);
		echo json_encode(['message' => 'Failed to save patient record.']);
	}
}

