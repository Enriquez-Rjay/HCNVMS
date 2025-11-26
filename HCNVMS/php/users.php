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
		$stmt = $db->prepare("SELECT id, full_name, username, role, created_at FROM users ORDER BY created_at DESC");
		$stmt->execute();
		echo json_encode($stmt->fetchAll());
		break;

	case 'POST':
		$data = json_decode(file_get_contents('php://input'), true);
		if (!$data) {
			http_response_code(400);
			echo json_encode(['message' => 'Invalid JSON payload.']);
			break;
		}

		$required = ['full_name', 'username', 'password', 'role'];
		foreach ($required as $field) {
			if (empty(trim($data[$field] ?? ''))) {
				http_response_code(422);
				echo json_encode(['message' => ucfirst(str_replace('_', ' ', $field)) . ' is required.']);
				return;
			}
		}

		$allowedRoles = ['Admin', 'Staff'];
		if (!in_array($data['role'], $allowedRoles, true)) {
			http_response_code(422);
			echo json_encode(['message' => 'Invalid role provided.']);
			return;
		}

		$check = $db->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
		$check->execute([trim($data['username'])]);
		if ((int)$check->fetchColumn() > 0) {
			http_response_code(409);
			echo json_encode(['message' => 'Username already exists.']);
			return;
		}

		$hash = password_hash($data['password'], PASSWORD_BCRYPT);

		$stmt = $db->prepare("INSERT INTO users (full_name, username, password_hash, role) VALUES (?, ?, ?, ?)");
		$result = $stmt->execute([
			trim($data['full_name']),
			trim($data['username']),
			$hash,
			$data['role']
		]);

		if ($result) {
			http_response_code(201);
			echo json_encode(['message' => 'User created successfully.']);
		} else {
			http_response_code(500);
			echo json_encode(['message' => 'Failed to create user.']);
		}
		break;

	default:
		http_response_code(405);
		echo json_encode(['message' => 'Method not allowed.']);
		break;
}

