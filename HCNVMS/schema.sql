-- Health Center New-born Vaccination Management System (HCNVMS)
-- Database Schema (patients, vaccines, inventory, users + supporting tables)

CREATE DATABASE IF NOT EXISTS hcnvms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hcnvms;

-- Patients (newborn registration)
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    nationality VARCHAR(100),
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(11) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(120) NOT NULL,
    state_province VARCHAR(120) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    emergency_contact_name VARCHAR(150) NOT NULL,
    emergency_contact_phone VARCHAR(11) NOT NULL,
    emergency_contact_relationship VARCHAR(80) NOT NULL,
    blood_type VARCHAR(5),
    allergies TEXT,
    medical_conditions TEXT,
    other_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_patient_name (last_name, first_name),
    INDEX idx_patient_dob (date_of_birth)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vaccines master list
CREATE TABLE IF NOT EXISTS vaccines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vaccine_name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    dosage VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    recommended_age_weeks INT DEFAULT 0,
    dose_number INT DEFAULT 1,
    is_mandatory TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory of vaccine stocks
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vaccine_id INT NOT NULL,
    quantity INT NOT NULL,
    expiration_date DATE NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vaccine_id) REFERENCES vaccines(id) ON DELETE CASCADE,
    INDEX idx_inventory_vaccine (vaccine_id),
    INDEX idx_inventory_expiration (expiration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Staff') NOT NULL DEFAULT 'Staff',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Legacy newborn + vaccination schedule tables (used by other modules)
CREATE TABLE IF NOT EXISTS newborns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    weight_at_birth DECIMAL(5,2),
    mother_name VARCHAR(200) NOT NULL,
    father_name VARCHAR(200),
    contact_number VARCHAR(20),
    address TEXT,
    registration_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dob (date_of_birth),
    INDEX idx_registration (registration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vaccination_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    newborn_id INT NOT NULL,
    vaccine_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    status ENUM('Pending', 'Completed', 'Missed', 'Cancelled') DEFAULT 'Pending',
    administered_date DATE NULL,
    administered_by VARCHAR(200),
    batch_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (newborn_id) REFERENCES newborns(id) ON DELETE CASCADE,
    FOREIGN KEY (vaccine_id) REFERENCES vaccines(id) ON DELETE CASCADE,
    INDEX idx_newborn (newborn_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vaccination_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    newborn_id INT NOT NULL,
    vaccine_id INT NOT NULL,
    administered_date DATE NOT NULL,
    administered_by VARCHAR(200) NOT NULL,
    batch_number VARCHAR(100),
    next_due_date DATE,
    side_effects TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES vaccination_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (newborn_id) REFERENCES newborns(id) ON DELETE CASCADE,
    FOREIGN KEY (vaccine_id) REFERENCES vaccines(id) ON DELETE CASCADE,
    INDEX idx_newborn (newborn_id),
    INDEX idx_administered_date (administered_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample vaccines
INSERT INTO vaccines (vaccine_name, description, dosage, category, recommended_age_weeks, dose_number, is_mandatory) VALUES
('BCG', 'Protection against tuberculosis', '0.05 mL', 'Core', 0, 1, 1),
('Hepatitis B (Birth Dose)', 'Hepatitis B first dose', '0.5 mL', 'Core', 0, 1, 1),
('OPV-0', 'Oral polio vaccine zero dose', '2 drops', 'Polio', 0, 1, 1)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Sample admin user (password hash = "password")
INSERT INTO users (full_name, username, password_hash, role)
VALUES ('System Admin', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);