-- Migration 005: Aggiunta ruolo direttivo PRESIDENTE a members e creazione tabella activity_revisions

-- 1. Estensione tabella members con la carica direttiva PRESIDENTE
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS ruolo_direttivo VARCHAR(32) NULL;

ALTER TABLE members 
ADD CONSTRAINT chk_ruolo_direttivo_presidente 
CHECK (ruolo_direttivo IS NULL OR ruolo_direttivo = 'PRESIDENTE');

CREATE UNIQUE INDEX IF NOT EXISTS uq_presidente_in_carica 
ON members(ruolo_direttivo) 
WHERE ruolo_direttivo = 'PRESIDENTE';

-- 2. Creazione tabella activity_revisions per il workflow approvativo non distruttivo
CREATE TABLE IF NOT EXISTS activity_revisions (
    id VARCHAR(64) PRIMARY KEY,
    activity_id VARCHAR(64) NOT NULL REFERENCES business_activities(id) ON DELETE CASCADE,
    member_id VARCHAR(64) NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    nome_attivita VARCHAR(255) NOT NULL,
    categoria VARCHAR(64) NOT NULL,
    descrizione_breve VARCHAR(255) NOT NULL,
    descrizione_completa TEXT NOT NULL,
    servizi_offerti TEXT NOT NULL,
    localita VARCHAR(255) NOT NULL,
    indirizzo_pubblico VARCHAR(255),
    telefono_pubblico VARCHAR(64),
    email_pubblica VARCHAR(255),
    sito_web VARCHAR(255),
    social_instagram VARCHAR(255),
    social_linkedin VARCHAR(255),
    orari_apertura VARCHAR(255),
    revision_status VARCHAR(32) NOT NULL CHECK (
        revision_status IN ('IN_ATTESA_APPROVAZIONE', 'PUBBLICATA', 'RIFIUTATA')
    ),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(64) REFERENCES members(id) ON DELETE RESTRICT,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_revisions_activity_id ON activity_revisions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_revisions_status ON activity_revisions(revision_status);
CREATE INDEX IF NOT EXISTS idx_activity_revisions_member_id ON activity_revisions(member_id);
