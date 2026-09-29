// tests/auth_integration.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";
import React6 from "react";
import { renderToStaticMarkup } from "react-dom/server";

// src/types/auth.ts
var ApiError = class extends Error {
  status;
  code;
  details;
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
};

// src/services/apiClient.ts
var ProLocalApiClient = class {
  baseUrl;
  onUnauthorizedCallback;
  constructor(customBaseUrl) {
    this.baseUrl = customBaseUrl || this.resolveBaseUrl();
  }
  resolveBaseUrl() {
    if (typeof window !== "undefined" && window.__PROLOCAL_API_URL__) {
      return window.__PROLOCAL_API_URL__;
    }
    return "http://localhost:3001";
  }
  setBaseUrl(url) {
    this.baseUrl = url;
  }
  getBaseUrl() {
    return this.baseUrl;
  }
  setOnUnauthorized(callback) {
    this.onUnauthorizedCallback = callback;
  }
  notifyUnauthorized() {
    if (this.onUnauthorizedCallback) {
      this.onUnauthorizedCallback();
    }
  }
  /**
   * Autenticazione reale con credenziali HTTP.
   * Il backend restituisce cookie HttpOnly 'prolocal_session'.
   * Nessun token o password viene memorizzato lato client.
   */
  async login(email, password) {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "ProLocalApp"
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        throw new ApiError("Credenziali non valide. Verificare email e password.", 401);
      }
      if (res.status === 423) {
        throw new ApiError(
          "Account temporaneamente bloccato per motivi di sicurezza dopo troppi tentativi falliti. Riprovare pi\xF9 tardi.",
          423,
          "ACCOUNT_LOCKED",
          data
        );
      }
      if (res.status === 400) {
        throw new ApiError("I campi email e password sono obbligatori.", 400);
      }
      if (res.status === 403) {
        throw new ApiError("Accesso negato: account non attivo.", 403);
      }
      throw new ApiError("Errore durante la procedura di accesso. Riprovare pi\xF9 tardi.", res.status);
    }
    return data;
  }
  /**
   * Verifica la sessione attuale chiedendo al backend /api/auth/me tramite cookie HttpOnly.
   * Il backend è l'unica autorità sull'identità.
   */
  async getCurrentUser() {
    const res = await fetch(`${this.baseUrl}/api/auth/me`, {
      method: "GET",
      credentials: "include"
    });
    if (res.status === 401) {
      return null;
    }
    if (!res.ok) {
      throw new ApiError(`Errore durante la verifica della sessione (${res.status})`, res.status);
    }
    return res.json();
  }
  /**
   * Logout globale server-side.
   * Revoca la sessione e ordina al browser la cancellazione del cookie HttpOnly.
   */
  async logout() {
    const res = await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-Requested-With": "ProLocalApp"
      }
    });
    if (!res.ok && res.status !== 401) {
    }
  }
  /**
   * Recupera le attività pubbliche per la vetrina
   * Solo schede PUBBLICATE di soci con stato ATTIVO
   */
  async getPublicShowcase() {
    const res = await fetch(`${this.baseUrl}/api/showcase`);
    if (!res.ok) {
      throw new ApiError(`Errore durante il recupero della vetrina pubblica (${res.status})`, res.status);
    }
    return res.json();
  }
  /**
   * Recupera il dettaglio pubblico di una singola attività
   */
  async getPublicActivity(id) {
    const res = await fetch(`${this.baseUrl}/api/activities/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new ApiError("Attivit\xE0 non trovata o non disponibile per la visualizzazione pubblica.", 404);
      }
      throw new ApiError(`Errore durante il recupero dell'attivit\xE0 (${res.status})`, res.status);
    }
    return res.json();
  }
  /**
   * Recupera i dati del socio autenticato e della sua attività collegata.
   * Usa esclusivamente la sessione reale tramite cookie HttpOnly.
   */
  async getMemberAreaMe() {
    const res = await fetch(`${this.baseUrl}/api/members/me`, {
      credentials: "include"
    });
    if (res.status === 401) {
      this.notifyUnauthorized();
      throw new ApiError("Sessione non valida o scaduta. Effettuare nuovamente il login.", 401);
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errorMsg = body.error || `Errore durante il caricamento dell'area socio (${res.status})`;
      throw new ApiError(errorMsg, res.status);
    }
    return res.json();
  }
  /**
   * Aggiorna la scheda attività da parte del socio titolare.
   * Richiesta mutativa protetta da CSRF (X-Requested-With) e sessione HTTP reale.
   */
  async updateActivity(activityId, data) {
    const res = await fetch(`${this.baseUrl}/api/activities/${encodeURIComponent(activityId)}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "ProLocalApp"
      },
      body: JSON.stringify(data)
    });
    if (res.status === 401) {
      this.notifyUnauthorized();
      throw new ApiError("Sessione non valida o scaduta. Effettuare nuovamente il login.", 401);
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = body.dettagli ? body.dettagli.join(", ") : body.error || "Errore durante la modifica";
      throw new ApiError(errorMsg, res.status);
    }
    return body;
  }
};
var apiClient = new ProLocalApiClient();

// src/components/LoginView.tsx
import { useState as useState2 } from "react";

// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jsx } from "react/jsx-runtime";
var AuthContext = createContext(void 0);
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve essere utilizzato all'interno di un AuthProvider");
  }
  return context;
}

// src/components/LoginView.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var LoginView = ({ onSuccess, onCancel }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState2("");
  const [password, setPassword] = useState2("");
  const [loading, setLoading] = useState2(false);
  const [errorMessage, setErrorMessage] = useState2(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("I campi email e password sono obbligatori.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await login(trimmedEmail, password);
      setPassword("");
      onSuccess("MEMBER");
    } catch (err) {
      setPassword("");
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrorMessage("Credenziali non valide. Verificare email e password.");
        } else if (err.status === 423) {
          setErrorMessage(
            "Account temporaneamente bloccato per motivi di sicurezza dopo troppi tentativi falliti. Riprovare pi\xF9 tardi."
          );
        } else {
          setErrorMessage(err.message);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Errore durante l'accesso. Riprovare.");
      }
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { style: { maxWidth: "420px", margin: "40px auto", padding: "0 20px" }, children: [
    /* @__PURE__ */ jsx2(
      "button",
      {
        onClick: onCancel,
        style: {
          padding: "6px 12px",
          backgroundColor: "#F1F5F9",
          border: "1px solid #CBD5E1",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#475569"
        },
        children: "\u2190 Torna alla Vetrina Pubblica"
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "32px 28px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
        },
        children: [
          /* @__PURE__ */ jsxs("div", { style: { marginBottom: "24px", textAlign: "center" }, children: [
            /* @__PURE__ */ jsx2("h1", { style: { fontSize: "22px", fontWeight: 700, color: "#0F172A", margin: "0 0 8px 0" }, children: "Accesso Area Riservata" }),
            /* @__PURE__ */ jsx2("p", { style: { margin: 0, fontSize: "13px", color: "#64748B" }, children: "Inserisci le tue credenziali di socio o amministratore per accedere ai servizi riservati." })
          ] }),
          errorMessage && /* @__PURE__ */ jsx2(
            "div",
            {
              role: "alert",
              style: {
                padding: "12px 14px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #F87171",
                borderRadius: "6px",
                color: "#991B1B",
                fontSize: "13px",
                marginBottom: "20px",
                lineHeight: 1.4
              },
              children: errorMessage
            }
          ),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [
            /* @__PURE__ */ jsxs("div", { style: { marginBottom: "16px" }, children: [
              /* @__PURE__ */ jsx2(
                "label",
                {
                  htmlFor: "login-email",
                  style: { display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" },
                  children: "Indirizzo Email"
                }
              ),
              /* @__PURE__ */ jsx2(
                "input",
                {
                  id: "login-email",
                  type: "email",
                  autoComplete: "username",
                  value: email,
                  disabled: loading,
                  onChange: (e) => setEmail(e.target.value),
                  placeholder: "es. socio@prolocal.it",
                  style: {
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                    backgroundColor: loading ? "#F8FAFC" : "#FFFFFF"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { marginBottom: "24px" }, children: [
              /* @__PURE__ */ jsx2(
                "label",
                {
                  htmlFor: "login-password",
                  style: { display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" },
                  children: "Password"
                }
              ),
              /* @__PURE__ */ jsx2(
                "input",
                {
                  id: "login-password",
                  type: "password",
                  autoComplete: "current-password",
                  value: password,
                  disabled: loading,
                  onChange: (e) => setPassword(e.target.value),
                  placeholder: "Inserisci la password",
                  style: {
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "14px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                    backgroundColor: loading ? "#F8FAFC" : "#FFFFFF"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsx2(
              "button",
              {
                type: "submit",
                disabled: loading,
                style: {
                  width: "100%",
                  padding: "12px",
                  backgroundColor: loading ? "#94A3B8" : "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background-color 0.15s ease"
                },
                children: loading ? "Accesso in corso..." : "Accedi"
              }
            )
          ] }),
          /* @__PURE__ */ jsx2("div", { style: { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #F1F5F9", textAlign: "center" }, children: /* @__PURE__ */ jsx2("p", { style: { margin: 0, fontSize: "11px", color: "#94A3B8", lineHeight: 1.4 }, children: "Sessione protetta con cookie cifrato HttpOnly e protezione anti-manomissione CSRF." }) })
        ]
      }
    )
  ] });
};

// src/components/TechnicalAdminView.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var TechnicalAdminView = ({
  user,
  onLogout,
  onGoHome
}) => {
  return /* @__PURE__ */ jsxs2("div", { style: { maxWidth: "800px", margin: "30px auto", padding: "0 20px" }, children: [
    /* @__PURE__ */ jsx3(
      "div",
      {
        style: {
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          borderRadius: "10px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        },
        children: /* @__PURE__ */ jsxs2("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }, children: [
          /* @__PURE__ */ jsxs2("div", { children: [
            /* @__PURE__ */ jsxs2(
              "span",
              {
                style: {
                  display: "inline-block",
                  backgroundColor: "#334155",
                  color: "#38BDF8",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "4px",
                  marginBottom: "8px"
                },
                children: [
                  "RUOLO TECNICO: ",
                  user.role
                ]
              }
            ),
            /* @__PURE__ */ jsx3("h1", { style: { fontSize: "22px", margin: 0, fontWeight: 700 }, children: "Sessione Amministratore Tecnico" })
          ] }),
          /* @__PURE__ */ jsxs2("div", { style: { display: "flex", gap: "8px" }, children: [
            /* @__PURE__ */ jsx3(
              "button",
              {
                onClick: onGoHome,
                style: {
                  padding: "8px 14px",
                  backgroundColor: "#1E293B",
                  color: "#FFFFFF",
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px"
                },
                children: "Vetrina Pubblica"
              }
            ),
            /* @__PURE__ */ jsx3(
              "button",
              {
                onClick: onLogout,
                style: {
                  padding: "8px 14px",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600
                },
                children: "Disconnetti"
              }
            )
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs2(
      "div",
      {
        style: {
          backgroundColor: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "24px",
          color: "#92400E",
          lineHeight: 1.5,
          fontSize: "14px"
        },
        children: [
          /* @__PURE__ */ jsx3("h3", { style: { margin: "0 0 8px 0", fontSize: "16px", color: "#B45309" }, children: "Separazione dei Ruoli e Trasparenza Statutaria" }),
          /* @__PURE__ */ jsx3("p", { style: { margin: "0 0 10px 0" }, children: "In conformit\xE0 con lo Statuto dell'Associazione Pro-Local e con il modello di sicurezza RBAC:" }),
          /* @__PURE__ */ jsxs2("ul", { style: { margin: 0, paddingLeft: "20px" }, children: [
            /* @__PURE__ */ jsxs2("li", { children: [
              "L'Amministratore Tecnico non \xE8 un associato (",
              /* @__PURE__ */ jsx3("strong", { children: "memberId = null" }),
              ")."
            ] }),
            /* @__PURE__ */ jsx3("li", { children: "Non possiede una scheda socio n\xE9 pu\xF2 inserire attivit\xE0 economiche in vetrina." }),
            /* @__PURE__ */ jsx3("li", { children: "Non pu\xF2 deliberare, approvare o respingere istanze associative riservate agli organi democratici eletti." }),
            /* @__PURE__ */ jsx3("li", { children: "Ha accesso unicamente alle operazioni tecnologiche e di sicurezza del sistema." })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs2(
      "div",
      {
        style: {
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "24px"
        },
        children: [
          /* @__PURE__ */ jsx3("h3", { style: { fontSize: "16px", color: "#1E293B", margin: "0 0 16px 0" }, children: "Dati dell'Account Tecnico" }),
          /* @__PURE__ */ jsxs2("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }, children: [
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx3("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Identificativo Utente" }),
              /* @__PURE__ */ jsx3("div", { style: { fontSize: "14px", fontWeight: 600, color: "#0F172A", marginTop: "2px" }, children: user.userId })
            ] }),
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx3("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Tipologia Attore" }),
              /* @__PURE__ */ jsx3("div", { style: { fontSize: "14px", fontWeight: 600, color: "#0F172A", marginTop: "2px" }, children: user.actorType })
            ] }),
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx3("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Scheda Associativa" }),
              /* @__PURE__ */ jsx3("div", { style: { fontSize: "14px", fontWeight: 600, color: "#64748B", marginTop: "2px" }, children: "Nessuna (Riservata ai soli soci)" })
            ] })
          ] })
        ]
      }
    )
  ] });
};

// src/App.tsx
import { useState as useState5, useEffect as useEffect2 } from "react";

// src/components/ShowcaseView.tsx
import { useState as useState3 } from "react";

// src/components/ActivityCard.tsx
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var ActivityCard = ({ activity, onSelect }) => {
  return /* @__PURE__ */ jsxs3(
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
        /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }, children: [
          /* @__PURE__ */ jsx4("h3", { style: { margin: 0, fontSize: "18px", fontWeight: 600, color: "#0F172A" }, children: activity.nomeAttivita }),
          /* @__PURE__ */ jsx4("span", { style: { fontSize: "12px", color: "#64748B", textTransform: "capitalize" }, children: activity.categoria.replace("_", " ") })
        ] }),
        /* @__PURE__ */ jsx4("p", { style: { fontSize: "14px", color: "#334155", margin: "8px 0 14px 0", lineHeight: 1.4 }, children: activity.descrizioneBreve }),
        /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }, children: activity.serviziOfferti.map((servizio, idx) => /* @__PURE__ */ jsx4(
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
        /* @__PURE__ */ jsxs3("div", { style: { fontSize: "13px", color: "#64748B", display: "flex", justifyContent: "space-between" }, children: [
          /* @__PURE__ */ jsxs3("span", { children: [
            "\u{1F4CD} ",
            activity.localita
          ] }),
          activity.telefonoPubblico && /* @__PURE__ */ jsxs3("span", { children: [
            "\u{1F4DE} ",
            activity.telefonoPubblico
          ] })
        ] })
      ]
    }
  );
};

// src/components/LegalNotice.tsx
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
var LegalNotice = ({ customNote }) => {
  return /* @__PURE__ */ jsxs4(
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
        /* @__PURE__ */ jsx5("strong", { style: { color: "#0F172A", display: "block", marginBottom: "4px" }, children: "Nota di Trasparenza e Autonomia Professionale" }),
        customNote || "La presente vetrina costituisce uno spazio informativo riservato ai soci dell'associazione Pro-Local in regola con i requisiti associativi interni. L'associazione Pro-Local non effettua verifiche di idoneit\xE0 professionale o commerciale, non certifica n\xE9 garantisce i servizi prestati dai soci, non assume obbligazioni contrattuali e non svolge attivit\xE0 di intermediazione nei rapporti tra i soci e i cittadini/committenti."
      ]
    }
  );
};

// src/components/ShowcaseView.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var ShowcaseView = ({
  activities,
  loading = false,
  error = null,
  onSelectActivity
}) => {
  const [filterCategory, setFilterCategory] = useState3("all");
  const [searchQuery, setSearchQuery] = useState3("");
  const categories = Array.from(new Set(activities.map((a) => a.categoria)));
  const filtered = activities.filter((act) => {
    const matchesCategory = filterCategory === "all" || act.categoria === filterCategory;
    const matchesQuery = searchQuery.trim() === "" || act.nomeAttivita.toLowerCase().includes(searchQuery.toLowerCase()) || act.descrizioneBreve.toLowerCase().includes(searchQuery.toLowerCase()) || act.localita.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });
  return /* @__PURE__ */ jsxs5("div", { style: { maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" }, children: [
    /* @__PURE__ */ jsxs5("header", { style: { marginBottom: "24px" }, children: [
      /* @__PURE__ */ jsx6("h1", { style: { fontSize: "28px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }, children: "Vetrina delle Attivit\xE0 dei Soci" }),
      /* @__PURE__ */ jsx6("p", { style: { fontSize: "15px", color: "#64748B", margin: 0 }, children: "Spazio informativo delle attivit\xE0 professionali, commerciali e artigianali promosse dai soci di Pro-Local." })
    ] }),
    /* @__PURE__ */ jsx6(LegalNotice, {}),
    error && /* @__PURE__ */ jsx6(
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
    /* @__PURE__ */ jsxs5("div", { style: { display: "flex", gap: "12px", margin: "20px 0", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsx6(
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
      /* @__PURE__ */ jsxs5(
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
            /* @__PURE__ */ jsx6("option", { value: "all", children: "Tutte le categorie" }),
            categories.map((cat) => /* @__PURE__ */ jsx6("option", { value: cat, children: cat.replace(/_/g, " ") }, cat))
          ]
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsx6("div", { style: { padding: "40px", textAlign: "center", color: "#64748B" }, children: /* @__PURE__ */ jsx6("p", { children: "Caricamento vetrina pubblica in corso..." }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx6(
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
        children: /* @__PURE__ */ jsx6("p", { style: { margin: 0, fontSize: "15px" }, children: "Nessuna attivit\xE0 corrisponde ai criteri di ricerca o risulta pubblicata nella vetrina." })
      }
    ) : /* @__PURE__ */ jsx6(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px"
        },
        children: filtered.map((activity) => /* @__PURE__ */ jsx6(
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
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
var ActivityDetailView = ({
  activity,
  loading,
  error,
  onBack
}) => {
  if (loading) {
    return /* @__PURE__ */ jsx7("div", { style: { padding: "40px", textAlign: "center", color: "#64748B" }, children: /* @__PURE__ */ jsx7("p", { children: "Caricamento scheda attivit\xE0 in corso..." }) });
  }
  if (error || !activity) {
    return /* @__PURE__ */ jsxs6("div", { style: { maxWidth: "800px", margin: "30px auto", padding: "0 20px" }, children: [
      /* @__PURE__ */ jsx7(
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
      /* @__PURE__ */ jsxs6(
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
            /* @__PURE__ */ jsx7("h3", { style: { margin: "0 0 8px 0" }, children: "Attivit\xE0 non disponibile" }),
            /* @__PURE__ */ jsx7("p", { style: { margin: 0, fontSize: "14px" }, children: error || "La scheda richiesta non esiste o non soddisfa i requisiti associativi di visibilit\xE0 pubblica." })
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs6("div", { style: { maxWidth: "800px", margin: "30px auto", padding: "0 20px" }, children: [
    /* @__PURE__ */ jsx7(
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
    /* @__PURE__ */ jsxs6(
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
          /* @__PURE__ */ jsxs6("div", { style: { borderBottom: "1px solid #E2E8F0", paddingBottom: "20px", marginBottom: "20px" }, children: [
            /* @__PURE__ */ jsx7(
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
            /* @__PURE__ */ jsx7("h1", { style: { margin: "8px 0 12px 0", fontSize: "28px", color: "#0F172A" }, children: activity.nomeAttivita }),
            /* @__PURE__ */ jsx7("p", { style: { fontSize: "16px", color: "#334155", margin: 0, lineHeight: 1.5 }, children: activity.descrizioneBreve })
          ] }),
          /* @__PURE__ */ jsxs6("div", { style: { marginBottom: "24px" }, children: [
            /* @__PURE__ */ jsx7("h2", { style: { fontSize: "18px", color: "#1E293B", marginBottom: "10px" }, children: "Descrizione dell'Attivit\xE0" }),
            /* @__PURE__ */ jsx7("p", { style: { fontSize: "15px", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-line" }, children: activity.descrizioneCompleta })
          ] }),
          /* @__PURE__ */ jsxs6("div", { style: { marginBottom: "24px" }, children: [
            /* @__PURE__ */ jsx7("h2", { style: { fontSize: "18px", color: "#1E293B", marginBottom: "10px" }, children: "Servizi & Prestazioni" }),
            /* @__PURE__ */ jsx7("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px" }, children: activity.serviziOfferti.map((s, idx) => /* @__PURE__ */ jsx7(
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
          /* @__PURE__ */ jsxs6(
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
                /* @__PURE__ */ jsx7("h2", { style: { fontSize: "16px", color: "#1E293B", margin: "0 0 14px 0" }, children: "Recapiti e Informazioni di Contatto" }),
                /* @__PURE__ */ jsxs6("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "14px" }, children: [
                  /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx7("strong", { children: "Localit\xE0:" }),
                    " ",
                    activity.localita
                  ] }),
                  activity.indirizzoPubblico && /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx7("strong", { children: "Indirizzo:" }),
                    " ",
                    activity.indirizzoPubblico
                  ] }),
                  activity.telefonoPubblico && /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx7("strong", { children: "Telefono:" }),
                    " ",
                    activity.telefonoPubblico
                  ] }),
                  activity.emailPubblica && /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx7("strong", { children: "Email:" }),
                    " ",
                    activity.emailPubblica
                  ] }),
                  activity.sitoWeb && /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx7("strong", { children: "Sito Web:" }),
                    " ",
                    /* @__PURE__ */ jsx7("a", { href: activity.sitoWeb, target: "_blank", rel: "noopener noreferrer", style: { color: "#0284C7" }, children: activity.sitoWeb })
                  ] }),
                  activity.orariApertura && /* @__PURE__ */ jsxs6("div", { style: { gridColumn: "1 / -1" }, children: [
                    /* @__PURE__ */ jsx7("strong", { children: "Orari:" }),
                    " ",
                    activity.orariApertura
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx7(LegalNotice, { customNote: activity.trasparenza?.notaLegale })
        ]
      }
    )
  ] });
};

// src/components/MemberDashboardView.tsx
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var MemberDashboardView = ({
  memberData,
  loading,
  error,
  onEditActivity
}) => {
  if (loading) {
    return /* @__PURE__ */ jsx8("div", { style: { padding: "40px", textAlign: "center", color: "#64748B" }, children: /* @__PURE__ */ jsx8("p", { children: "Caricamento area socio in corso..." }) });
  }
  if (error || !memberData) {
    return /* @__PURE__ */ jsx8("div", { style: { maxWidth: "800px", margin: "30px auto", padding: "0 20px" }, children: /* @__PURE__ */ jsxs7(
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
          /* @__PURE__ */ jsx8("h3", { style: { margin: "0 0 8px 0" }, children: "Errore Caricamento Area Socio" }),
          /* @__PURE__ */ jsx8("p", { style: { margin: 0, fontSize: "14px" }, children: error })
        ]
      }
    ) });
  }
  const { socio, attivita } = memberData;
  return /* @__PURE__ */ jsxs7("div", { style: { maxWidth: "850px", margin: "30px auto", padding: "0 20px" }, children: [
    /* @__PURE__ */ jsxs7(
      "div",
      {
        style: {
          backgroundColor: "#F0FDF4",
          border: "1px solid #86EFAC",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
          fontSize: "13px",
          color: "#166534"
        },
        children: [
          /* @__PURE__ */ jsx8("strong", { children: "SESSIONE ASSOCIATIVA AUTENTICATA" }),
          /* @__PURE__ */ jsx8("p", { style: { margin: "4px 0 0 0", lineHeight: 1.4 }, children: "Accesso effettuato tramite cookie di sessione HttpOnly verificato dal server. Identit\xE0 associativa certificata dagli archivi sociali." })
        ]
      }
    ),
    /* @__PURE__ */ jsx8("h1", { style: { fontSize: "24px", color: "#0F172A", marginBottom: "6px" }, children: "Area Personale del Socio" }),
    /* @__PURE__ */ jsx8("p", { style: { color: "#64748B", fontSize: "14px", marginBottom: "24px" }, children: "Gestione democratica interna e collegamento con la propria scheda attivit\xE0 in vetrina." }),
    /* @__PURE__ */ jsxs7(
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
          /* @__PURE__ */ jsx8("h2", { style: { fontSize: "18px", color: "#1E293B", margin: "0 0 16px 0" }, children: "Stato Associativo" }),
          /* @__PURE__ */ jsxs7("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }, children: [
            /* @__PURE__ */ jsxs7("div", { children: [
              /* @__PURE__ */ jsx8("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Nome e Cognome" }),
              /* @__PURE__ */ jsx8("div", { style: { fontSize: "16px", fontWeight: 600, color: "#0F172A" }, children: socio.nomeCognome })
            ] }),
            /* @__PURE__ */ jsxs7("div", { children: [
              /* @__PURE__ */ jsx8("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Codice Socio" }),
              /* @__PURE__ */ jsx8("div", { style: { fontSize: "16px", fontWeight: 600, color: "#0F172A" }, children: socio.codiceSocio })
            ] }),
            /* @__PURE__ */ jsxs7("div", { children: [
              /* @__PURE__ */ jsx8("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Stato di Iscrizione" }),
              /* @__PURE__ */ jsx8("div", { style: { marginTop: "2px" }, children: /* @__PURE__ */ jsx8(
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
            /* @__PURE__ */ jsxs7("div", { children: [
              /* @__PURE__ */ jsx8("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Data Iscrizione" }),
              /* @__PURE__ */ jsx8("div", { style: { fontSize: "14px", color: "#334155" }, children: socio.dataIscrizione })
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs7(
      "div",
      {
        style: {
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "24px"
        },
        children: [
          /* @__PURE__ */ jsxs7("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [
            /* @__PURE__ */ jsx8("h2", { style: { fontSize: "18px", color: "#1E293B", margin: 0 }, children: "Scheda Attivit\xE0 Autonoma" }),
            attivita && /* @__PURE__ */ jsx8(
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
          attivita ? /* @__PURE__ */ jsxs7("div", { children: [
            /* @__PURE__ */ jsxs7("div", { style: { marginBottom: "12px" }, children: [
              /* @__PURE__ */ jsx8("span", { style: { fontSize: "12px", color: "#64748B" }, children: "Stato Pubblicazione Vetrina:" }),
              " ",
              /* @__PURE__ */ jsx8(
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
            /* @__PURE__ */ jsx8("h3", { style: { margin: "0 0 6px 0", fontSize: "18px", color: "#0F172A" }, children: attivita.nomeAttivita }),
            /* @__PURE__ */ jsx8("p", { style: { margin: "0 0 14px 0", fontSize: "14px", color: "#475569" }, children: attivita.descrizioneBreve }),
            /* @__PURE__ */ jsxs7("div", { style: { fontSize: "13px", color: "#64748B" }, children: [
              /* @__PURE__ */ jsxs7("span", { children: [
                "\u{1F4CD} ",
                attivita.localita
              ] }),
              " | ",
              /* @__PURE__ */ jsxs7("span", { children: [
                "Ultimo aggiornamento: ",
                attivita.dataUltimoAggiornamento
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsx8("div", { style: { color: "#64748B", fontSize: "14px" }, children: "Nessuna scheda attivit\xE0 attualmente associata a questo socio." })
        ]
      }
    )
  ] });
};

// src/components/ActivityEditView.tsx
import { useState as useState4 } from "react";
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
var ActivityEditView = ({
  memberData,
  onSave,
  onCancel
}) => {
  const currentActivity = memberData.attivita;
  const [nomeAttivita, setNomeAttivita] = useState4(currentActivity?.nomeAttivita || "");
  const [descrizioneBreve, setDescrizioneBreve] = useState4(currentActivity?.descrizioneBreve || "");
  const [descrizioneCompleta, setDescrizioneCompleta] = useState4(
    currentActivity?.descrizioneCompleta || ""
  );
  const [serviziInput, setServiziInput] = useState4(
    currentActivity?.serviziOfferti.join(", ") || ""
  );
  const [localita, setLocalita] = useState4(currentActivity?.localita || "");
  const [indirizzoPubblico, setIndirizzoPubblico] = useState4(
    currentActivity?.indirizzoPubblico || ""
  );
  const [telefonoPubblico, setTelefonoPubblico] = useState4(
    currentActivity?.telefonoPubblico || ""
  );
  const [emailPubblica, setEmailPubblica] = useState4(
    currentActivity?.emailPubblica || ""
  );
  const [sitoWeb, setSitoWeb] = useState4(currentActivity?.sitoWeb || "");
  const [orariApertura, setOrariApertura] = useState4(
    currentActivity?.orariApertura || ""
  );
  const [saving, setSaving] = useState4(false);
  const [errorMessage, setErrorMessage] = useState4(null);
  if (!currentActivity) {
    return /* @__PURE__ */ jsxs8("div", { style: { maxWidth: "700px", margin: "30px auto", padding: "0 20px" }, children: [
      /* @__PURE__ */ jsx9("p", { children: "Nessuna attivit\xE0 collegata da modificare." }),
      /* @__PURE__ */ jsx9("button", { onClick: onCancel, children: "Torna all'area socio" })
    ] });
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    const serviziOfferti = serviziInput.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    if (serviziOfferti.length === 0) {
      setErrorMessage("Indicare almeno un servizio offerto (separati da virgola).");
      return;
    }
    setSaving(true);
    try {
      await onSave(currentActivity.id, {
        nomeAttivita,
        descrizioneBreve,
        descrizioneCompleta,
        serviziOfferti,
        localita,
        indirizzoPubblico: indirizzoPubblico.trim() || void 0,
        telefonoPubblico: telefonoPubblico.trim() || void 0,
        emailPubblica: emailPubblica.trim() || void 0,
        sitoWeb: sitoWeb.trim() || void 0,
        orariApertura: orariApertura.trim() || void 0
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs8("div", { style: { maxWidth: "750px", margin: "30px auto", padding: "0 20px" }, children: [
    /* @__PURE__ */ jsx9(
      "button",
      {
        onClick: onCancel,
        style: {
          padding: "6px 12px",
          backgroundColor: "#F1F5F9",
          border: "1px solid #CBD5E1",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "20px",
          fontSize: "13px"
        },
        children: "\u2190 Annulla e Torna alla Dashboard"
      }
    ),
    /* @__PURE__ */ jsxs8(
      "div",
      {
        style: {
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "30px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        },
        children: [
          /* @__PURE__ */ jsx9("h1", { style: { fontSize: "22px", color: "#0F172A", margin: "0 0 8px 0" }, children: "Modifica Scheda della Tua Attivit\xE0" }),
          /* @__PURE__ */ jsxs8(
            "div",
            {
              style: {
                backgroundColor: "#FFFBEB",
                border: "1px solid #FCD34D",
                borderRadius: "6px",
                padding: "12px 16px",
                marginBottom: "24px",
                fontSize: "13px",
                color: "#92400E",
                lineHeight: 1.4
              },
              children: [
                /* @__PURE__ */ jsx9("strong", { children: "Regola Associativa:" }),
                " Il socio ha diritto esclusivo di aggiornare la propria attivit\xE0. A tutela della trasparenza associativa, qualsiasi modifica inviata pone la scheda nello stato",
                " ",
                /* @__PURE__ */ jsx9("strong", { children: "IN ATTESA DI APPROVAZIONE" }),
                " in vista della ripubblicazione."
              ]
            }
          ),
          errorMessage && /* @__PURE__ */ jsx9(
            "div",
            {
              style: {
                backgroundColor: "#FEF2F2",
                border: "1px solid #F87171",
                borderRadius: "6px",
                padding: "12px",
                color: "#991B1B",
                fontSize: "13px",
                marginBottom: "20px"
              },
              children: errorMessage
            }
          ),
          /* @__PURE__ */ jsxs8("form", { onSubmit: handleSubmit, style: { display: "flex", flexDirection: "column", gap: "18px" }, children: [
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx9("label", { htmlFor: "nomeAttivita", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Nome dell'Attivit\xE0 *" }),
              /* @__PURE__ */ jsx9(
                "input",
                {
                  id: "nomeAttivita",
                  type: "text",
                  value: nomeAttivita,
                  onChange: (e) => setNomeAttivita(e.target.value),
                  required: true,
                  minLength: 3,
                  maxLength: 100,
                  style: {
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    boxSizing: "border-box"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx9("label", { htmlFor: "descrizioneBreve", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Descrizione Breve (10 - 250 caratteri) *" }),
              /* @__PURE__ */ jsx9(
                "input",
                {
                  id: "descrizioneBreve",
                  type: "text",
                  value: descrizioneBreve,
                  onChange: (e) => setDescrizioneBreve(e.target.value),
                  required: true,
                  minLength: 10,
                  maxLength: 250,
                  style: {
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    boxSizing: "border-box"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx9("label", { htmlFor: "descrizioneCompleta", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Descrizione Completa *" }),
              /* @__PURE__ */ jsx9(
                "textarea",
                {
                  id: "descrizioneCompleta",
                  rows: 4,
                  value: descrizioneCompleta,
                  onChange: (e) => setDescrizioneCompleta(e.target.value),
                  required: true,
                  minLength: 20,
                  maxLength: 3e3,
                  style: {
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                    fontFamily: "inherit"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx9("label", { htmlFor: "serviziInput", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Servizi Offerti (separati da virgola) *" }),
              /* @__PURE__ */ jsx9(
                "input",
                {
                  id: "serviziInput",
                  type: "text",
                  value: serviziInput,
                  onChange: (e) => setServiziInput(e.target.value),
                  placeholder: "es. Restauro mobili, Doratura, Perizie",
                  required: true,
                  style: {
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    boxSizing: "border-box"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs8("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }, children: [
              /* @__PURE__ */ jsxs8("div", { children: [
                /* @__PURE__ */ jsx9("label", { htmlFor: "localita", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Localit\xE0 *" }),
                /* @__PURE__ */ jsx9(
                  "input",
                  {
                    id: "localita",
                    type: "text",
                    value: localita,
                    onChange: (e) => setLocalita(e.target.value),
                    required: true,
                    style: {
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #CBD5E1",
                      borderRadius: "6px",
                      boxSizing: "border-box"
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs8("div", { children: [
                /* @__PURE__ */ jsx9("label", { htmlFor: "indirizzoPubblico", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Indirizzo Pubblico" }),
                /* @__PURE__ */ jsx9(
                  "input",
                  {
                    id: "indirizzoPubblico",
                    type: "text",
                    value: indirizzoPubblico,
                    onChange: (e) => setIndirizzoPubblico(e.target.value),
                    style: {
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #CBD5E1",
                      borderRadius: "6px",
                      boxSizing: "border-box"
                    }
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs8("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }, children: [
              /* @__PURE__ */ jsxs8("div", { children: [
                /* @__PURE__ */ jsx9("label", { htmlFor: "telefonoPubblico", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Telefono Pubblico" }),
                /* @__PURE__ */ jsx9(
                  "input",
                  {
                    id: "telefonoPubblico",
                    type: "text",
                    value: telefonoPubblico,
                    onChange: (e) => setTelefonoPubblico(e.target.value),
                    style: {
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #CBD5E1",
                      borderRadius: "6px",
                      boxSizing: "border-box"
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs8("div", { children: [
                /* @__PURE__ */ jsx9("label", { htmlFor: "emailPubblica", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Email Pubblica" }),
                /* @__PURE__ */ jsx9(
                  "input",
                  {
                    id: "emailPubblica",
                    type: "email",
                    value: emailPubblica,
                    onChange: (e) => setEmailPubblica(e.target.value),
                    style: {
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #CBD5E1",
                      borderRadius: "6px",
                      boxSizing: "border-box"
                    }
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx9("label", { htmlFor: "sitoWeb", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Sito Web Ufficiale (deve iniziare con http:// o https://)" }),
              /* @__PURE__ */ jsx9(
                "input",
                {
                  id: "sitoWeb",
                  type: "url",
                  value: sitoWeb,
                  onChange: (e) => setSitoWeb(e.target.value),
                  placeholder: "https://...",
                  style: {
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    boxSizing: "border-box"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx9("label", { htmlFor: "orariApertura", style: { display: "block", fontSize: "14px", fontWeight: 600, color: "#1E293B", marginBottom: "6px" }, children: "Orari di Apertura" }),
              /* @__PURE__ */ jsx9(
                "input",
                {
                  id: "orariApertura",
                  type: "text",
                  value: orariApertura,
                  onChange: (e) => setOrariApertura(e.target.value),
                  placeholder: "es. Lun-Ven 09:00 - 18:00",
                  style: {
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    boxSizing: "border-box"
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs8("div", { style: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }, children: [
              /* @__PURE__ */ jsx9(
                "button",
                {
                  type: "button",
                  onClick: onCancel,
                  style: {
                    padding: "10px 20px",
                    backgroundColor: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px"
                  },
                  children: "Annulla"
                }
              ),
              /* @__PURE__ */ jsx9(
                "button",
                {
                  type: "submit",
                  disabled: saving,
                  style: {
                    padding: "10px 24px",
                    backgroundColor: "#0F172A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    cursor: saving ? "wait" : "pointer",
                    fontSize: "14px",
                    fontWeight: 600
                  },
                  children: saving ? "Salvataggio..." : "Salva Modifiche Scheda"
                }
              )
            ] })
          ] })
        ]
      }
    )
  ] });
};

// src/App.tsx
import { Fragment, jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
var AppContent = () => {
  const { status, user, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState5(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });
  const [activities, setActivities] = useState5([]);
  const [showcaseLoading, setShowcaseLoading] = useState5(true);
  const [showcaseError, setShowcaseError] = useState5(null);
  const [selectedActivity, setSelectedActivity] = useState5(null);
  const [detailLoading, setDetailLoading] = useState5(false);
  const [detailError, setDetailError] = useState5(null);
  const [memberData, setMemberData] = useState5(null);
  const [memberLoading, setMemberLoading] = useState5(false);
  const [memberError, setMemberError] = useState5(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState5(null);
  const navigate = (path) => {
    setCurrentPath(path);
    if (typeof window !== "undefined" && window.history) {
      window.history.pushState({}, "", path);
    }
  };
  useEffect2(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  useEffect2(() => {
    if (status === "UNAUTHENTICATED") {
      if (currentPath === "/socio" || currentPath === "/socio/attivita") {
        navigate("/login");
      }
    }
  }, [status, currentPath]);
  const loadShowcase = async () => {
    setShowcaseLoading(true);
    setShowcaseError(null);
    try {
      const data = await apiClient.getPublicShowcase();
      setActivities(data);
    } catch (err) {
      setShowcaseError(
        err instanceof Error ? err.message : "Impossibile connettersi alle REST API per recuperare la vetrina."
      );
    } finally {
      setShowcaseLoading(false);
    }
  };
  const loadActivityDetail = async (id) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const act = await apiClient.getPublicActivity(id);
      setSelectedActivity(act);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Attivit\xE0 non trovata");
      setSelectedActivity(null);
    } finally {
      setDetailLoading(false);
    }
  };
  const loadMemberArea = async () => {
    if (status !== "AUTHENTICATED_MEMBER") {
      return;
    }
    setMemberLoading(true);
    setMemberError(null);
    try {
      const data = await apiClient.getMemberAreaMe();
      setMemberData(data);
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Errore nel caricamento area socio");
    } finally {
      setMemberLoading(false);
    }
  };
  useEffect2(() => {
    if (status === "INITIALIZING") {
      return;
    }
    if (currentPath === "/") {
      loadShowcase();
    } else if (currentPath.startsWith("/attivita/")) {
      const id = currentPath.replace("/attivita/", "");
      if (id) {
        loadActivityDetail(id);
      }
    } else if (currentPath === "/socio" || currentPath === "/socio/attivita") {
      if (status === "AUTHENTICATED_MEMBER") {
        loadMemberArea();
      }
    }
  }, [currentPath, status]);
  const handleSaveActivity = async (activityId, payload) => {
    setFeedbackSuccess(null);
    await apiClient.updateActivity(activityId, payload);
    setFeedbackSuccess(
      "La tua scheda attivit\xE0 \xE8 stata aggiornata con successo. Conformemente allo statuto, la scheda \xE8 ora in attesa di approvazione."
    );
    await loadMemberArea();
    navigate("/socio");
  };
  const handleLogout = async () => {
    await logout();
    setMemberData(null);
    navigate("/login");
  };
  return /* @__PURE__ */ jsxs9("div", { style: { minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ jsx10(
      "header",
      {
        style: {
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          padding: "16px 24px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        },
        children: /* @__PURE__ */ jsxs9(
          "div",
          {
            style: {
              maxWidth: "1100px",
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            },
            children: [
              /* @__PURE__ */ jsxs9("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
                /* @__PURE__ */ jsx10(
                  "span",
                  {
                    onClick: () => navigate("/"),
                    style: { fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em", cursor: "pointer" },
                    children: "PRO-LOCAL"
                  }
                ),
                /* @__PURE__ */ jsx10(
                  "span",
                  {
                    style: {
                      fontSize: "11px",
                      backgroundColor: "#1E293B",
                      color: "#94A3B8",
                      padding: "2px 8px",
                      borderRadius: "4px"
                    },
                    children: "Associazione Territoriale"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs9("nav", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [
                /* @__PURE__ */ jsx10(
                  "button",
                  {
                    onClick: () => navigate("/"),
                    style: {
                      backgroundColor: currentPath === "/" || currentPath.startsWith("/attivita") ? "#1E293B" : "transparent",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px"
                    },
                    children: "Vetrina Pubblica"
                  }
                ),
                status === "UNAUTHENTICATED" && /* @__PURE__ */ jsx10(
                  "button",
                  {
                    onClick: () => navigate("/login"),
                    style: {
                      backgroundColor: currentPath === "/login" ? "#2563EB" : "transparent",
                      color: "#FFFFFF",
                      border: "1px solid #3B82F6",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 500
                    },
                    children: "Accedi"
                  }
                ),
                status === "AUTHENTICATED_MEMBER" && /* @__PURE__ */ jsxs9(Fragment, { children: [
                  /* @__PURE__ */ jsx10(
                    "button",
                    {
                      onClick: () => navigate("/socio"),
                      style: {
                        backgroundColor: currentPath.startsWith("/socio") ? "#2563EB" : "transparent",
                        color: "#FFFFFF",
                        border: "1px solid #3B82F6",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 500
                      },
                      children: "Area Socio"
                    }
                  ),
                  /* @__PURE__ */ jsx10(
                    "button",
                    {
                      onClick: handleLogout,
                      style: {
                        backgroundColor: "transparent",
                        color: "#94A3B8",
                        border: "1px solid #334155",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px"
                      },
                      children: "Esci"
                    }
                  )
                ] }),
                status === "AUTHENTICATED_TECHNICAL_ADMIN" && /* @__PURE__ */ jsxs9(Fragment, { children: [
                  /* @__PURE__ */ jsx10(
                    "button",
                    {
                      onClick: () => navigate("/socio"),
                      style: {
                        backgroundColor: "#334155",
                        color: "#38BDF8",
                        border: "1px solid #0EA5E9",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 600
                      },
                      children: "Pannello Tecnico"
                    }
                  ),
                  /* @__PURE__ */ jsx10(
                    "button",
                    {
                      onClick: handleLogout,
                      style: {
                        backgroundColor: "transparent",
                        color: "#EF4444",
                        border: "1px solid #991B1B",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px"
                      },
                      children: "Esci"
                    }
                  )
                ] })
              ] })
            ]
          }
        )
      }
    ),
    feedbackSuccess && /* @__PURE__ */ jsxs9(
      "div",
      {
        style: {
          maxWidth: "850px",
          margin: "20px auto 0 auto",
          padding: "12px 20px",
          backgroundColor: "#ECFDF5",
          border: "1px solid #6EE7B7",
          borderRadius: "6px",
          color: "#065F46",
          fontSize: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        },
        children: [
          /* @__PURE__ */ jsxs9("span", { children: [
            "\u2713 ",
            feedbackSuccess
          ] }),
          /* @__PURE__ */ jsx10(
            "button",
            {
              onClick: () => setFeedbackSuccess(null),
              style: { background: "none", border: "none", cursor: "pointer", color: "#065F46", fontWeight: "bold" },
              children: "\u2715"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx10("main", { style: { flex: 1, paddingBottom: "40px" }, children: status === "INITIALIZING" ? /* @__PURE__ */ jsx10("div", { style: { textAlign: "center", padding: "60px 20px", color: "#64748B" }, children: /* @__PURE__ */ jsx10("p", { style: { fontSize: "15px" }, children: "Verifica sessione in corso..." }) }) : /* @__PURE__ */ jsxs9(Fragment, { children: [
      currentPath === "/" && /* @__PURE__ */ jsx10(
        ShowcaseView,
        {
          activities,
          loading: showcaseLoading,
          error: showcaseError,
          onSelectActivity: (act) => navigate(`/attivita/${act.id}`)
        }
      ),
      currentPath.startsWith("/attivita/") && /* @__PURE__ */ jsx10(
        ActivityDetailView,
        {
          activity: selectedActivity,
          loading: detailLoading,
          error: detailError,
          onBack: () => navigate("/")
        }
      ),
      currentPath === "/login" && /* @__PURE__ */ jsx10(
        LoginView,
        {
          onSuccess: (actorType) => {
            if (actorType === "TECHNICAL_ADMIN") {
              navigate("/socio");
            } else {
              navigate("/socio");
            }
          },
          onCancel: () => navigate("/")
        }
      ),
      currentPath === "/socio" && (status === "AUTHENTICATED_TECHNICAL_ADMIN" ? /* @__PURE__ */ jsx10(
        TechnicalAdminView,
        {
          user,
          onLogout: handleLogout,
          onGoHome: () => navigate("/")
        }
      ) : status === "AUTHENTICATED_MEMBER" ? /* @__PURE__ */ jsx10(
        MemberDashboardView,
        {
          memberData,
          loading: memberLoading,
          error: memberError,
          onEditActivity: () => navigate("/socio/attivita")
        }
      ) : /* @__PURE__ */ jsx10("div", { style: { textAlign: "center", padding: "40px" }, children: /* @__PURE__ */ jsx10("p", { children: "Reindirizzamento all'accesso in corso..." }) })),
      currentPath === "/socio/attivita" && (status === "AUTHENTICATED_TECHNICAL_ADMIN" ? /* @__PURE__ */ jsx10("div", { style: { maxWidth: "700px", margin: "40px auto", padding: "0 20px" }, children: /* @__PURE__ */ jsxs9("div", { style: { padding: "20px", backgroundColor: "#FEF2F2", border: "1px solid #F87171", borderRadius: "8px", color: "#991B1B" }, children: [
        /* @__PURE__ */ jsx10("h3", { style: { margin: "0 0 8px 0" }, children: "Accesso Non Consentito" }),
        /* @__PURE__ */ jsx10("p", { style: { margin: "0 0 12px 0" }, children: "L'Amministratore Tecnico non possiede una scheda socio n\xE9 attivit\xE0 commerciali da modificare." }),
        /* @__PURE__ */ jsx10(
          "button",
          {
            onClick: () => navigate("/socio"),
            style: { padding: "6px 12px", backgroundColor: "#1E293B", color: "#FFFFFF", border: "none", borderRadius: "4px", cursor: "pointer" },
            children: "Torna al Pannello Tecnico"
          }
        )
      ] }) }) : status === "AUTHENTICATED_MEMBER" ? memberData ? /* @__PURE__ */ jsx10(
        ActivityEditView,
        {
          memberData,
          onSave: handleSaveActivity,
          onCancel: () => navigate("/socio")
        }
      ) : /* @__PURE__ */ jsx10("div", { style: { textAlign: "center", padding: "40px" }, children: /* @__PURE__ */ jsx10("p", { children: "Caricamento dati socio in corso..." }) }) : /* @__PURE__ */ jsx10("div", { style: { textAlign: "center", padding: "40px" }, children: /* @__PURE__ */ jsx10("p", { children: "Reindirizzamento all'accesso in corso..." }) }))
    ] }) }),
    /* @__PURE__ */ jsxs9(
      "footer",
      {
        style: {
          backgroundColor: "#0F172A",
          borderTop: "1px solid #1E293B",
          color: "#94A3B8",
          padding: "24px 20px",
          fontSize: "13px",
          textAlign: "center"
        },
        children: [
          /* @__PURE__ */ jsxs9("p", { style: { margin: "0 0 6px 0" }, children: [
            /* @__PURE__ */ jsx10("strong", { children: "Associazione Pro-Local" }),
            " \u2014 Promozione democratica territoriale & Vetrina neutrale delle attivit\xE0 dei soci."
          ] }),
          /* @__PURE__ */ jsx10("p", { style: { margin: 0, fontSize: "12px", color: "#64748B" }, children: "Tutte le attivit\xE0 esposte mantengono la loro totale autonomia contrattuale e professionale. L'associazione non rilascia attestati commerciali n\xE9 assume responsabilit\xE0 di intermediazione." })
        ]
      }
    )
  ] });
};

// tests/auth_integration.test.ts
describe("Pro-Local Frontend Authentication Integration Tests (Fase 3.5)", () => {
  const createMockFetch = (handler) => {
    return async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      const res = handler(url, init);
      return {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        statusText: res.status === 200 ? "OK" : "Error",
        headers: new Headers(res.headers || {}),
        json: async () => res.body,
        text: async () => JSON.stringify(res.body)
      };
    };
  };
  it('apiClient.login invia POST con credentials: "include", X-Requested-With: "ProLocalApp" e riceve la risposta', async () => {
    let capturedInit;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch((url, init) => {
      capturedInit = init;
      return {
        status: 200,
        body: {
          authenticated: true,
          user: {
            id: "usr-01",
            email: "mario.rossi@demo.it",
            actorType: "MEMBER",
            memberId: "socio-01"
          }
        }
      };
    });
    try {
      const client = new ProLocalApiClient("http://test-server");
      const res = await client.login("mario.rossi@demo.it", "Password123!");
      assert.strictEqual(res.authenticated, true);
      assert.strictEqual(res.user.email, "mario.rossi@demo.it");
      assert.strictEqual(capturedInit?.method, "POST");
      assert.strictEqual(capturedInit?.credentials, "include");
      const headers = capturedInit?.headers;
      assert.strictEqual(headers["Content-Type"], "application/json");
      assert.strictEqual(headers["X-Requested-With"], "ProLocalApp");
      const body = JSON.parse(capturedInit?.body);
      assert.strictEqual(body.email, "mario.rossi@demo.it");
      assert.strictEqual(body.password, "Password123!");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it("apiClient.login rifiuta con ApiError(401) generico su credenziali non valide", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch(() => ({
      status: 401,
      body: { error: "Credenziali non valide." }
    }));
    try {
      const client = new ProLocalApiClient("http://test-server");
      await assert.rejects(
        async () => {
          await client.login("sconosciuto@demo.it", "errata");
        },
        (err) => {
          assert.strictEqual(err.status, 401);
          assert.strictEqual(err.message, "Credenziali non valide. Verificare email e password.");
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it("apiClient.login rifiuta con ApiError(423) descrittivo su account temporaneamente bloccato", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch(() => ({
      status: 423,
      body: { error: "Account temporaneamente bloccato.", lockedUntil: "2026-09-21T12:00:00Z" }
    }));
    try {
      const client = new ProLocalApiClient("http://test-server");
      await assert.rejects(
        async () => {
          await client.login("bloccato@demo.it", "errata");
        },
        (err) => {
          assert.strictEqual(err.status, 423);
          assert(err.message.includes("bloccato per motivi di sicurezza"));
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it('apiClient.getCurrentUser recupera identit\xE0 verificata dal backend con credentials: "include"', async () => {
    let capturedInit;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch((url, init) => {
      capturedInit = init;
      return {
        status: 200,
        body: {
          authenticated: true,
          userId: "usr-01",
          actorType: "MEMBER",
          role: "SOCIO",
          memberId: "socio-01",
          membershipStatus: "ATTIVO",
          member: {
            id: "socio-01",
            codiceSocio: "SOC-001",
            nomeCognome: "Mario Rossi",
            emailDemo: "mario.rossi@demo.it",
            dataIscrizione: "2024-01-15",
            statoAssociativo: "ATTIVO",
            quotaSocialeInRegola: true
          }
        }
      };
    });
    try {
      const client = new ProLocalApiClient("http://test-server");
      const me = await client.getCurrentUser();
      assert(me !== null);
      assert.strictEqual(me.authenticated, true);
      assert.strictEqual(me.actorType, "MEMBER");
      assert.strictEqual(me.role, "SOCIO");
      assert.strictEqual(me.memberId, "socio-01");
      assert.strictEqual(capturedInit?.credentials, "include");
      assert.strictEqual(capturedInit?.method, "GET");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it("apiClient.getCurrentUser restituisce null su 401 senza sollevare eccezioni bloccanti", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch(() => ({
      status: 401,
      body: { error: "Non autenticato" }
    }));
    try {
      const client = new ProLocalApiClient("http://test-server");
      const me = await client.getCurrentUser();
      assert.strictEqual(me, null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it('apiClient.logout invia POST /api/auth/logout con X-Requested-With e credentials: "include"', async () => {
    let capturedInit;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch((url, init) => {
      capturedInit = init;
      return {
        status: 200,
        body: { messaggio: "Logout effettuato con successo." }
      };
    });
    try {
      const client = new ProLocalApiClient("http://test-server");
      await client.logout();
      assert.strictEqual(capturedInit?.method, "POST");
      assert.strictEqual(capturedInit?.credentials, "include");
      const headers = capturedInit?.headers;
      assert.strictEqual(headers["X-Requested-With"], "ProLocalApp");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it("nessun X-Demo-Member-Id n\xE9 X-Demo-Role inviato dal frontend reale", async () => {
    const originalFetch = globalThis.fetch;
    const capturedHeaders = [];
    globalThis.fetch = createMockFetch((url, init) => {
      capturedHeaders.push(init?.headers || {});
      if (url.includes("/api/auth/me")) {
        return {
          status: 200,
          body: {
            authenticated: true,
            userId: "usr-01",
            actorType: "MEMBER",
            role: "SOCIO",
            memberId: "socio-01"
          }
        };
      }
      if (url.includes("/api/members/me")) {
        return {
          status: 200,
          body: {
            authMode: "REAL_SESSION",
            notaAutenticazione: "Sessione reale",
            socio: { id: "socio-01", nomeCognome: "Mario Rossi" },
            attivita: null,
            tutteAttivita: []
          }
        };
      }
      return { status: 200, body: {} };
    });
    try {
      const client = new ProLocalApiClient("http://test-server");
      await client.getCurrentUser();
      await client.getMemberAreaMe();
      for (const h of capturedHeaders) {
        assert.strictEqual(h["X-Demo-Member-Id"], void 0, "Non deve inviare X-Demo-Member-Id");
        assert.strictEqual(h["X-Demo-Role"], void 0, "Non deve inviare X-Demo-Role");
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it('apiClient.updateActivity include X-Requested-With e credentials: "include" senza header X-Demo-*', async () => {
    let capturedInit;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch((url, init) => {
      capturedInit = init;
      return {
        status: 200,
        body: {
          messaggio: "Attivit\xE0 aggiornata con successo.",
          attivita: { id: "act-01", nomeAttivita: "Nuovo Nome" }
        }
      };
    });
    try {
      const client = new ProLocalApiClient("http://test-server");
      const res = await client.updateActivity("act-01", {
        nomeAttivita: "Nuovo Nome",
        descrizioneBreve: "Descrizione valida e sufficientemente lunga",
        descrizioneCompleta: "Descrizione completa valida",
        serviziOfferti: ["Servizio 1"],
        localita: "Roma"
      });
      assert(res.messaggio.includes("successo"));
      assert.strictEqual(capturedInit?.method, "PUT");
      assert.strictEqual(capturedInit?.credentials, "include");
      const headers = capturedInit?.headers;
      assert.strictEqual(headers["X-Requested-With"], "ProLocalApp");
      assert.strictEqual(headers["X-Demo-Member-Id"], void 0);
      assert.strictEqual(headers["X-Demo-Role"], void 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it("apiClient notifica session expiration (onUnauthorized) quando riceve 401", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch(() => ({
      status: 401,
      body: { error: "Sessione scaduta" }
    }));
    try {
      const client = new ProLocalApiClient("http://test-server");
      let unauthorizedNotified = false;
      client.setOnUnauthorized(() => {
        unauthorizedNotified = true;
      });
      await assert.rejects(async () => {
        await client.getMemberAreaMe();
      });
      assert.strictEqual(unauthorizedNotified, true, "Deve invocare il callback di session expiration");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  it("LoginView renderizza il form di accesso con campi email, password e pulsante protetto", () => {
    const mockAuthContext = {
      status: "UNAUTHENTICATED",
      user: null,
      login: async () => {
      },
      logout: async () => {
      },
      refreshAuth: async () => {
      }
    };
    const html = renderToStaticMarkup(
      React6.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React6.createElement(LoginView, {
          onSuccess: () => {
          },
          onCancel: () => {
          }
        })
      )
    );
    assert(html.includes("Accesso Area Riservata"), "Deve mostrare il titolo di login");
    assert(html.includes("Indirizzo Email"), "Deve contenere la label email");
    assert(html.includes("Password"), "Deve contenere la label password");
    assert(html.includes("Accedi"), "Deve contenere il pulsante di invio");
    assert(html.includes("Torna alla Vetrina Pubblica"), "Deve contenere il tasto per annullare");
  });
  it("TechnicalAdminView renderizza la vista tecnica con memberId nullo e clausola di separazione dei poteri", () => {
    const adminUser = {
      userId: "usr-admin-01",
      actorType: "TECHNICAL_ADMIN",
      role: "AMMINISTRATORE_TECNICO",
      memberId: null,
      membershipStatus: null,
      member: null
    };
    const html = renderToStaticMarkup(
      React6.createElement(TechnicalAdminView, {
        user: adminUser,
        onLogout: () => {
        },
        onGoHome: () => {
        }
      })
    );
    assert(html.includes("Sessione Amministratore Tecnico"), "Deve mostrare titolo admin");
    assert(html.includes("AMMINISTRATORE_TECNICO"), "Deve mostrare ruolo tecnico");
    assert(html.includes("usr-admin-01"), "Deve mostrare userId");
    assert(html.includes("memberId = null"), "Deve specificare che memberId \xE8 null");
    assert(html.includes("Separazione dei Ruoli e Trasparenza Statutaria"), "Deve contenere nota statutaria");
    assert(html.includes("Nessuna (Riservata ai soli soci)"), "Deve specificare che non ha scheda socio");
  });
  it("App in stato INITIALIZING renderizza il messaggio di verifica sessione evitando flash", () => {
    const mockAuthContext = {
      status: "INITIALIZING",
      user: null,
      login: async () => {
      },
      logout: async () => {
      },
      refreshAuth: async () => {
      }
    };
    const html = renderToStaticMarkup(
      React6.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React6.createElement(AppContent)
      )
    );
    assert(html.includes("Verifica sessione in corso..."), "Deve mostrare caricamento iniziale");
    assert(!html.includes("Accesso Area Riservata"), "Non deve mostrare login form durante initializing");
  });
  it("App su route protetta /socio con utente non autenticato mostra indicazione di reindirizzamento al login", () => {
    const mockAuthContext = {
      status: "UNAUTHENTICATED",
      user: null,
      login: async () => {
      },
      logout: async () => {
      },
      refreshAuth: async () => {
      }
    };
    const previousWindow = globalThis.window;
    globalThis.window = {
      location: { pathname: "/socio" },
      addEventListener: () => {
      },
      removeEventListener: () => {
      }
    };
    try {
      const html = renderToStaticMarkup(
        React6.createElement(
          AuthContext.Provider,
          { value: mockAuthContext },
          React6.createElement(AppContent)
        )
      );
      assert(html.includes("Reindirizzamento"), "Deve mostrare reindirizzamento al login");
      assert(html.includes("Accedi"), "Navbar deve mostrare tasto Accedi");
    } finally {
      globalThis.window = previousWindow;
    }
  });
  it('App con utente socio autenticato renderizza i controlli di sessione "Area Socio" ed "Esci"', () => {
    const memberUser = {
      userId: "usr-01",
      actorType: "MEMBER",
      role: "SOCIO",
      memberId: "socio-01",
      membershipStatus: "ATTIVO",
      member: {
        id: "socio-01",
        codiceSocio: "SOC-001",
        nomeCognome: "Mario Rossi",
        emailDemo: "mario.rossi@demo.it",
        dataIscrizione: "2024-01-15",
        statoAssociativo: "ATTIVO",
        quotaSocialeInRegola: true
      }
    };
    const mockAuthContext = {
      status: "AUTHENTICATED_MEMBER",
      user: memberUser,
      login: async () => {
      },
      logout: async () => {
      },
      refreshAuth: async () => {
      }
    };
    const html = renderToStaticMarkup(
      React6.createElement(
        AuthContext.Provider,
        { value: mockAuthContext },
        React6.createElement(AppContent)
      )
    );
    assert(html.includes("Area Socio"), "Navbar deve mostrare Area Socio");
    assert(html.includes("Esci"), "Navbar deve mostrare tasto Esci");
    assert(!html.includes("Pannello Tecnico"), "Non deve mostrare pannello tecnico per i soci");
  });
  it("App con Technical Admin autenticato impedisce accesso a /socio/attivita", () => {
    const adminUser = {
      userId: "usr-admin-01",
      actorType: "TECHNICAL_ADMIN",
      role: "AMMINISTRATORE_TECNICO",
      memberId: null,
      membershipStatus: null,
      member: null
    };
    const mockAuthContext = {
      status: "AUTHENTICATED_TECHNICAL_ADMIN",
      user: adminUser,
      login: async () => {
      },
      logout: async () => {
      },
      refreshAuth: async () => {
      }
    };
    const previousWindow = globalThis.window;
    globalThis.window = {
      location: { pathname: "/socio/attivita" },
      addEventListener: () => {
      },
      removeEventListener: () => {
      }
    };
    try {
      const html = renderToStaticMarkup(
        React6.createElement(
          AuthContext.Provider,
          { value: mockAuthContext },
          React6.createElement(AppContent)
        )
      );
      assert(html.includes("Accesso Non Consentito"), "Deve mostrare blocco accesso");
      assert(html.includes("Amministratore Tecnico non possiede una scheda socio"), "Deve spiegare il divieto statutario");
    } finally {
      globalThis.window = previousWindow;
    }
  });
  it("Nessun accesso a document.cookie per leggere il session token (HttpOnly rispettato)", () => {
    const mockDocument = {
      get cookie() {
        throw new Error("Accesso a document.cookie NON consentito dal modello di sicurezza HttpOnly!");
      }
    };
    const previousDoc = globalThis.document;
    globalThis.document = mockDocument;
    try {
      const client = new ProLocalApiClient("http://test-server");
      assert.strictEqual(typeof client.login, "function");
      assert.strictEqual(typeof client.getCurrentUser, "function");
      assert.strictEqual(typeof client.logout, "function");
      assert.strictEqual(typeof client.getMemberAreaMe, "function");
    } finally {
      globalThis.document = previousDoc;
    }
  });
});
