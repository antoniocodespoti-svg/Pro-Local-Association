-- Migration 003: Creazione tabella audit_logs
-- Tabella append-only per tracciamento di sicurezza e audit trail tecnico-amministrativo.
-- Non consente alterazioni o cancellazioni tramite flussi applicativi ordinari.

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- Serializzazione JSON opzionale di metadati tecnici
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
