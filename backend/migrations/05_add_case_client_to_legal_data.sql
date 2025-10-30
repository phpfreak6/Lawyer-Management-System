-- Add case_id and client_id columns to legal_data_searches table
-- This allows linking legal data searches to specific cases and clients

-- Add case_id column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'legal_data_searches';
SET @columnname = 'case_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT NULL")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add client_id column if it doesn't exist
SET @columnname = 'client_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.'",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT NULL")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign keys
ALTER TABLE legal_data_searches
ADD FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL;

ALTER TABLE legal_data_searches
ADD FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Add indexes if they don't exist
CREATE INDEX idx_case_id_new ON legal_data_searches(case_id);
CREATE INDEX idx_client_id_new ON legal_data_searches(client_id);

