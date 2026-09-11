import type { BusinessActivity, Member } from '../domain/models.ts';
import { AccessControlPolicy } from '../domain/policies/AccessControlPolicy.ts';
import type { IBusinessActivityRepository } from '../repositories/BusinessActivityRepository.ts';
import type { IMemberRepository } from '../repositories/MemberRepository.ts';

export interface PublicActivityDto {
  id: string;
  nomeAttivita: string;
  categoria: string;
  descrizioneBreve: string;
  descrizioneCompleta: string;
  serviziOfferti: string[];
  localita: string;
  indirizzoPubblico?: string;
  telefonoPubblico?: string;
  emailPubblica?: string;
  sitoWeb?: string;
  socialInstagram?: string;
  socialLinkedin?: string;
  orariApertura?: string;
  dataUltimoAggiornamento: string;
  trasparenza: {
    autonomiaAttivita: boolean;
    notaLegale: string;
  };
}

export class ShowcaseService {
  private activityRepo: IBusinessActivityRepository;
  private memberRepo: IMemberRepository;

  constructor(activityRepo: IBusinessActivityRepository, memberRepo: IMemberRepository) {
    this.activityRepo = activityRepo;
    this.memberRepo = memberRepo;
  }

  /**
   * Restituisce solo le attività ammesse alla visualizzazione pubblica:
   * 1. Scheda PUBBLICATA
   * 2. Socio titolare ATTIVO
   * Esclude categoricamente qualsiasi badge promozionale o attestato di garanzia commerciale.
   */
  async getPublicShowcase(): Promise<PublicActivityDto[]> {
    const activities = await this.activityRepo.findAll();
    const publicList: PublicActivityDto[] = [];

    for (const act of activities) {
      const member = await this.memberRepo.findById(act.memberId);
      if (!member) continue;

      if (AccessControlPolicy.isActivityPubliclyVisible(act, member.statoAssociativo)) {
        publicList.push(this.toPublicDto(act));
      }
    }

    return publicList;
  }

  /**
   * Recupera il dettaglio pubblico di una singola attività.
   * Se l'attività non è pubblicata o il socio non è attivo, restituisce null
   * per impedire il bypass della vetrina tramite accesso diretto all'endpoint.
   */
  async getPublicActivityById(id: string): Promise<PublicActivityDto | null> {
    const act = await this.activityRepo.findById(id);
    if (!act) return null;

    const member = await this.memberRepo.findById(act.memberId);
    if (!member) return null;

    if (!AccessControlPolicy.isActivityPubliclyVisible(act, member.statoAssociativo)) {
      return null;
    }

    return this.toPublicDto(act);
  }

  private toPublicDto(act: BusinessActivity): PublicActivityDto {
    return {
      id: act.id,
      nomeAttivita: act.nomeAttivita,
      categoria: act.categoria,
      descrizioneBreve: act.descrizioneBreve,
      descrizioneCompleta: act.descrizioneCompleta,
      serviziOfferti: [...act.serviziOfferti],
      localita: act.localita,
      indirizzoPubblico: act.indirizzoPubblico,
      telefonoPubblico: act.telefonoPubblico,
      emailPubblica: act.emailPubblica,
      sitoWeb: act.sitoWeb,
      socialInstagram: act.socialInstagram,
      socialLinkedin: act.socialLinkedin,
      orariApertura: act.orariApertura,
      dataUltimoAggiornamento: act.dataUltimoAggiornamento,
      trasparenza: {
        autonomiaAttivita: true,
        notaLegale:
          "Spazio informativo di ammissibilità associativa. L'associazione Pro-Local non verifica la perizia tecnica, non garantisce i servizi né assume responsabilità contrattuali."
      }
    };
  }
}
