-- Multi-tenant Lawyer Management System Database Schema (MySQL)
-- Using AUTO_INCREMENT for integer IDs

-- Tenants table (for multi-tenant SaaS)
CREATE TABLE IF NOT EXISTS tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    max_users INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'paralegal',
    is_active BOOLEAN DEFAULT true,
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tenant_email (tenant_id, email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    date_of_birth DATE,
    pan_number VARCHAR(20),
    aadhar_number VARCHAR(20),
    gstin VARCHAR(20),
    occupation VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- KYC Documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_number VARCHAR(100),
    file_path VARCHAR(500),
    expiry_date DATE,
    renewal_reminder_date DATE,
    is_verified BOOLEAN DEFAULT false,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    case_number VARCHAR(100) NOT NULL,
    client_id INT NOT NULL,
    cnr_number VARCHAR(100),
    court_name VARCHAR(255),
    court_type VARCHAR(100),
    case_type VARCHAR(100),
    case_stage VARCHAR(100) DEFAULT 'filing',
    subject VARCHAR(255),
    description TEXT,
    filing_date DATE,
    next_hearing_date TIMESTAMP NULL,
    last_hearing_date TIMESTAMP NULL,
    judgment_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(50) DEFAULT 'medium',
    assigned_to INT,
    billing_rate DECIMAL(10,2),
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tenant_case (tenant_id, case_number),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Case Documents table
CREATE TABLE IF NOT EXISTS case_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    document_type VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    extracted_text TEXT,
    ocr_processed BOOLEAN DEFAULT false,
    version INT DEFAULT 1,
    uploaded_by INT,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    case_id INT,
    client_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    due_date TIMESTAMP NULL,
    assigned_to INT,
    completed_at TIMESTAMP NULL,
    completed_by INT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    user_id INT NOT NULL,
    case_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NULL,
    location VARCHAR(255),
    google_event_id VARCHAR(255),
    outlook_event_id VARCHAR(255),
    reminder_minutes INT DEFAULT 30,
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL
);

-- Communication Logs table
CREATE TABLE IF NOT EXISTS communication_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    client_id INT NOT NULL,
    case_id INT,
    communication_type VARCHAR(50),
    direction VARCHAR(50),
    subject VARCHAR(255),
    content TEXT,
    sent_by INT,
    received_by INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attachments JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- Billing Records table
CREATE TABLE IF NOT EXISTS billing_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    case_id INT,
    client_id INT NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    billable_hours DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    expenses DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2),
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    gst_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_date TIMESTAMP NULL,
    due_date DATE,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tenant_invoice (tenant_id, invoice_number),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Time Tracking table
CREATE TABLE IF NOT EXISTS time_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(10,2) NOT NULL,
    description TEXT,
    billing_record_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (billing_record_id) REFERENCES billing_records(id) ON DELETE SET NULL
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_type VARCHAR(100),
    receipt_path VARCHAR(500),
    date_incurred DATE,
    billing_record_id INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (billing_record_id) REFERENCES billing_records(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Document Versions table
CREATE TABLE IF NOT EXISTS document_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    version_number INT NOT NULL,
    changes_made TEXT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES case_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_cases_tenant_id ON cases(tenant_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX idx_cases_next_hearing_date ON cases(next_hearing_date);
CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_tasks_case_id ON tasks(case_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_datetime ON calendar_events(start_datetime);
CREATE INDEX idx_billing_records_tenant_id ON billing_records(tenant_id);
CREATE INDEX idx_billing_records_case_id ON billing_records(case_id);
CREATE INDEX idx_time_entries_case_id ON time_entries(case_id);
CREATE INDEX idx_expenses_case_id ON expenses(case_id);

-- E-Signature Requests table
CREATE TABLE IF NOT EXISTS e_signature_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    document_id INT,
    provider VARCHAR(50) NOT NULL,
    agreement_id VARCHAR(255),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    signed_at TIMESTAMP NULL,
    signed_document_path VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES case_documents(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_e_signature_requests_tenant_id ON e_signature_requests(tenant_id);
CREATE INDEX idx_e_signature_requests_document_id ON e_signature_requests(document_id);

-- Insert default tenant (ignore if already exists)
INSERT IGNORE INTO tenants (name, domain, subscription_tier) 
VALUES ('Law Firm Associates', 'lawfirm', 'premium');

