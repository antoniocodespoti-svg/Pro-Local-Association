-- Migration 002: Creazione tabella business_activities
-- Relazione 1:N con members (nessun vincolo UNIQUE su member_id).
-- Cancellazione conservativa: ON DELETE RESTRICT (non CASCADE) per tutelare i dati associativi.
-- Gli stati di pubblicazione sono vincolati al dominio: BOZZA, IN_ATTESA_APPROVAZIONE, PUBBLICATA, SOSPESA, RIFIUTATA.

CREATE TABLE IF NOT EXISTS business_activities (
    id VARCHAR(64) PRIMARY KEY,
    member_id VARCHAR(64) NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    nome_attivita VARCHAR(255) NOT NULL,
    categoria VARCHAR(64) NOT NULL,
    descrizione_breve VARCHAR(255) NOT NULL,
    descrizione_completa TEXT NOT NULL,
    servizi_offerti TEXT NOT NULL, -- Serializzazione JSON dell'array stringhe
    localita VARCHAR(255) NOT NULL,
    indirizzo_pubblico VARCHAR(255),
    telefono_pubblico VARCHAR(64),
    email_pubblica VARCHAR(255),
    sito_web VARCHAR(255),
    social_instagram VARCHAR(255),
    social_linkedin VARCHAR(255),
    orari_apertura VARCHAR(255),
    publication_status VARCHAR(32) NOT NULL CHECK (
        publication_status IN ('BOZZA', 'IN_ATTESA_APPROVAZIONE', 'PUBBLICATA', 'SOSPESA', 'RIFIUTATA')
    ),
    data_ultimo_aggiornamento DATE NOT NULL,
    note_revisione_admin TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_member_id ON business_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_activities_pub_status ON business_activities(publication_status);
