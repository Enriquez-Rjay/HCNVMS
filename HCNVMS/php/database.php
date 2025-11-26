<?php
/**
 * Database Configuration
 * Health Center New-born Vaccination Management System
 */

class Database {
    private $host = "localhost";
    private $db_name = "hcnvms";
    private $username = "root";
    private $password = "";
    public $conn;

    /**
     * Get database connection
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                )
            );
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}