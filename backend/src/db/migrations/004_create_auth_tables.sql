-- Migration 004: Creazione tabelle user_accounts e sessions
-- Separazione ontologica tra Identità Autenticabile (UserAccount) e Membro (Member).
-- Vincoli di integrità: TECHNICAL_ADMIN deve avere member_id NULL; MEMBER deve avere member_id NOT NULL e univoco.
-- Le sessioni sono collegate a user_accounts tramite ON DELETE CASCADE.

CREATE TABLE IF NOT EXISTS user_accounts (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    actor_type VARCHAR(32) NOT NULL CHECK (actor_type IN ('MEMBER', 'TECHNICAL_ADMIN')),
    member_id VARCHAR(64) NULL REFERENCES members(id) ON DELETE RESTRICT,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_accounts_member_id UNIQUE(member_id),
    CONSTRAINT chk_actor_type_member CHECK (
        (actor_type = 'TECHNICAL_ADMIN' AND member_id IS NULL) OR
        (actor_type = 'MEMBER' AND member_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_member_id ON user_accounts(member_id);

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
