-- Migration 001: Creazione tabella members
-- Rispetta rigorosamente il modello di dominio Pro-Local.
-- Gli stati ammessi sono vincolati al dominio: IN_ATTESA, ATTIVO, SOSPESO, RECEDUTO, ESCLUSO.
-- Non sono introdotte procedure associative o campi arbitrari nel database.

CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(64) PRIMARY KEY,
    codice_socio VARCHAR(64) NOT NULL UNIQUE,
    nome_cognome VARCHAR(255) NOT NULL,
    email_demo VARCHAR(255) NOT NULL,
    data_iscrizione DATE NOT NULL,
    membership_status VARCHAR(32) NOT NULL CHECK (
        membership_status IN ('IN_ATTESA', 'ATTIVO', 'SOSPESO', 'RECEDUTO', 'ESCLUSO')
    ),
    quota_sociale_in_regola BOOLEAN NOT NULL DEFAULT FALSE,
    note_amministrative_interne TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_members_status ON members(membership_status);
