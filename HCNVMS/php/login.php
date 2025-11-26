<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection unavailable.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!$payload) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON payload.']);
    exit;
}

$username = trim($payload['username'] ?? '');
$password = $payload['password'] ?? '';

if ($username === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['message' => 'Username and password are required.']);
    exit;
}

$stmt = $db->prepare('SELECT id, full_name, username, password_hash, role FROM users WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Invalid username or password.']);
    exit;
}

http_response_code(200);
echo json_encode([
    'message' => 'Login successful.',
    'user' => [
        'id' => $user['id'],
        'full_name' => $user['full_name'],
        'username' => $user['username'],
        'role' => $user['role'],
    ],
]);
