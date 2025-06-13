-- MySQL Database Setup Script for CEDO Auth System
-- This creates the database and required tables

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS cedo_auth;
USE cedo_auth;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'head_admin', 'manager', 'partner', 'reviewer') NOT NULL DEFAULT 'student',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create proposals table (main table for hybrid architecture)
CREATE TABLE IF NOT EXISTS proposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    organizationType VARCHAR(100),
    contactPerson VARCHAR(255) NOT NULL,
    contactEmail VARCHAR(255) NOT NULL,
    contactPhone VARCHAR(50),
    startDate DATE,
    endDate DATE,
    location VARCHAR(255),
    budget DECIMAL(10,2),
    objectives TEXT,
    volunteersNeeded INT,
    status ENUM('draft', 'pending', 'approved', 'rejected', 'completed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create access_logs table
CREATE TABLE IF NOT EXISTS access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert a test admin user (password: 'admin123')
INSERT IGNORE INTO users (name, email, password, role, is_verified) VALUES 
('Admin User', 'admin@cedo.com', '$2b$10$rQZ9jX3qY8kKqL1mN2oP4eE7vWxYzFgHtR5sA6bC8dU9iV0jK7lM.', 'head_admin', TRUE);

-- Show success message
SELECT 'Database setup completed successfully!' as message;
SELECT 'Tables created:' as info;
SHOW TABLES; 