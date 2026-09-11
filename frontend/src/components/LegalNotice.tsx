import React from 'react';

interface LegalNoticeProps {
  customNote?: string;
}

/**
 * Banner di trasparenza e disaccoppiamento legale:
 * Evidenzia al pubblico che l'associazione non è intermediario,
 * non garantisce le prestazioni né certificherà commercialmente i soci.
 */
export const LegalNotice: React.FC<LegalNoticeProps> = ({ customNote }) => {
  return (
    <div
      style={{
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px 0',
        fontSize: '13px',
        color: '#475569',
        lineHeight: 1.5
      }}
    >
      <strong style={{ color: '#0F172A', display: 'block', marginBottom: '4px' }}>
        Nota di Trasparenza e Autonomia Professionale
      </strong>
      {customNote ||
        "La presente vetrina costituisce uno spazio informativo riservato ai soci dell'associazione Pro-Local in regola con i requisiti associativi interni. L'associazione Pro-Local non effettua verifiche di idoneità professionale o commerciale, non certifica né garantisce i servizi prestati dai soci, non assume obbligazioni contrattuali e non svolge attività di intermediazione nei rapporti tra i soci e i cittadini/committenti."}
    </div>
  );
};
