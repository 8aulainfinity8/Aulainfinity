import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    Play,
    Pause,
    Clock,
    X,
    RotateCcw,
    Volume2,
    VolumeX,
    Trash2,
    PenTool,
    FileText,
    Download,
    ChevronRight,
    Activity,
    Video,
    Volume1,
    Upload
} from 'lucide-react';
import { db } from '../services/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    deleteDoc,
    doc,
    orderBy
} from 'firebase/firestore';
import { AuthContext } from '../contexts/AuthContext';
import { ClassRecording, RecordingFrame } from '../types';

interface ClassReplayModalProps {
    courseId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ClassReplayModal: React.FC<ClassReplayModalProps> = ({ courseId, isOpen, onClose }) => {
    const { user } = useContext(AuthContext);
    const [recordings, setRecordings] = useState<ClassRecording[]>([]);
    const [currentRecording, setCurrentRecording] = useState<ClassRecording | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTimeMs, setCurrentTimeMs] = useState(0);
    const [durationMs, setDurationMs] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
    const [volume, setVolume] = useState<number>(1.0);

    // Active frame render state
    const [currentFrame, setCurrentFrame] = useState<RecordingFrame | null>(null);

    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

    // Refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(0);

    // 1. Fetch available recordings
    useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);
        const q = query(
            collection(db, 'classRecordings'),
            where('courseId', '==', courseId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: ClassRecording[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    courseId: data.courseId,
                    title: data.title || 'Clase grabada',
                    createdAt: data.createdAt,
                    durationMs: data.durationMs || 0,
                    recordedBy: data.recordedBy || 'Profesor',
                    frames: data.frames || [],
                    audioUrl: data.audioUrl || ''
                });
            });
            setRecordings(list);
            setIsLoading(false);
        }, (error) => {
            console.error('Error fetching replays:', error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [courseId, isOpen]);

    // Handle Active Replay Load
    useEffect(() => {
        if (currentRecording) {
            setDurationMs(currentRecording.durationMs);
            setCurrentTimeMs(0);
            setIsPlaying(false);

            if (currentRecording.frames.length > 0) {
                setCurrentFrame(currentRecording.frames[0]);
            } else {
                setCurrentFrame({ offsetMs: 0, strokes: [], boardDocs: [] });
            }
        } else {
            setCurrentFrame(null);
            setIsPlaying(false);
            if (timerRef.current) {
                cancelAnimationFrame(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [currentRecording]);

    // Update Frame based on current currentTimeMs
    useEffect(() => {
        if (!currentRecording || currentRecording.frames.length === 0) return;

        // Find the absolute closest frame that happened before or equal to currentTimeMs
        const matchedFrame = currentRecording.frames
            .filter(frame => frame.offsetMs <= currentTimeMs)
            .reduce((latest, current) => {
                return current.offsetMs > latest.offsetMs ? current : latest;
            }, currentRecording.frames[0]);

        if (matchedFrame) {
            setCurrentFrame(matchedFrame);
        }
    }, [currentTimeMs, currentRecording]);

    // Trigger Audio Playback Rate Adjustment
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed, isPlaying]);

    // Volume adjustment
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    // Audio timeline alignment
    const handleAudioTimeUpdate = () => {
        if (audioRef.current && isPlaying) {
            setCurrentTimeMs(audioRef.current.currentTime * 1000);
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
        setCurrentTimeMs(durationMs);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    // Simulated Timer loop (for cases with no audio or as visual scheduler)
    const runSimulationLoop = (timestamp: number) => {
        if (!isPlaying || !currentRecording) return;

        if (!lastTickRef.current) lastTickRef.current = timestamp;
        const delta = (timestamp - lastTickRef.current) * playbackSpeed;
        lastTickRef.current = timestamp;

        setCurrentTimeMs((prev) => {
            const next = prev + delta;
            if (next >= durationMs) {
                setIsPlaying(false);
                return durationMs;
            }
            return next;
        });

        timerRef.current = requestAnimationFrame(runSimulationLoop);
    };

    // Playback control togglers
    const handleTogglePlay = () => {
        if (!currentRecording) return;

        const nextPlaying = !isPlaying;
        setIsPlaying(nextPlaying);

        if (nextPlaying) {
            if (currentTimeMs >= durationMs - 50) {
                setCurrentTimeMs(0);
                if (audioRef.current) audioRef.current.currentTime = 0;
            }

            if (currentRecording.audioUrl && audioRef.current) {
                audioRef.current.play().catch(e => console.warn('Audio play pending: ', e));
            } else {
                lastTickRef.current = 0;
                timerRef.current = requestAnimationFrame(runSimulationLoop);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (timerRef.current) {
                cancelAnimationFrame(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const handleSeek = (newTimeMs: number) => {
        setCurrentTimeMs(newTimeMs);
        if (audioRef.current) {
            audioRef.current.currentTime = newTimeMs / 1000;
        }
    };

    const handleSkip = (seconds: number) => {
        const deltaMs = seconds * 1000;
        let nextTimeMs = currentTimeMs + deltaMs;
        if (nextTimeMs < 0) nextTimeMs = 0;
        if (nextTimeMs > durationMs) nextTimeMs = durationMs;

        handleSeek(nextTimeMs);
    };

    const handleDeleteRecording = async (recId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmDelete = window.confirm('¿Seguro que quieres eliminar esta grabación permanentemente?');
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, 'classRecordings', recId));
            if (currentRecording?.id === recId) {
                setCurrentRecording(null);
            }
        } catch (err) {
            console.error('Error deleting class recording:', err);
        }
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const exportToVideoLocal = () => {
        if (!currentRecording) return;
        // Allows direct download of recordings dataset as fallback
        const fileContent = JSON.stringify(currentRecording, null, 2);
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Grabacion_Pizarra_${currentRecording.title.replace(/\s+/g, '_')}.aula`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleLocalFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const parsed = JSON.parse(text);
                
                // Validate that it has frames
                if (!parsed || !Array.isArray(parsed.frames)) {
                    alert('El archivo no parece ser un archivo de grabación de AulaInfinity válido (.aula)');
                    return;
                }
                
                setCurrentRecording({
                    id: parsed.id || `local_${Date.now()}`,
                    courseId: parsed.courseId || courseId,
                    title: parsed.title || file.name.replace('.aula', ''),
                    createdAt: parsed.createdAt || new Date().toISOString(),
                    durationMs: parsed.durationMs || 0,
                    recordedBy: parsed.recordedBy || 'Local',
                    frames: parsed.frames,
                    audioUrl: parsed.audioUrl || ''
                });
            } catch (err) {
                console.error('Error parsing local recording file:', err);
                alert('Error al leer el archivo. Asegúrate de que es un archivo .aula correcto.');
            }
        };
        reader.readAsText(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-205 dark:border-slate-700/80 w-full max-w-5xl h-[88vh] md:h-[82vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700/80 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <Video className="w-4.5 h-4.5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                                {currentRecording ? `Reproduciendo: ${currentRecording.title}` : 'Grabaciones y Repeticiones de Clase'}
                            </h3>
                            <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                                {currentRecording 
                                    ? `Grabado por ${currentRecording.recordedBy} el ${new Date(currentRecording.createdAt).toLocaleDateString()}` 
                                    : 'Accede a la pizarra animada y a la explicación de audio grabada en tiempo real.'
                                }
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (audioRef.current) {
                                audioRef.current.pause();
                            }
                            onClose();
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Main panel - Split list vs player */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
                    {!currentRecording ? (
                        /* RECORDINGS DIRECTORY LIST */
                        <div className="flex-1 flex flex-col overflow-y-auto p-6">
                            {/* Local File Uploader area */}
                            <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center text-center select-none">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">Cargar clase local (.aula)</h4>
                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm font-semibold">
                                    Si guardaste previamente la repetición de una sesión en tu dispositivo, súbela aquí para reproducirla en tiempo real.
                                </p>
                                <input
                                    type="file"
                                    accept=".aula,application/json"
                                    onChange={handleLocalFileImport}
                                    className="hidden"
                                    id="local-aula-file-upload"
                                />
                                <label
                                    htmlFor="local-aula-file-upload"
                                    className="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-sm transition-all hover:scale-102 active:scale-98"
                                >
                                    Seleccionar archivo .aula
                                </label>
                            </div>

                            {isLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16">
                                    <div className="w-8 h-8 border-4 border-indigo-550 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs text-slate-500 font-bold">Cargando repeticiones disponibles...</span>
                                </div>
                            ) : recordings.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
                                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                                        <Clock className="w-7 h-7" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No hay repeticiones disponibles en la nube</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-450 mt-1.5">
                                        Las grabaciones de la pizarra digital y explicaciones de audio que realice el profesor durante la tutoría en directo aparecerán aquí.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-450 mb-1">Clases grabadas en la nube</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {recordings.map((rec) => (
                                            <div 
                                                key={rec.id}
                                                onClick={() => setCurrentRecording(rec)}
                                                className="group relative flex items-center justify-between p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-850 hover:shadow-md cursor-pointer rounded-xl transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 pr-8">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                                        <Video className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="text-xs font-black text-slate-850 dark:text-slate-105 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={rec.title}>
                                                            {rec.title}
                                                        </h5>
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 font-semibold">
                                                            <span className="flex items-center gap-0.5 whitespace-nowrap bg-slate-55 bg-slate-100 dark:bg-slate-800 py-0.5 px-1.5 rounded">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTime(rec.durationMs)}
                                                            </span>
                                                            <span className="truncate" title={`Por ${rec.recordedBy}`}>Por {rec.recordedBy}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isTeacher && (
                                                        <button
                                                            onClick={(e) => handleDeleteRecording(rec.id, e)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                                            title="Eliminar grabación"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* REPLAYER WORKSPACE */
                        <div className="flex-1 flex flex-col min-h-0 bg-slate-100 dark:bg-slate-900">
                            
                            {/* Player Viewport (Whiteboard state visualizer) */}
                            <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-905 flex items-center justify-center p-2 select-none border-b dark:border-slate-800">
                                <div 
                                    className="w-full h-full relative aspect-video bg-white dark:bg-slate-800 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700/60 overflow-hidden"
                                    id="replay-whiteboard-canvas"
                                >
                                    {/* Grid background */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

                                    {/* Documents Layer */}
                                    <div className="absolute inset-0 z-10 pointer-events-none">
                                        {currentFrame?.boardDocs.map((item) => (
                                            <div
                                                key={item.id}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${item.x}px`,
                                                    top: `${item.y}px`,
                                                    width: `${item.width}px`,
                                                    height: `${item.height}px`,
                                                }}
                                                className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg shadow-md overflow-hidden flex flex-col"
                                            >
                                                {/* Header Panel mockup */}
                                                <div className="h-5 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 flex items-center px-1.5 flex-shrink-0 gap-1 font-mono text-[9px] text-slate-500">
                                                    <FileText className="w-3 h-3 flex-shrink-0 text-slate-400" />
                                                    <span className="truncate pr-1" title={item.name}>{item.name}</span>
                                                </div>

                                                {/* Document Render */}
                                                <div className="flex-1 relative overflow-hidden bg-slate-50 flex items-center justify-center p-1">
                                                    <img
                                                        src={item.url}
                                                        alt={item.name}
                                                        referrerPolicy="no-referrer"
                                                        className="max-w-full max-h-full object-contain rounded select-none pointer-events-none"
                                                        draggable={false}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Strokes Render Layer (SVG) */}
                                    <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                                        {currentFrame?.strokes.map((stroke) => {
                                            if (stroke.points.length < 2) return null;
                                            const pathDefinition = stroke.points.reduce(
                                                (acc, point, index) =>
                                                    index === 0
                                                        ? `M ${point.x} ${point.y}`
                                                        : `${acc} L ${point.x} ${point.y}`,
                                                ''
                                            );
                                            return (
                                                <path
                                                    key={stroke.id}
                                                    d={pathDefinition}
                                                    fill="none"
                                                    stroke={stroke.color}
                                                    strokeWidth={stroke.size}
                                                    strokeOpacity={stroke.type === 'marker' ? 0.45 : 1}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            );
                                        })}
                                    </svg>
                                </div>

                                {/* Floating Player Info */}
                                <div className="absolute top-4 left-4 bg-slate-900/80 text-white text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 backdrop-blur-md shadow-lg select-none uppercase z-30 animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                    <span>Grabación del profesor</span>
                                </div>
                            </div>

                            {/* Audio component placeholder */}
                            {currentRecording.audioUrl && (
                                <audio
                                    ref={audioRef}
                                    src={currentRecording.audioUrl}
                                    onTimeUpdate={handleAudioTimeUpdate}
                                    onEnded={handleAudioEnded}
                                    onError={(e) => console.error("Audio Load Error:", e)}
                                />
                            )}

                            {/* Player Command Control Bar */}
                            <div className="bg-white dark:bg-slate-800 border-t dark:border-slate-700/80 p-4 space-y-3.5 flex-shrink-0 z-30">
                                
                                {/* Progress slider and time tracker */}
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold select-none min-w-[36px]">
                                        {formatTime(currentTimeMs)}
                                    </span>
                                    
                                    <input 
                                        type="range"
                                        min={0}
                                        max={durationMs}
                                        value={currentTimeMs}
                                        onChange={(e) => handleSeek(Number(e.target.value))}
                                        className="flex-1 accent-indigo-600 dark:accent-indigo-500 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg cursor-pointer outline-none select-none"
                                    />
                                    
                                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 font-bold select-none min-w-[36px]">
                                        {formatTime(durationMs)}
                                    </span>
                                </div>

                                {/* Action Buttons Panel */}
                                <div className="flex flex-wrap items-center justify-between gap-3.5">
                                    {/* Media buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSkip(-10)}
                                            className="p-1 px-[7px] text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-extrabold flex items-center gap-0.5 border dark:border-slate-700 cursor-pointer shadow-xs select-none"
                                            title="Retroceder 10 segundos"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>-10s</span>
                                        </button>

                                        <button
                                            onClick={handleTogglePlay}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all shadow-md select-none cursor-pointer ${
                                                isPlaying 
                                                ? 'bg-rose-500 hover:bg-rose-600 animate-pulse' 
                                                : 'bg-indigo-600 hover:bg-indigo-700'
                                            }`}
                                        >
                                            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.2" />}
                                        </button>

                                        <button
                                            onClick={() => handleSkip(10)}
                                            className="p-1 px-[7px] text-slate-605 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-extrabold flex items-center gap-0.5 border dark:border-slate-700 cursor-pointer shadow-xs select-none"
                                            title="Avanzar 10 segundos"
                                        >
                                            <span className="rotate-180 transform flex"><RotateCcw className="w-3.5 h-3.5" /></span>
                                            <span>+10s</span>
                                        </button>
                                    </div>

                                    {/* Volume slider */}
                                    {currentRecording.audioUrl && (
                                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-750 px-2.5 py-1 rounded-xl">
                                            <button
                                                onClick={() => setIsMuted(prev => !prev)}
                                                className="text-slate-500 hover:text-slate-750 dark:hover:text-amber-100 transition-colors cursor-pointer"
                                            >
                                                {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
                                            </button>
                                            <input 
                                                type="range"
                                                min={0}
                                                max={1}
                                                step={0.05}
                                                value={isMuted ? 0 : volume}
                                                onChange={(e) => {
                                                    setVolume(Number(e.target.value));
                                                    setIsMuted(false);
                                                }}
                                                className="w-16 accent-indigo-550 dark:accent-indigo-400 bg-slate-200 dark:bg-slate-700 h-1 rounded-lg cursor-pointer outline-none"
                                            />
                                        </div>
                                    )}

                                    {/* Speed adjustments */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 select-none mr-2">Velocidad:</span>
                                        {[1.0, 1.5, 2.0].map((speed) => (
                                            <button
                                                key={speed}
                                                onClick={() => setPlaybackSpeed(speed)}
                                                className={`px-2 py-1 rounded text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                                                    playbackSpeed === speed
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-750 dark:text-slate-300 hover:bg-slate-200'
                                                }`}
                                            >
                                                {speed.toFixed(1)}x
                                            </button>
                                        ))}
                                    </div>

                                    {/* Utility actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={exportToVideoLocal}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                            title="Exportar archivo de pizarra local"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>Exportar</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (audioRef.current) {
                                                    audioRef.current.pause();
                                                }
                                                setCurrentRecording(null);
                                            }}
                                            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 hover:bg-amber-100 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Volver</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
