-- Add WhatsApp support to reminders

-- Add whatsapp_enabled flag to tenant_settings if missing
ALTER TABLE tenant_settings
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false AFTER sms_enabled;

-- No strict enum on reminders_log.channel, but ensure index/uniqueness remains valid
-- Existing UNIQUE and INDEX constraints already cover new channel values like 'whatsapp'


