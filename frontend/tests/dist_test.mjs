// tests/frontend_components.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";
import React2 from "react";
import { renderToStaticMarkup } from "react-dom/server";

// src/components/LegalNotice.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var LegalNotice = ({ customNote }) => {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        backgroundColor: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: "8px",
        padding: "16px",
        margin: "16px 0",
        fontSize: "13px",
        color: "#475569",
        lineHeight: 1.5
      },
      children: [
        /* @__PURE__ */ jsx("strong", { style: { color: "#0F172A", display: "block", marginBottom: "4px" }, children: "Nota di Trasparenza e Autonomia Professionale" }),
        customNote || "La presente vetrina costituisce uno spazio informativo riservato ai soci dell'associazione Pro-Local in regola con i requisiti associativi interni. L'associazione Pro-Local non effettua verifiche di idoneit\xE0 professionale o commerciale, non certifica n\xE9 garantisce i servizi prestati dai soci, non assume obbligazioni contrattuali e non svolge attivit\xE0 di intermediazione nei rapporti tra i soci e i cittadini/committenti."
      ]
    }
  );
};

// src/components/ActivityCard.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var ActivityCard = ({ activity, onSelect }) => {
  return /* @__PURE__ */ jsxs2(
    "article",
    {
      onClick: () => onSelect?.(activity),
      style: {
        border: "1px solid #E2E8F0",
        borderRadius: "10px",
        padding: "20px",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        cursor: onSelect ? "pointer" : "default",
        transition: "transform 0.15s ease, box-shadow 0.15s ease"
      },
      children: [
        /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsx2("h3", { style: { margin: 0, fontSize: "18px", fontWeight: 600, color: "#0F172A" }, children: activity.nomeAttivita }),
          /* @__PURE__ */ jsx2("span", { style: { fontSize: "12px", color: "#64748B", textTransform: "capitalize" }, children: activity.categoria.replace("_", " ") })
        ] }),
        /* @__PURE__ */ jsx2("p", { style: { fontSize: "14px", color: "#334155", margin: "8px 0 14px 0", lineHeight: 1.4 }, children: activity.descrizioneBreve }),
        /* @__PURE__ */ jsx2("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }, children: activity.serviziOfferti.map((servizio, idx) => /* @__PURE__ */ jsx2(
          "span",
          {
            style: {
              fontSize: "12px",
              backgroundColor: "#F1F5F9",
              color: "#475569",
              padding: "3px 8px",
              borderRadius: "4px"
            },
            children: servizio
          },
          idx
        )) }),
        /* @__PURE__ */ jsxs2("div", { style: { fontSize: "13px", color: "#64748B", display: "flex", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxs2("span", { children: [
            "\u{1F4CD} ",
            activity.localita
          ] }),
          activity.telefonoPubblico && /* @__PURE__ */ jsxs2("span", { children: [
            "\u{1F4DE} ",
            activity.telefonoPubblico
          ] })
        ] })
      ]
    }
  );
};

