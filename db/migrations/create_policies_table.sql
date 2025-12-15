-- Create policies table for storing Terms & Conditions, Privacy Policy, Shipping Policy, and Refund Policy
-- Supports versioning and status management (draft, published, archived)

CREATE TABLE IF NOT EXISTS policies (
    id VARCHAR(255) PRIMARY KEY,
    type ENUM('terms', 'privacy', 'shipping', 'refund') NOT NULL,
    title VARCHAR(500) NOT NULL,
    content LONGTEXT NOT NULL,
    version INT NOT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    last_updated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Unique constraint: prevent duplicate versions for same type
    UNIQUE KEY unique_type_version (type, version),
    
    -- Index for efficient queries of active policies
    INDEX idx_type_status (type, status),
    
    -- Index for version queries
    INDEX idx_type_version (type, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

