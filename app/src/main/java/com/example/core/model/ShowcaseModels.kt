package com.example.core.model

/**
 * Stato associativo del socio dell'associazione Pro-Local.
 * REQUISITO FONDAMENTALE: Solo il socio con stato ATTIVO può avere la propria attività
 * effettivamente pubblicata e visibile nella Vetrina pubblica.
 */
enum class MembershipStatus(
    val label: String,
    val canPublishActivity: Boolean,
    val badgeColorType: String
) {
    ATTIVO("Socio Attivo", true, "SUCCESS"),
    IN_ATTESA("In Attesa di Regolarizzazione", false, "WARNING"),
    SOSPESO("Sospeso", false, "DANGER"),
    RECEDUTO("Receduto / Cessato", false, "MUTED")
}

/**
 * Categoria tematica dell'attività dei soci nella Vetrina Pro-Local.
 */
enum class ActivityCategory(
    val id: String,
    val title: String,
    val iconName: String,
    val descrizione: String
) {
    ARTIGIANATO_RESTAURO(
        id = "artigianato",
        title = "Artigianato & Restauro",
        iconName = "build",
        descrizione = "Botteghe artigiane d'arte, falegnameria, ceramica, restauro e lavorazioni tipiche"
    ),
    CONSULENZA_PROFESSIONALE(
        id = "consulenza",
        title = "Consulenza & Servizi",
        iconName = "business_center",
        descrizione = "Consulenza legale, fiscale, notarile, traduzioni, consulenza tecnica e d'impresa"
    ),
    ENOGASTRONOMIA_LOCALE(
        id = "enogastronomia",
        title = "Enogastronomia Tipica",
        iconName = "restaurant",
        descrizione = "Specialità locali d'eccellenza, agriturismi, prodotti tipici a chilometro zero e vinicoltura"
    ),
    BENESSERE_PERSONA(
        id = "benessere",
        title = "Benessere & Cura Persona",
        iconName = "spa",
        descrizione = "Fisioterapia, discipline olistiche, estetica naturale, cura della persona e movimento"
    ),
    INFORMATICA_DIGITALE(
        id = "digitale",
        title = "Informatica & Digitale",
        iconName = "computer",
        descrizione = "Sviluppo software, creazione siti web, grafica, comunicazione e supporto informatico"
    ),
    CULTURA_FORMAZIONE(
        id = "cultura",
        title = "Cultura & Formazione",
        iconName = "school",
        descrizione = "Corsi, laboratori artistici, formazione musicale, lezioni e percorsi didattici"
    ),
    SERVIZI_CASA(
        id = "servizi_casa",
        title = "Casa & Manutenzioni",
        iconName = "home_repair_service",
        descrizione = "Impiantistica, manutenzioni edili, giardinaggio, cura degli spazi e ristrutturazioni"
    )
}

/**
 * Stato della scheda attività nel ciclo di vita redazionale.
 */
enum class PublicationStatus(
    val label: String,
    val descrizione: String
) {
    BOZZA("Bozza", "La scheda è modificabile dal socio e non è visibile al pubblico"),
    IN_ATTESA_APPROVAZIONE("In Attesa di Approvazione", "Inviata alla segreteria/amministrazione per la verifica"),
    PUBBLICATA("Pubblicata", "Approvata e visibile nella vetrina pubblica se il socio è ATTIVO"),
    SOSPESA("Sospesa", "Temporaneamente sospesa dall'amministrazione per verifica o richiesta"),
    RIFIUTATA("Non Approvata", "Non approvata con note di revisione dell'amministrazione")
}

/**
 * Entità Socio (Member) dell'associazione.
 * Rigorosamente con dati dimostrativi privacy-safe, non personali reali.
 * Relazione concettuale: Member 1 -> N BusinessActivity.
 */
data class Member(
    val id: String,
    val codiceSocio: String,
    val nomeCognome: String,
    val emailDemo: String,
    val dataIscrizione: String,
    val statoAssociativo: MembershipStatus,
    val quotaSocialeInRegola: Boolean,
    val noteAmministrativeInterne: String = ""
)

/**
 * Scheda dell'attività economica o professionale del socio.
 * Un'attività può essere pubblicata SOLO se collegata a un socio con stato ATTIVO.
 */
data class BusinessActivity(
    val id: String,
    val memberId: String, // Chiave esterna verso Member (1 -> N)
    val nomeAttivita: String,
    val categoria: ActivityCategory,
    val descrizioneBreve: String,
    val descrizioneCompleta: String,
    val serviziOfferti: List<String>,
    val localita: String,
    val indirizzoPubblico: String = "",
    val telefonoPubblico: String = "",
    val emailPubblica: String = "",
    val sitoWeb: String = "",
    val socialInstagram: String = "",
    val socialLinkedin: String = "",
    val orariApertura: String = "",
    val statoPubblicazione: PublicationStatus,
    val dataUltimoAggiornamento: String,
    val noteRevisioneAdmin: String = ""
) {
    /**
     * Regola fondamentale di visibilità nella Vetrina:
     * L'attività è effettivamente visibile al visitatore pubblico SOLO SE:
     * 1) Lo stato pubblicazione è PUBBLICATA
     * 2) Il socio collegato ha stato associativo ATTIVO
     */
    fun isVisibileInVetrina(memberStatus: MembershipStatus): Boolean {
        return statoPubblicazione == PublicationStatus.PUBBLICATA && memberStatus.canPublishActivity
    }
}