// src/components/ShowcaseView.tsx
import { useState } from "react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var ShowcaseView = ({
  activities,
  loading = false,
  error = null,
  onSelectActivity
}) => {
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const categories = Array.from(new Set(activities.map((a) => a.categoria)));
  const filtered = activities.filter((act) => {
    const matchesCategory = filterCategory === "all" || act.categoria === filterCategory;
    const matchesQuery = searchQuery.trim() === "" || act.nomeAttivita.toLowerCase().includes(searchQuery.toLowerCase()) || act.descrizioneBreve.toLowerCase().includes(searchQuery.toLowerCase()) || act.localita.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });
  return /* @__PURE__ */ jsxs3("div", { style: { maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" }, children: [
    /* @__PURE__ */ jsxs3("header", { style: { marginBottom: "24px" }, children: [
      /* @__PURE__ */ jsx3("h1", { style: { fontSize: "28px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }, children: "Vetrina delle Attivit\xE0 dei Soci" }),
      /* @__PURE__ */ jsx3("p", { style: { fontSize: "15px", color: "#64748B", margin: 0 }, children: "Spazio informativo delle attivit\xE0 professionali, commerciali e artigianali promosse dai soci di Pro-Local." })
    ] }),
    /* @__PURE__ */ jsx3(LegalNotice, {}),
    error && /* @__PURE__ */ jsx3(
      "div",
      {
        style: {
          padding: "16px",
          backgroundColor: "#FEF2F2",
          border: "1px solid #F87171",
          borderRadius: "8px",
          color: "#991B1B",
          margin: "20px 0"
        },
        children: error
      }
    ),
    /* @__PURE__ */ jsxs3("div", { style: { display: "flex", gap: "12px", margin: "20px 0", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsx3(
        "input",
        {
          type: "text",
          placeholder: "Cerca attivit\xE0 per nome, descrizione o localit\xE0...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          style: {
            flex: "1 1 250px",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #CBD5E1",
            fontSize: "14px"
          }
        }
      ),
      /* @__PURE__ */ jsxs3(
        "select",
        {
          value: filterCategory,
          onChange: (e) => setFilterCategory(e.target.value),
          style: {
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #CBD5E1",
            backgroundColor: "#FFFFFF",
            fontSize: "14px"
          },
          children: [
            /* @__PURE__ */ jsx3("option", { value: "all", children: "Tutte le categorie" }),
            categories.map((cat) => /* @__PURE__ */ jsx3("option", { value: cat, children: cat.replace(/_/g, " ") }, cat))
          ]
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsx3("div", { style: { padding: "40px", textAlign: "center", color: "#64748B" }, children: /* @__PURE__ */ jsx3("p", { children: "Caricamento vetrina pubblica in corso..." }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx3(
      "div",
      {
        style: {
          padding: "40px 20px",
          textAlign: "center",
          backgroundColor: "#FFFFFF",
          border: "1px dashed #CBD5E1",
          borderRadius: "8px",
          color: "#64748B"
        },
        children: /* @__PURE__ */ jsx3("p", { style: { margin: 0, fontSize: "15px" }, children: "Nessuna attivit\xE0 corrisponde ai criteri di ricerca o risulta pubblicata nella vetrina." })
      }
    ) : /* @__PURE__ */ jsx3(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px"
        },
        children: filtered.map((activity) => /* @__PURE__ */ jsx3(
          ActivityCard,
          {
            activity,
            onSelect: () => onSelectActivity?.(activity)
          },
          activity.id
        ))
      }
    )
  ] });
};

// src/components/ActivityDetailView.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var ActivityDetailView = ({
  activity,
  loading,
  error,
  onBack
}) => {
  if (loading) {
    return /* @__PURE__ */ jsx4("div", { style: { padding: "40px", textAlign: "center", color: "#64748B" }, children: /* @__PURE__ */ jsx4("p", { children: "Caricamento scheda attivit\xE0 in corso..." }) });
  }
  if (error || !activity) {
    return /* @__PURE__ */ jsxs4("div", { style: { maxWidth: "800px", margin: "30px auto", padding: "0 20px" }, children: [
      /* @__PURE__ */ jsx4(
        "button",
        {
          onClick: onBack,
          style: {
            padding: "8px 16px",
            backgroundColor: "#F1F5F9",
            border: "1px solid #CBD5E1",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "20px"
          },
          children: "\u2190 Torna alla Vetrina"
        }
      ),
      /* @__PURE__ */ jsxs4(
        "div",
        {
          style: {
            padding: "24px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #F87171",
            borderRadius: "8px",
            color: "#991B1B"
          },
          children: [
            /* @__PURE__ */ jsx4("h3", { style: { margin: "0 0 8px 0" }, children: "Attivit\xE0 non disponibile" }),
            /* @__PURE__ */ jsx4("p", { style: { margin: 0, fontSize: "14px" }, children: error || "La scheda richiesta non esiste o non soddisfa i requisiti associativi di visibilit\xE0 pubblica." })
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs4("div", { style: { maxWidth: "800px", margin: "30px auto", padding: "0 20px" }, children: [
    /* @__PURE__ */ jsx4(
      "button",
      {
        onClick: onBack,
        style: {
          padding: "8px 16px",
          backgroundColor: "#F1F5F9",
          border: "1px solid #CBD5E1",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px",
          fontSize: "14px"
        },
        children: "\u2190 Torna alla Vetrina"
      }
    ),
    /* @__PURE__ */ jsxs4(
      "div",
      {
        style: {
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
        },
        children: [
          /* @__PURE__ */ jsxs4("div", { style: { borderBottom: "1px solid #E2E8F0", paddingBottom: "20px", marginBottom: "20px" }, children: [
            /* @__PURE__ */ jsx4(
              "span",
              {
                style: {
                  fontSize: "13px",
                  textTransform: "uppercase",
                  color: "#64748B",
                  letterSpacing: "0.05em",
                  fontWeight: 600
                },
                children: activity.categoria.replace(/_/g, " ")
              }
            ),
            /* @__PURE__ */ jsx4("h1", { style: { margin: "8px 0 12px 0", fontSize: "28px", color: "#0F172A" }, children: activity.nomeAttivita }),
            /* @__PURE__ */ jsx4("p", { style: { fontSize: "16px", color: "#334155", margin: 0, lineHeight: 1.5 }, children: activity.descrizioneBreve })
          ] }),
          /* @__PURE__ */ jsxs4("div", { style: { marginBottom: "24px" }, children: [
            /* @__PURE__ */ jsx4("h2", { style: { fontSize: "18px", color: "#1E293B", marginBottom: "10px" }, children: "Descrizione dell'Attivit\xE0" }),
            /* @__PURE__ */ jsx4("p", { style: { fontSize: "15px", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-line" }, children: activity.descrizioneCompleta })
          ] }),
          /* @__PURE__ */ jsxs4("div", { style: { marginBottom: "24px" }, children: [
            /* @__PURE__ */ jsx4("h2", { style: { fontSize: "18px", color: "#1E293B", marginBottom: "10px" }, children: "Servizi & Prestazioni" }),
            /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px" }, children: activity.serviziOfferti.map((s, idx) => /* @__PURE__ */ jsx4(
              "span",
              {
                style: {
                  backgroundColor: "#F1F5F9",
                  color: "#334155",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px"
                },
                children: s
              },
              idx
            )) })
          ] }),
          /* @__PURE__ */ jsxs4(
            "div",
            {
              style: {
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "24px"
              },
              children: [
                /* @__PURE__ */ jsx4("h2", { style: { fontSize: "16px", color: "#1E293B", margin: "0 0 14px 0" }, children: "Recapiti e Informazioni di Contatto" }),
                /* @__PURE__ */ jsxs4("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "14px" }, children: [
                  /* @__PURE__ */ jsxs4("div", { children: [
                    /* @__PURE__ */ jsx4("strong", { children: "Localit\xE0:" }),
                    " ",
                    activity.localita
                  ] }),
                  activity.indirizzoPubblico && /* @__PURE__ */ jsxs4("div", { children: [
                    /* @__PURE__ */ jsx4("strong", { children: "Indirizzo:" }),
                    " ",
                    activity.indirizzoPubblico
                  ] }),
                  activity.telefonoPubblico && /* @__PURE__ */ jsxs4("div", { children: [
                    /* @__PURE__ */ jsx4("strong", { children: "Telefono:" }),
                    " ",
                    activity.telefonoPubblico
                  ] }),
                  activity.emailPubblica && /* @__PURE__ */ jsxs4("div", { children: [
                    /* @__PURE__ */ jsx4("strong", { children: "Email:" }),
                    " ",
                    activity.emailPubblica
                  ] }),
                  activity.sitoWeb && /* @__PURE__ */ jsxs4("div", { children: [
                    /* @__PURE__ */ jsx4("strong", { children: "Sito Web:" }),
                    " ",
                    /* @__PURE__ */ jsx4("a", { href: activity.sitoWeb, target: "_blank", rel: "noopener noreferrer", style: { color: "#0284C7" }, children: activity.sitoWeb })
                  ] }),
                  activity.orariApertura && /* @__PURE__ */ jsxs4("div", { style: { gridColumn: "1 / -1" }, children: [
                    /* @__PURE__ */ jsx4("strong", { children: "Orari:" }),
                    " ",
                    activity.orariApertura
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx4(LegalNotice, { customNote: activity.trasparenza?.notaLegale })
        ]
      }
    )
  ] });
};

// src/components/MemberDashboardView.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var MemberDashboardView = ({
  memberData,
  loading,
  error,
  onEditActivity,
  onSwitchDemoMember
}) => {
  if (loading) {
    return /* @__PURE__ */ jsx5("div", { style: { padding: "40px", textAlign: "center", color: "#64748B" }, children: /* @__PURE__ */ jsx5("p", { children: "Caricamento area socio demo in corso..." }) });
  }
  if (error || !memberData) {
    return /* @__PURE__ */ jsx5("div", { style: { maxWidth: "800px", margin: "30px auto", padding: "0 20px" }, children: /* @__PURE__ */ jsxs5(
      "div",
      {
        style: {
          padding: "24px",
          backgroundColor: "#FEF2F2",
          border: "1px solid #F87171",
          borderRadius: "8px",
          color: "#991B1B"
        },
        children: [
          /* @__PURE__ */ jsx5("h3", { style: { margin: "0 0 8px 0" }, children: "Errore Caricamento Area Socio" }),
          /* @__PURE__ */ jsx5("p", { style: { margin: 0, fontSize: "14px" }, children: error })
        ]
      }
    ) });
  }
  const { socio, attivita, authMode, notaAutenticazione } = memberData;
  return /* @__PURE__ */ jsxs5("div", { style: { maxWidth: "850px", margin: "30px auto", padding: "0 20px" }, children: [
    /* @__PURE__ */ jsxs5(
      "div",
      {
        style: {
          backgroundColor: "#EFF6FF",
          border: "1px solid #93C5FD",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
          fontSize: "13px",
          color: "#1E40AF"
        },
        children: [
          /* @__PURE__ */ jsxs5("strong", { children: [
            "MODALIT\xC0 COLLAUDO: ",
            authMode
          ] }),
          /* @__PURE__ */ jsx5("p", { style: { margin: "4px 0 8px 0", lineHeight: 1.4 }, children: notaAutenticazione }),
          /* @__PURE__ */ jsxs5("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsx5("span", { children: "Cambia utente demo:" }),
            /* @__PURE__ */ jsx5(
              "button",
              {
                onClick: () => onSwitchDemoMember("socio-01"),
                style: {
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  backgroundColor: socio.id === "socio-01" ? "#2563EB" : "#FFFFFF",
                  color: socio.id === "socio-01" ? "#FFFFFF" : "#1E293B",
                  border: "1px solid #CBD5E1",
                  borderRadius: "4px"
                },
                children: "Socio 1 (Mario Rossi - Attivo)"
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                onClick: () => onSwitchDemoMember("socio-02"),
                style: {
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  backgroundColor: socio.id === "socio-02" ? "#2563EB" : "#FFFFFF",
                  color: socio.id === "socio-02" ? "#FFFFFF" : "#1E293B",
                  border: "1px solid #CBD5E1",
                  borderRadius: "4px"
                },
                children: "Socio 2 (Elena Bianchi - Attivo)"
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                onClick: () => onSwitchDemoMember("socio-03"),
                style: {
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  backgroundColor: socio.id === "socio-03" ? "#2563EB" : "#FFFFFF",
                  color: socio.id === "socio-03" ? "#FFFFFF" : "#1E293B",
                  border: "1px solid #CBD5E1",
                  borderRadius: "4px"
                },
                children: "Socio 3 (Giuseppe Verdi - Sospeso)"
              }
            ),
            /* @__PURE__ */ jsx5(
              "button",
              {
                onClick: () => onSwitchDemoMember("socio-04"),
                style: {
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  backgroundColor: socio.id === "socio-04" ? "#2563EB" : "#FFFFFF",
                  color: socio.id === "socio-04" ? "#FFFFFF" : "#1E293B",
                  border: "1px solid #CBD5E1",
                  borderRadius: "4px"
                },
                children: "Socio 4 (Carla Neri - Escluso)"
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx5("h1", { style: { fontSize: "24px", color: "#0F172A", marginBottom: "6px" }, children: "Area Personale del Socio" }),
    /* @__PURE__ */ jsx5("p", { style: { color: "#64748B", fontSize: "14px", marginBottom: "24px" }, children: "Gestione democratica interna e collegamento con la propria scheda attivit\xE0 in vetrina." }),
    /* @__PURE__ */ jsxs5(
      "div",
      {
        style: {
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "24px",
          marginBottom: "24px"
        },
        children: [
          /* @__PURE__ */ jsx5("h2", { style: { fontSize: "18px", color: "#1E293B", margin: "0 0 16px 0" }, children: "Stato Associativo" }),
          /* @__PURE__ */ jsxs5("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }, children: [
            /* @__PURE__ */ jsxs5("div", { children: [
              /* @__PURE__ */ jsx5("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Nome e Cognome" }),
              /* @__PURE__ */ jsx5("div", { style: { fontSize: "16px", fontWeight: 600, color: "#0F172A" }, children: socio.nomeCognome })
            ] }),
            /* @__PURE__ */ jsxs5("div", { children: [
              /* @__PURE__ */ jsx5("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Codice Socio" }),
              /* @__PURE__ */ jsx5("div", { style: { fontSize: "16px", fontWeight: 600, color: "#0F172A" }, children: socio.codiceSocio })
            ] }),
            /* @__PURE__ */ jsxs5("div", { children: [
              /* @__PURE__ */ jsx5("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Stato di Iscrizione" }),
              /* @__PURE__ */ jsx5("div", { style: { marginTop: "2px" }, children: /* @__PURE__ */ jsx5(
                "span",
                {
                  style: {
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    backgroundColor: socio.statoAssociativo === "ATTIVO" ? "#DCFCE7" : socio.statoAssociativo === "SOSPESO" ? "#FEF3C7" : "#FEE2E2",
                    color: socio.statoAssociativo === "ATTIVO" ? "#166534" : socio.statoAssociativo === "SOSPESO" ? "#92400E" : "#991B1B"
                  },
                  children: socio.statoAssociativo
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs5("div", { children: [
              /* @__PURE__ */ jsx5("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Data Iscrizione" }),
              /* @__PURE__ */ jsx5("div", { style: { fontSize: "14px", color: "#334155" }, children: socio.dataIscrizione })
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs5(
      "div",
      {
        style: {
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "24px"
        },
        children: [
          /* @__PURE__ */ jsxs5("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [
            /* @__PURE__ */ jsx5("h2", { style: { fontSize: "18px", color: "#1E293B", margin: 0 }, children: "Scheda Attivit\xE0 Autonoma" }),
            attivita && /* @__PURE__ */ jsx5(
              "button",
              {
                onClick: onEditActivity,
                style: {
                  padding: "8px 16px",
                  backgroundColor: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500
                },
                children: "Modifica Scheda"
              }
            )
          ] }),
          attivita ? /* @__PURE__ */ jsxs5("div", { children: [
            /* @__PURE__ */ jsxs5("div", { style: { marginBottom: "12px" }, children: [
              /* @__PURE__ */ jsx5("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Stato Pubblicazione Vetrina:" }),
              " ",
              /* @__PURE__ */ jsx5(
                "span",
                {
                  style: {
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor: attivita.statoPubblicazione === "PUBBLICATA" && socio.statoAssociativo === "ATTIVO" ? "#DCFCE7" : "#FEF3C7",
                    color: attivita.statoPubblicazione === "PUBBLICATA" && socio.statoAssociativo === "ATTIVO" ? "#166534" : "#92400E"
                  },
                  children: attivita.statoPubblicazione === "PUBBLICATA" && socio.statoAssociativo === "ATTIVO" ? "PUBBLICATA (Visibile in vetrina)" : `${attivita.statoPubblicazione} (Non visibile in vetrina)`
                }
              )
            ] }),
            /* @__PURE__ */ jsx5("h3", { style: { margin: "0 0 6px 0", fontSize: "18px", color: "#0F172A" }, children: attivita.nomeAttivita }),
            /* @__PURE__ */ jsx5("p", { style: { margin: "0 0 14px 0", fontSize: "14px", color: "#475569" }, children: attivita.descrizioneBreve }),
            /* @__PURE__ */ jsxs5("div", { style: { fontSize: "13px", color: "#64748B" }, children: [
              /* @__PURE__ */ jsxs5("span", { children: [
                "\u{1F4CD} ",
                attivita.localita
              ] }),
              " | ",
              /* @__PURE__ */ jsxs5("span", { children: [
                "Ultimo aggiornamento: ",
                attivita.dataUltimoAggiornamento
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsx5("div", { style: { color: "#64748B", fontSize: "14px" }, children: "Nessuna scheda attivit\xE0 attualmente associata a questo socio." })
        ]
      }
    )
  ] });
};

// tests/frontend_components.test.ts
describe("Pro-Local Frontend Components SSR Rendering Tests", () => {
  const sampleActivity = {
    id: "act-01",
    nomeAttivita: "Bottega Artigiana del Legno",
    categoria: "ARTIGIANATO_RESTAURO",
    descrizioneBreve: "Restauro conservativo mobili d'epoca",
    descrizioneCompleta: "Restauro di arredi storici con vernici e colle naturali atossiche.",
    serviziOfferti: ["Restauro", "Lucidatura a gommalacca"],
    localita: "Borgo Antico",
    indirizzoPubblico: "Via degli Artigiani 12",
    telefonoPubblico: "0984 123456",
    emailPubblica: "bottega@demo.it",
    sitoWeb: "https://bottega-legno.demo",
    dataUltimoAggiornamento: "2024-05-10",
    trasparenza: {
      autonomiaAttivita: true,
      notaLegale: "Spazio informativo non vincolante. Nessuna garanzia commerciale."
    }
  };
  const sampleMemberData = {
    authMode: "DEMO_FASE_2_2",
    notaAutenticazione: "Modalit\xE0 di collaudo demo per la Fase 2.2",
    socio: {
      id: "socio-01",
      codiceSocio: "SOC-001",
      nomeCognome: "Mario Rossi",
      emailDemo: "mario.rossi@demo.it",
      dataIscrizione: "2024-01-10",
      statoAssociativo: "ATTIVO",
      quotaSocialeInRegola: true
    },
    attivita: {
      id: "act-01",
      memberId: "socio-01",
      nomeAttivita: "Bottega Artigiana del Legno",
      categoria: "ARTIGIANATO_RESTAURO",
      descrizioneBreve: "Restauro conservativo mobili d'epoca",
      descrizioneCompleta: "Restauro di arredi storici...",
      serviziOfferti: ["Restauro"],
      localita: "Borgo Antico",
      statoPubblicazione: "PUBBLICATA",
      dataUltimoAggiornamento: "2024-05-10"
    },
    tutteAttivita: []
  };
  it("LegalNotice renderizza il testo di trasparenza senza ambiguit\xE0", () => {
    const html = renderToStaticMarkup(React2.createElement(LegalNotice));
    assert.strictEqual(html.includes("Nota di Trasparenza e Autonomia Professionale"), true);
    assert.strictEqual(html.includes("non certifica n\xE9 garantisce i servizi"), true);
    assert.strictEqual(html.includes("non svolge attivit\xE0 di intermediazione"), true);
  });
  it('ActivityCard visualizza i dati e non contiene badge ingannevoli ("certificato", "garantito", "partner ufficiale")', () => {
    const html = renderToStaticMarkup(
      React2.createElement(ActivityCard, { activity: sampleActivity })
    );
    assert.strictEqual(html.includes("Bottega Artigiana del Legno"), true);
    assert.strictEqual(html.includes("Restauro conservativo mobili"), true);
    assert.strictEqual(html.includes("Borgo Antico"), true);
    assert.strictEqual(html.toLowerCase().includes("certificato"), false);
    assert.strictEqual(html.toLowerCase().includes("garantito"), false);
    assert.strictEqual(html.toLowerCase().includes("partner ufficiale"), false);
    assert.strictEqual(html.toLowerCase().includes("verificato"), false);
  });
  it("ShowcaseView renderizza sia LegalNotice che la lista attivit\xE0", () => {
    const html = renderToStaticMarkup(
      React2.createElement(ShowcaseView, {
        activities: [sampleActivity],
        loading: false,
        error: null
      })
    );
    assert.strictEqual(html.includes("Vetrina delle Attivit\xE0 dei Soci"), true);
    assert.strictEqual(html.includes("Nota di Trasparenza e Autonomia Professionale"), true);
    assert.strictEqual(html.includes("Bottega Artigiana del Legno"), true);
  });
  it("ShowcaseView gestisce stato di caricamento ed errore API", () => {
    const loadingHtml = renderToStaticMarkup(
      React2.createElement(ShowcaseView, {
        activities: [],
        loading: true,
        error: null
      })
    );
    assert.strictEqual(loadingHtml.includes("Caricamento vetrina pubblica"), true);
    const errorHtml = renderToStaticMarkup(
      React2.createElement(ShowcaseView, {
        activities: [],
        loading: false,
        error: "Errore di connessione API"
      })
    );
    assert.strictEqual(errorHtml.includes("Errore di connessione API"), true);
  });
  it("ActivityDetailView renderizza il dettaglio e la nota legale specifica", () => {
    const html = renderToStaticMarkup(
      React2.createElement(ActivityDetailView, {
        activity: sampleActivity,
        loading: false,
        error: null,
        onBack: () => {
        }
      })
    );
    assert.strictEqual(html.includes("Bottega Artigiana del Legno"), true);
    assert.strictEqual(html.includes("Lucidatura a gommalacca"), true);
    assert.strictEqual(html.includes("0984 123456"), true);
    assert.strictEqual(html.includes("Spazio informativo non vincolante"), true);
  });
  it("MemberDashboardView renderizza profilo socio e stato attivit\xE0 in modalit\xE0 DEMO", () => {
    const html = renderToStaticMarkup(
      React2.createElement(MemberDashboardView, {
        memberData: sampleMemberData,
        loading: false,
        error: null,
        onEditActivity: () => {
        },
        onSwitchDemoMember: () => {
        }
      })
    );
    assert.strictEqual(html.includes("MODALIT\xC0 COLLAUDO: DEMO_FASE_2_2"), true);
    assert.strictEqual(html.includes("Mario Rossi"), true);
    assert.strictEqual(html.includes("SOC-001"), true);
    assert.strictEqual(html.includes("ATTIVO"), true);
    assert.strictEqual(html.includes("Bottega Artigiana del Legno"), true);
    assert.strictEqual(html.includes("PUBBLICATA (Visibile in vetrina)"), true);
  });
});
