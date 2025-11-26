<?php
// Central PHP config for MySQL connection
// Uses the Database class defined in php/database.php

require_once __DIR__ . '/database.php';

// Instantiate Database and get PDO connection
$database = new Database();
$db = $database->getConnection();

// Optional: simple check (you can remove this in production)
if (!$db) {
	die('Database connection could not be established.');
}
?>