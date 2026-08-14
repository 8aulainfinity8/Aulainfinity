// FIX: Corrected import path.
import type { AppConfig } from '../types';

// App Configuration Table
export let appConfigData: AppConfig = {
  bizumNumber: '600 000 000',
  subscriptionPrice: 15,
  tutoringSchedule: [
    { day: 'Lunes', time: '17:00 - 18:00', subject: 'Matemáticas' },
    { day: 'Miércoles', time: '17:00 - 18:00', subject: 'Física' },
    { day: 'Viernes', time: '17:00 - 18:00', subject: 'Química' },
  ],
  supportEmail: 'soporte@aulainfinity.com',
  tutoringPrice: 12.5,
  supportPhone: '+34 600 000 000',
  registrationsOpen: true,
  subscriptionsEnabled: true,
  whatsappMode: 'direct',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioWhatsappFrom: '',
  metaPhoneNumberId: '',
  metaAccessToken: '',
  evolutionInstanceUrl: '',
  evolutionApiKey: '',
  greenapiIdInstance: '',
  greenapiApiTokenInstance: '',
  greenapiApiUrl: '',
  webrtcStunServers: 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun.cloudflare.com:3478,stun:stun.services.mozilla.com',
  webrtcUseTurn: false,
  webrtcTurnUrl: '',
  webrtcTurnUsername: '',
  webrtcTurnCredential: '',
};