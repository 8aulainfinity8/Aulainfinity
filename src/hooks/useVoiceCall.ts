import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  deleteDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { getDynamicRTCConfiguration, setAudioBitrate, createSilentAudioStream } from '../services/webrtcSignaling';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export interface UseVoiceCallProps {
  chatId: string | null;
  chatType?: 'direct' | 'peer' | 'group';
  userId: string | null;
  userName?: string;
  userRole?: 'admin' | 'profesor' | 'alumno' | 'teacher' | 'student';
}

export function useVoiceCall({
  chatId,
  chatType = 'direct',
  userId,
  userName = 'Usuario',
  userRole = 'student'
}: UseVoiceCallProps) {
  const [inCall, setInCall] = useState<boolean>(false);
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [incomingCall, setIncomingCall] = useState<boolean>(false);
  const [callerName, setCallerName] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callError, setCallError] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs de estado para evitar re-suscripciones del useEffect durante la llamada
  const inCallRef = useRef<boolean>(false);
  const isCallingRef = useRef<boolean>(false);
  const incomingCallRef = useRef<boolean>(false);

  useEffect(() => {
    inCallRef.current = inCall;
    isCallingRef.current = isCalling;
    incomingCallRef.current = incomingCall;
  }, [inCall, isCalling, incomingCall]);

  // En grupos solo Administrador o Profesor emiten audio. En 1a1 ambos emiten.
  const canEmitAudio = chatType !== 'group' || userRole === 'admin' || userRole === 'profesor' || userRole === 'teacher';

  // Limpiar recurso de temporizador de cancelación
  const clearCallTimeout = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }, []);

  // Limpiar PeerConnection y estado local
  const cleanupCall = useCallback(() => {
    clearCallTimeout();

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    iceCandidatesQueue.current = [];
    pendingOfferRef.current = null;
    setInCall(false);
    setIsCalling(false);
    setIncomingCall(false);
    setIsMuted(false);
  }, [clearCallTimeout]);

  // Procesar cola de candidatos ICE
  const flushIceCandidates = async () => {
    if (!peerConnection.current || !peerConnection.current.remoteDescription) return;
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] Error al añadir candidato ICE en cola:', err);
        }
      }
    }
  };

  // Escuchar señalización e ICE candidates en tiempo real
  useEffect(() => {
    if (!chatId || !userId) return;

    const signalDocRef = doc(db, 'chats', chatId, 'signal', 'callData');

    // Listener unificado de la llamada
    const unsubSignal = onSnapshot(signalDocRef, async (snapshot) => {
      if (!snapshot.exists()) {
        if (inCallRef.current || isCallingRef.current || incomingCallRef.current) {
          cleanupCall();
        }
        return;
      }

      const data = snapshot.data();

      // Si la llamada fue conectada con éxito, cancelar el timeout
      if (data.status === 'connected') {
        clearCallTimeout();
        setInCall(true);
        setIsCalling(false);
      }

      // Si entra una llamada de otro usuario
      if (data.status === 'calling' && data.callerId !== userId) {
        if (data.offer) {
          pendingOfferRef.current = data.offer;
          setIncomingCall(true);
          setCallerName(data.callerName || 'Usuario');

          // Timeout de 30 segundos si la llamada entrante no se atiende
          clearCallTimeout();
          callTimeoutRef.current = setTimeout(() => {
            if (peerConnection.current?.connectionState !== 'connected' && incomingCallRef.current) {
              cleanupCall();
            }
          }, 30000);
        }
      }

      // Si somos la persona que llama y recibimos la respuesta del receptor
      if (data.answer && isCallingRef.current && peerConnection.current) {
        if (peerConnection.current.signalingState === 'have-local-offer') {
          try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            await flushIceCandidates();
            clearCallTimeout();
            setInCall(true);
            setIsCalling(false);
          } catch (err) {
            console.warn('[WebRTC] Error al aplicar la descripción remota de respuesta:', err);
          }
        }
      }

      // Si la llamada finalizó
      if (data.status === 'ended') {
        cleanupCall();
      }
    });

    // Subcolección de candidatos ICE
    const candidatesColRef = collection(db, 'chats', chatId, 'signal', 'callData', 'candidates');
    const unsubCandidates = onSnapshot(candidatesColRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          if (candidateData.senderId !== userId) {
            if (peerConnection.current && peerConnection.current.remoteDescription) {
              try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
              } catch (e) {
                console.warn('[WebRTC] Error al procesar candidato ICE:', e);
              }
            } else {
              iceCandidatesQueue.current.push(candidateData.candidate);
            }
          }
        }
      });
    });

    // Limpieza automática si se cierra la ventana o pestaña
    const handleBeforeUnload = () => {
      cleanupCall();
      deleteDoc(signalDocRef).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubSignal();
      unsubCandidates();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupCall();
    };
  }, [chatId, userId, cleanupCall, clearCallTimeout]);

  // Instanciar PeerConnection
  const createPeerConnection = useCallback((config: RTCConfiguration) => {
    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = async (event) => {
      if (event.candidate && chatId) {
        const candidatesColRef = collection(db, 'chats', chatId, 'signal', 'callData', 'candidates');
        await addDoc(candidatesColRef, {
          candidate: event.candidate.toJSON(),
          senderId: userId,
          timestamp: serverTimestamp()
        }).catch(() => {});
      }
    };

    pc.ontrack = (event) => {
      console.log('[useVoiceCall] Track received:', event.track.kind);
      if (event.track) {
        event.track.enabled = true;
      }
      
      let audioEl = remoteAudioRef.current;
      if (!audioEl) {
        audioEl = document.getElementById('global-webrtc-remote-audio') as HTMLAudioElement;
      }
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = 'global-webrtc-remote-audio';
        audioEl.style.position = 'fixed';
        audioEl.style.left = '-9999px';
        audioEl.style.top = '-9999px';
        audioEl.style.width = '1px';
        audioEl.style.height = '1px';
        audioEl.style.opacity = '0.01';
        audioEl.style.pointerEvents = 'none';
        document.body.appendChild(audioEl);
        remoteAudioRef.current = audioEl;
      }

      if (audioEl) {
        audioEl.autoplay = true;
        audioEl.muted = false;
        audioEl.volume = 1.0;
        audioEl.setAttribute('playsinline', 'true');

        const streamToBind = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
        
        streamToBind.getAudioTracks().forEach(t => {
          t.enabled = true;
        });

        audioEl.srcObject = null;
        audioEl.srcObject = streamToBind;

        const playAudio = () => {
          if (audioEl) {
            audioEl.play().catch(e => console.warn('[useVoiceCall] Autoplay warning:', e));
          }
        };

        if (event.track) {
          event.track.onunmute = () => {
            playAudio();
          };
        }

        playAudio();
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        clearCallTimeout();
        setInCall(true);
        setIsCalling(false);
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [chatId, userId, clearCallTimeout]);

  // Iniciar llamada (Offer)
  const startCall = async () => {
    if (!chatId || !userId) return;

    try {
      setCallError(null);
      setIsCalling(true);
      const signalDocRef = doc(db, 'chats', chatId, 'signal', 'callData');
      
      const dynamicConfig = await getDynamicRTCConfiguration();
      const pc = createPeerConnection(dynamicConfig);

      if (canEmitAudio) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStream.current = stream;
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
        } catch (mediaErr: any) {
          console.warn('[useVoiceCall] getUserMedia failed, using silent stream fallback:', mediaErr);
          const silentStream = createSilentAudioStream();
          localStream.current = silentStream;
          silentStream.getTracks().forEach(track => pc.addTrack(track, silentStream));
          setIsMuted(true);
          setCallError('Modo Solo Escucha: Permiso de micrófono no otorgado o no disponible. Puedes escuchar la llamada.');
        }
      }

      const offer = await pc.createOffer();
      const optimizedSdp = setAudioBitrate(offer.sdp || '', 32);
      const offerDescription = { type: offer.type, sdp: optimizedSdp };
      await pc.setLocalDescription(offerDescription);

      await setDoc(signalDocRef, {
        callerId: userId,
        callerName: userName,
        status: 'calling',
        offer: offerDescription,
        createdAt: serverTimestamp(),
        answer: deleteField()
      }, { merge: true });

      const voiceRoomRef = doc(db, 'voiceRooms', chatId);
      await setDoc(voiceRoomRef, {
        courseId: chatId,
        active: true,
        participants: [{ id: userId, name: userName, role: userRole, joinedAt: new Date().toISOString() }],
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});

      // Timeout de 30 segundos si el otro usuario no contesta
      clearCallTimeout();
      callTimeoutRef.current = setTimeout(() => {
        if (peerConnection.current && peerConnection.current.connectionState !== 'connected') {
          endCall();
        }
      }, 30000);

    } catch (err: any) {
      console.error('Error al iniciar llamada WebRTC:', err);
      setCallError(err.message || 'No se pudo iniciar la llamada.');
      cleanupCall();
    }
  };

  // Aceptar llamada entrante
  const acceptCall = async () => {
    if (!chatId || !userId || !pendingOfferRef.current) return;

    try {
      setCallError(null);
      setIncomingCall(false);
      setInCall(true);
      clearCallTimeout();

      const signalDocRef = doc(db, 'chats', chatId, 'signal', 'callData');
      
      const dynamicConfig = await getDynamicRTCConfiguration();
      const pc = createPeerConnection(dynamicConfig);

      if (canEmitAudio) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStream.current = stream;
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
        } catch (mediaErr: any) {
          console.warn('[useVoiceCall] getUserMedia failed on acceptCall, using silent stream fallback:', mediaErr);
          const silentStream = createSilentAudioStream();
          localStream.current = silentStream;
          silentStream.getTracks().forEach(track => pc.addTrack(track, silentStream));
          setIsMuted(true);
          setCallError('Modo Solo Escucha: Permiso de micrófono no otorgado o no disponible. Puedes escuchar la llamada.');
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      await flushIceCandidates();

      const answer = await pc.createAnswer();
      const optimizedSdp = setAudioBitrate(answer.sdp || '', 32);
      const answerDescription = { type: answer.type, sdp: optimizedSdp };
      await pc.setLocalDescription(answerDescription);

      await updateDoc(signalDocRef, {
        answer: answerDescription,
        status: 'connected',
        receiverId: userId
      });

      const voiceRoomRef = doc(db, 'voiceRooms', chatId);
      await setDoc(voiceRoomRef, {
        active: true,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});

    } catch (err: any) {
      console.error('Error al responder la llamada WebRTC:', err);
      setCallError(err.message || 'Error al conectar la llamada de voz.');
      cleanupCall();
    }
  };

  // Finalizar llamada
  const endCall = async () => {
    if (chatId) {
      try {
        const signalDocRef = doc(db, 'chats', chatId, 'signal', 'callData');
        await deleteDoc(signalDocRef).catch(() => {});
        const voiceRoomRef = doc(db, 'voiceRooms', chatId);
        await setDoc(voiceRoomRef, {
          active: false,
          participants: [],
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (err) {
        console.warn('Error al limpiar documento de señalización:', err);
      }
    }
    cleanupCall();
  };

  // Alternar silencio del micrófono
  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Reintentar/Activar acceso al micrófono dinámicamente
  const enableMicrophone = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const newTrack = stream.getAudioTracks()[0];
      if (!newTrack || !peerConnection.current) return false;

      newTrack.enabled = true;

      const senders = peerConnection.current.getSenders();
      const audioSender = senders.find(s => s.track && s.track.kind === 'audio') || senders.find(s => !s.track);

      if (audioSender) {
        await audioSender.replaceTrack(newTrack);
      } else {
        peerConnection.current.addTrack(newTrack, stream);
      }

      if (localStream.current) {
        localStream.current.getAudioTracks().forEach(t => t.stop());
      }
      localStream.current = stream;
      setIsMuted(false);
      setCallError(null);
      return true;
    } catch (err: any) {
      console.warn('[useVoiceCall] Could not enable microphone:', err);
      setCallError('No se pudo habilitar el micrófono. Revisa los permisos de tu navegador.');
      return false;
    }
  };

  return {
    inCall,
    isCalling,
    incomingCall,
    callerName,
    isMuted,
    canEmitAudio,
    callError,
    remoteAudioRef,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    enableMicrophone
  };
}
