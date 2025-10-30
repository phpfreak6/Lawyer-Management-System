-- Tenant-level reminder settings and logs

CREATE TABLE IF NOT EXISTS tenant_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  hearing_reminder_minutes INT DEFAULT 60,
  filing_reminder_minutes INT DEFAULT 60,
  task_reminder_minutes INT DEFAULT 60,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_tenant_settings (tenant_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reminders_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'hearing' | 'filing' | 'task' | 'kyc'
  entity_id INT NOT NULL,
  recipient VARCHAR(255) NOT NULL, -- email or phone
  channel VARCHAR(20) NOT NULL, -- 'email' | 'sms'
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_reminder (tenant_id, entity_type, entity_id, recipient, channel),
  INDEX idx_tenant_time (tenant_id, sent_at),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);


