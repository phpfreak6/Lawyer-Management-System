-- Legal Data Integration Tables
-- This migration adds tables for legal data searches and integrations

CREATE TABLE IF NOT EXISTS legal_data_searches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    search_type VARCHAR(100) NOT NULL COMMENT 'e.g., ecourts_cnr, gst_verification, pan_verification, digitallocker_verify',
    search_query VARCHAR(255) NOT NULL,
    result_data LONGTEXT,
    searched_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (searched_by) REFERENCES users(id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_search_type (search_type),
    INDEX idx_created_at (created_at)
);

-- Legal data sync table for case updates
CREATE TABLE IF NOT EXISTS case_sync_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    sync_type VARCHAR(50) NOT NULL COMMENT 'ecourts, status_update, judgment',
    sync_data LONGTEXT,
    sync_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    synced_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id),
    INDEX idx_sync_status (sync_status)
);

-- API configuration table
CREATE TABLE IF NOT EXISTS legal_api_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    api_provider VARCHAR(100) NOT NULL COMMENT 'ecourts, gst_api, pan_api, digitallocker, esign',
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    config_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_provider (tenant_id, api_provider),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_api_provider (api_provider)
);

