import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import {
    PenTool,
    Highlighter,
    Eraser,
    Trash2,
    Edit,
    Type,
    Image as ImageIcon,
    Maximize2,
    Minimize2,
    Move,
    Check,
    X,
    FileText,
    Activity,
    Lock,
    Unlock,
    Pin,
    Eye,
    EyeOff,
    HelpCircle,
    Download,
    Trash,
    Grid,
    Settings,
    GripVertical,
    Sliders,
    Sun,
    Moon,
    Undo,
    Redo,
    Square,
    Circle,
    Minus,
    ArrowUpRight,
    Target
} from 'lucide-react';
import { db, storage } from '../services/firebase';
import {
    doc,
    setDoc,
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { AuthContext } from '../contexts/AuthContext';
import { HelpModal } from './HelpModal';
import { ThemeContext } from '../contexts/ThemeContext';
import { usePinchZoom } from '../hooks/usePinchZoom';

// Stroke or lines representing handwritten text/graphics
interface Stroke {
    id: string;
    points: { x: number; y: number; p?: number }[];
    color: string;
    size: number;
    type: 'pencil' | 'marker' | 'eraser' | 'select' | 'pen' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow';
    textContent?: string;
}

const getStrokePathDefinition = (points: { x: number; y: number; p?: number }[], type: string, strokeSize: number = 2) => {
    if (!points || points.length < 2) return '';
    const p0 = points[0];
    const p1 = points[points.length - 1];

    if (type === 'rectangle') {
        return `M ${p0.x} ${p0.y} L ${p1.x} ${p0.y} L ${p1.x} ${p1.y} L ${p0.x} ${p1.y} Z`;
    } else if (type === 'circle') {
        const cx = (p0.x + p1.x) / 2;
        const cy = (p0.y + p1.y) / 2;
        const rx = Math.abs(p1.x - p0.x) / 2;
        const ry = Math.abs(p1.y - p0.y) / 2;
        return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
    } else if (type === 'line') {
        return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`;
    } else if (type === 'arrow') {
        const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const arrowLength = Math.max(10, strokeSize * 2.5 + 6);
        const x1 = p1.x - arrowLength * Math.cos(angle - Math.PI / 6);
        const y1 = p1.y - arrowLength * Math.sin(angle - Math.PI / 6);
        const x2 = p1.x - arrowLength * Math.cos(angle + Math.PI / 6);
        const y2 = p1.y - arrowLength * Math.sin(angle + Math.PI / 6);
        return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} M ${x1} ${y1} L ${p1.x} ${p1.y} L ${x2} ${y2}`;
    }

    // Default freehand drawing
    return points.reduce(
        (acc, point, index) =>
            index === 0
                ? `M ${point.x} ${point.y}`
                : `${acc} L ${point.x} ${point.y}`,
        ''
    );
};

// Embedded documents or diagrams placed on top of Jamboard
interface WhiteboardDoc {
    id: string;
    name: string;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
}

interface WhiteboardProps {
    courseId: string;
    isTeacher?: boolean;
    onClose?: () => void;
}

// Persistent module-level history memory caches to prevent history loss on component remount or toggling the whiteboard view
const globalUndoStacks: { [courseId: string]: any[] } = {};
const globalRedoStacks: { [courseId: string]: any[] } = {};

export const Whiteboard: React.FC<WhiteboardProps> = ({ courseId, isTeacher: isTeacherProp = false, onClose }) => {
    const { user } = useContext(AuthContext);
    const isTeacher = isTeacherProp || (user as any)?.role === 'teacher' || (user as any)?.role === 'admin';
    const { theme, toggleTheme } = useContext(ThemeContext);
    const isDark = theme === 'dark';

    // Local configuration for grid/line pattern visual intensity
    const [gridOpacity, setGridOpacity] = useState<number>(() => {
        const saved = localStorage.getItem('whiteboard_grid_opacity');
        return saved ? parseFloat(saved) : 0.35;
    });

    const [gridStrokeWidth, setGridStrokeWidth] = useState<number>(() => {
        const saved = localStorage.getItem('whiteboard_grid_stroke_width');
        return saved ? parseFloat(saved) : 0.5;
    });

    const [gridColor, setGridColor] = useState<string>(() => {
        return localStorage.getItem('whiteboard_grid_color') || 'default';
    });

    const [boardColorTheme, setBoardColorTheme] = useState<string>(() => {
        return localStorage.getItem('whiteboard_board_color_theme') || 'default';
    });

    const [showGridSettings, setShowGridSettings] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [confirmCloseBoardModalOpen, setConfirmCloseBoardModalOpen] = useState(false);
    const [showToolbar, setShowToolbar] = useState<boolean>(() => {
        return localStorage.getItem('whiteboard_show_toolbar') !== 'false';
    });
    const [showFloatingMenu, setShowFloatingMenu] = useState<boolean>(() => {
        return localStorage.getItem('whiteboard_show_floating_menu') !== 'false';
    });

    const toggleToolbar = () => {
        setShowToolbar(prev => {
            const next = !prev;
            localStorage.setItem('whiteboard_show_toolbar', String(next));
            return next;
        });
    };

    const toggleFloatingMenu = () => {
        setShowFloatingMenu(prev => {
            const next = !prev;
            localStorage.setItem('whiteboard_show_floating_menu', String(next));
            return next;
        });
    };

    useEffect(() => {
        localStorage.setItem('whiteboard_grid_opacity', gridOpacity.toString());
    }, [gridOpacity]);

    useEffect(() => {
        localStorage.setItem('whiteboard_grid_stroke_width', gridStrokeWidth.toString());
    }, [gridStrokeWidth]);

    useEffect(() => {
        localStorage.setItem('whiteboard_grid_color', gridColor);
    }, [gridColor]);

    useEffect(() => {
        localStorage.setItem('whiteboard_board_color_theme', boardColorTheme);
    }, [boardColorTheme]);

    // Helpers to resolve styling colors dynamically based on board choices
    const getBoardBgStyle = () => {
        if (boardColorTheme === 'cream') {
            return isDark ? 'bg-[#1a1712]' : 'bg-[#fbfaf5]';
        }
        if (boardColorTheme === 'chalkboard') {
            return 'bg-[#0f241a]';
        }
        if (boardColorTheme === 'blueprint') {
            return 'bg-[#07152e]';
        }
        if (boardColorTheme === 'charcoal') {
            return 'bg-[#0f1115]';
        }
        return 'bg-[#fafafd] dark:bg-[#161a24]'; // default
    };

    const getGridStrokeColor = () => {
        if (gridColor && gridColor !== 'default') {
            return gridColor;
        }
        if (boardColorTheme === 'cream') {
            return isDark ? '#b45309' : '#d97706'; // warm amber/brown
        }
        if (boardColorTheme === 'chalkboard') {
            return '#a7f3d0'; // chalky mint green
        }
        if (boardColorTheme === 'blueprint') {
            return '#38bdf8'; // technical sky cyan
        }
        if (boardColorTheme === 'charcoal') {
            return '#4f5e75'; // soft charcoal blue/gray
        }
        return isDark ? '#ffffff' : '#000000';
    };
    
    // Tools settings
    const [tool, setTool] = useState<'pencil' | 'marker' | 'eraser' | 'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow'>('pencil');
    const [color, setColor] = useState('#4f46e5'); // indigo-600
    const [size, setSize] = useState(2); // Finer default (2px)
    
    // Zoom and pan states for custom viewing controls
    const [zoom, setZoom] = useState<number>(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const zoomRef = useRef(zoom);
    const panRef = useRef(pan);

    useEffect(() => {
        zoomRef.current = zoom;
        panRef.current = pan;
    }, [zoom, pan]);

    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isCanvasMovementLocked, setIsCanvasMovementLocked] = useState<boolean>(() => {
        return localStorage.getItem('whiteboard_canvas_movement_locked') === 'true';
    });

    const toggleCanvasMovementLock = () => {
        setIsCanvasMovementLocked(prev => {
            const next = !prev;
            localStorage.setItem('whiteboard_canvas_movement_locked', String(next));
            return next;
        });
    };
    
    // Text input state
    const [isAddingText, setIsAddingText] = useState(false);
    const isAddingTextRef = useRef(false);
    const updateIsAddingText = (val: boolean) => {
        setIsAddingText(val);
        isAddingTextRef.current = val;
    };
    const [textInput, setTextInput] = useState('');
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [editingTextValue, setEditingTextValue] = useState<string>('');
    
    // Floating format toolbar states
    const [formatToolbarPos, setFormatToolbarPos] = useState<{ x: number; y: number }>(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return { x: 10, y: 50 };
        }
        return { x: 80, y: 20 };
    });
    const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
    const [toolbarDragStart, setToolbarDragStart] = useState({ x: 0, y: 0 });
    
    // Board Active states
    const [isActive, setIsActive] = useState(false);
    const [boardSize, setBoardSize] = useState<'compact' | 'normal' | 'expanded'>('normal');
    const [bgPattern, setBgPattern] = useState<string>(() => {
        return localStorage.getItem('whiteboard_bg_pattern') || 'grid';
    });

    // Stylus / Pen enhancement states
    const [isPressureSensitive, setIsPressureSensitive] = useState<boolean>(() => {
        return localStorage.getItem('whiteboard_pressure_sensitive') !== 'false';
    });
    const [stabilizerStrength, setStabilizerStrength] = useState<number>(() => {
        const val = localStorage.getItem('whiteboard_stabilizer_strength');
        return val ? parseInt(val, 10) : 2; // Default 2 out of 5
    });
    const [isPenOnlyDrawing, setIsPenOnlyDrawing] = useState<boolean>(() => {
        return localStorage.getItem('whiteboard_pen_only_drawing') === 'true';
    });
    const [isPenDetected, setIsPenDetected] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const toastTimeoutRef = useRef<any>(null);
    const isPinchingRef = useRef<boolean>(false);

    // Set body class so navigation components like MobileBottomNav know a whiteboard is active
    useEffect(() => {
        document.body.classList.add('whiteboard-active');
        return () => {
            document.body.classList.remove('whiteboard-active');
        };
    }, []);

    const showToast = (message: string) => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToastMessage(message);
        toastTimeoutRef.current = setTimeout(() => {
            setToastMessage(null);
            toastTimeoutRef.current = null;
        }, 5500);
    };

    const togglePressureSensitive = () => {
        setIsPressureSensitive(prev => {
            const next = !prev;
            localStorage.setItem('whiteboard_pressure_sensitive', String(next));
            showToast(next ? "📈 Sensibilidad a la Presión activada. El grosor del trazo varía según la fuerza aplicada." : "📉 Sensibilidad a la Presión desactivada. El trazo tendrá un grosor uniforme.");
            return next;
        });
    };

    const updateStabilizerStrength = (val: number) => {
        setStabilizerStrength(val);
        localStorage.setItem('whiteboard_stabilizer_strength', String(val));
        showToast(val === 0 ? "⚡ Estabilizador desactivado. Trazo libre y directo." : `🎯 Estabilizador configurado al Nivel ${val}. Trazo suavizado para mayor precisión.`);
    };

    const togglePenOnlyDrawing = () => {
        setIsPenOnlyDrawing(prev => {
            const next = !prev;
            localStorage.setItem('whiteboard_pen_only_drawing', String(next));
            showToast(next ? "🤚 Rechazo de Palma activado. Tus dedos/palma solo desplazarán y harán zoom en el lienzo; el dibujo queda reservado para tu lápiz óptico." : "🤚 Rechazo de Palma desactivado. Puedes dibujar tanto con tus dedos como con tu lápiz óptico.");
            return next;
        });
    };

    // Velocity-based pressure emulation & hover states
    const [isVelocityPressureEmulated, setIsVelocityPressureEmulated] = useState<boolean>(() => {
        return localStorage.getItem('whiteboard_velocity_emulation') !== 'false';
    });
    const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
    const [showHoverCursor, setShowHoverCursor] = useState<boolean>(false);

    const toggleVelocityPressureEmulation = () => {
        setIsVelocityPressureEmulated(prev => {
            const next = !prev;
            localStorage.setItem('whiteboard_velocity_emulation', String(next));
            return next;
        });
    };
    
    const containerHeight = onClose 
        ? 'h-full flex-1 border-0 rounded-none my-0 shadow-none'
        : (isActive 
            ? {
                compact: 'h-[420px] md:h-[480px]',
                normal: 'h-[580px] md:h-[660px]',
                expanded: 'h-[820px] md:h-[950px]',
            }[boardSize]
            : 'h-[200px] md:h-[240px]');

    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [boardDocs, setBoardDocs] = useState<WhiteboardDoc[]>([]);
    
    // Active drawing line state
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number; p?: number }[]>([]);
    
    // Dragging and resizing documents or strokes state
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragType, setActiveDragType] = useState<'doc' | 'stroke' | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0, clientX: 0, clientY: 0 });
    
    // Stroke selection
    const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
    const selectedStroke = useMemo(() => strokes.find(s => s.id === selectedStrokeId), [strokes, selectedStrokeId]);

    // Document/image selection
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const selectedDoc = useMemo(() => boardDocs.find(d => d.id === selectedDocId), [boardDocs, selectedDocId]);
    
    // Stroke/text resizing state variables
    const [activeResizeStrokeId, setActiveResizeStrokeId] = useState<string | null>(null);
    const [activeResizeStrokeCorner, setActiveResizeStrokeCorner] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null>(null);
    const [resizeStrokeStartBox, setResizeStrokeStartBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [resizeStrokeStartMouse, setResizeStrokeStartMouse] = useState<{ x: number, y: number } | null>(null);
    const [resizeStrokeOriginalPoints, setResizeStrokeOriginalPoints] = useState<{ x: number, y: number }[]>([]);
    const [resizeStrokeStartSize, setResizeStrokeStartSize] = useState<number>(12);

    // History and Undo/Redo states
    interface HistoryAction {
        type: 'move' | 'resize' | 'edit_text' | 'add_stroke' | 'delete_stroke' | 'add_doc' | 'delete_doc' | 'clear_board';
        targetType: 'stroke' | 'doc' | 'board';
        targetId: string;
        beforeState: any;
        afterState: any;
    }

    const [undoStack, setUndoStack] = useState<HistoryAction[]>(() => {
        return globalUndoStacks[courseId] || [];
    });
    const [redoStack, setRedoStack] = useState<HistoryAction[]>(() => {
        return globalRedoStacks[courseId] || [];
    });
    const [actionBeforeState, setActionBeforeState] = useState<any>(null);

    useEffect(() => {
        globalUndoStacks[courseId] = undoStack;
    }, [undoStack, courseId]);

    useEffect(() => {
        globalRedoStacks[courseId] = redoStack;
    }, [redoStack, courseId]);

    useEffect(() => {
        setUndoStack(globalUndoStacks[courseId] || []);
        setRedoStack(globalRedoStacks[courseId] || []);
    }, [courseId]);

    const pushToHistory = (action: HistoryAction) => {
        setUndoStack(prev => [...prev, action]);
        setRedoStack([]); // Clear redo stack on new action
    };

    const selectedStrokeBox = useMemo(() => {
        if (!selectedStroke || !selectedStroke.points || selectedStroke.points.length === 0) return null;
        
        if (selectedStroke.type === 'text') {
            const fontSize = selectedStroke.size || 16;
            const lines = selectedStroke.textContent ? selectedStroke.textContent.split('\n') : [''];
            const maxChars = Math.max(...lines.map(line => line.length));
            const estimatedWidth = Math.max(40, maxChars * fontSize * 0.55);
            const estimatedHeight = Math.max(fontSize, lines.length * fontSize * 1.2);
            
            const startX = selectedStroke.points[0].x;
            const startY = selectedStroke.points[0].y;
            const padding = 6;
            
            return {
                x: startX - padding,
                y: startY - padding,
                width: estimatedWidth + padding * 2,
                height: estimatedHeight + padding * 2
            };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        selectedStroke.points.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        });
        const padding = 6;
        return {
            x: minX - padding,
            y: minY - padding,
            width: Math.max(10, (maxX - minX) + padding * 2),
            height: Math.max(10, (maxY - minY) + padding * 2)
        };
    }, [selectedStroke]);

    const [showHelp, setShowHelp] = useState(false);
    
    const [activeResizeId, setActiveResizeId] = useState<string | null>(null);
    const [activeResizeCorner, setActiveResizeCorner] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null>(null);
    const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0, scale: 1 });
    const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
    const [resizeStartPosItem, setResizeStartPosItem] = useState({ x: 0, y: 0 });

    const boardRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const containerRectRef = useRef<DOMRect | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const isSavingTextRef = useRef(false);
    const isDrawingWithStylusRef = useRef<boolean>(false);
    const activePointerIdRef = useRef<number | null>(null);

    usePinchZoom({
        ref: boardRef,
        zoom,
        setZoom,
        pan,
        setPan,
        isLocked: isCanvasMovementLocked,
        isDrawingWithStylusRef,
        isPinchingRef,
    });

    // Ref to hold the latest state values for global event listeners (prevents stale closures and frequent listener re-registration)
    const stateRef = useRef({
        activeDragId,
        activeDragType,
        dragOffset,
        actionBeforeState,
        activeResizeId,
        activeResizeCorner,
        resizeStartPos,
        resizeStartSize,
        resizeStartPosItem,
        activeResizeStrokeId,
        activeResizeStrokeCorner,
        resizeStrokeStartBox,
        resizeStrokeStartMouse,
        resizeStrokeOriginalPoints,
        resizeStrokeStartSize,
        strokes,
        boardDocs,
        zoom,
        isTeacher,
        undoStack,
        redoStack
    });

    // Keep stateRef updated with the absolute latest values on every render
    useEffect(() => {
        stateRef.current = {
            activeDragId,
            activeDragType,
            dragOffset,
            actionBeforeState,
            activeResizeId,
            activeResizeCorner,
            resizeStartPos,
            resizeStartSize,
            resizeStartPosItem,
            activeResizeStrokeId,
            activeResizeStrokeCorner,
            resizeStrokeStartBox,
            resizeStrokeStartMouse,
            resizeStrokeOriginalPoints,
            resizeStrokeStartSize,
            strokes,
            boardDocs,
            zoom,
            isTeacher,
            undoStack,
            redoStack
        };
    });

    // Color swatches for fast action
    const COLORS = ['#1e293b', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
    const BRUSH_SIZES = [2, 5, 8, 12];

    // Real-time cursor state
    const lastCursorWrite = useRef<number>(0);
    const [participantCursors, setParticipantCursors] = useState<Record<string, { id: string; name: string; isTeacher: boolean; x: number; y: number; active: boolean; updatedAt: number }>>({});

    // WebSocket state
    const wsRef = useRef<WebSocket | null>(null);
    const [isWsConnected, setIsWsConnected] = useState(false);

    // Recording features state
    const [isRecording, setIsRecording] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
    const [allowStudentDrawing, setAllowStudentDrawing] = useState<boolean>(false);
    const prevAllowRef = useRef<boolean | null>(null);
    const hasAutoCenteredRef = useRef<boolean>(false);

    // Can current user draw/edit the whiteboard? (Teacher always can, student only if teacher allows)
    const canUserDraw = isTeacher || allowStudentDrawing;

    const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
    const [recordingFrames, setRecordingFrames] = useState<any[]>([]);
    const [isSavingRecording, setIsSavingRecording] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isVisualFullScreen, setIsVisualFullScreen] = useState(true);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const wasFullScreenBeforeUpload = useRef(false);

    useEffect(() => {
        // Ensure visual full screen is active on mount
        setIsVisualFullScreen(true);
        const timer = setTimeout(() => {
            if (!document.fullscreenElement && boardRef.current && boardRef.current.isConnected) {
                const el = boardRef.current as any;
                const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
                if (typeof requestFs === 'function') {
                    requestFs.call(el)
                        .then(() => {
                            setIsVisualFullScreen(true);
                        })
                        .catch(() => {
                            // Silent fallback; isVisualFullScreen portal ensures full screen UI overlay regardless
                        });
                }
            }
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // Prevent body background scroll on mobile/desktop when visual fullscreen is active
    useEffect(() => {
        if (isVisualFullScreen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isVisualFullScreen]);

    // Dynamic ResizeObserver hook for canvas container to automatically adjust internal drawing coordinate system on orientation and size changes
    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;

        let debounceTimer: NodeJS.Timeout | null = null;

        const updateContainerRect = () => {
            if (canvasContainerRef.current) {
                const rect = canvasContainerRef.current.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    containerRectRef.current = rect;
                }
            }
        };

        const handleResize = () => {
            updateContainerRect();
            if (debounceTimer) clearTimeout(debounceTimer);
            // Additional check after layout stabilizes on orientation change
            debounceTimer = setTimeout(() => {
                updateContainerRect();
            }, 100);
        };

        const observer = new ResizeObserver(() => {
            handleResize();
        });

        observer.observe(container);
        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('orientationchange', handleResize, { passive: true });

        updateContainerRect();

        return () => {
            observer.disconnect();
            if (debounceTimer) clearTimeout(debounceTimer);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    useEffect(() => {
        const handleWindowFocus = () => {
            if (wasFullScreenBeforeUpload.current) {
                setTimeout(() => {
                    if (!document.fullscreenElement && boardRef.current && boardRef.current.isConnected) {
                        const el = boardRef.current as any;
                        const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
                        if (typeof requestFs === 'function') {
                            requestFs.call(el)
                                .then(() => {
                                    wasFullScreenBeforeUpload.current = false;
                                    setIsVisualFullScreen(true);
                                })
                                .catch((err: any) => {
                                    console.warn("Could not restore fullscreen on window focus (will retry on next click):", err);
                                });
                        }
                    } else {
                        wasFullScreenBeforeUpload.current = false;
                        setIsVisualFullScreen(true);
                    }
                }, 400);
            }
        };

        const handleUserGesture = () => {
            if (wasFullScreenBeforeUpload.current && !document.fullscreenElement && boardRef.current && boardRef.current.isConnected) {
                const el = boardRef.current as any;
                const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
                if (typeof requestFs === 'function') {
                    requestFs.call(el)
                        .then(() => {
                            wasFullScreenBeforeUpload.current = false;
                            setIsVisualFullScreen(true);
                        })
                        .catch((err: any) => {
                            console.warn("Could not restore fullscreen on capturing user gesture:", err);
                        });
                }
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('mousedown', handleUserGesture, { capture: true });
        window.addEventListener('touchstart', handleUserGesture, { capture: true });
        window.addEventListener('keydown', handleUserGesture, { capture: true });

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
            window.removeEventListener('mousedown', handleUserGesture, { capture: true });
            window.removeEventListener('touchstart', handleUserGesture, { capture: true });
            window.removeEventListener('keydown', handleUserGesture, { capture: true });
        };
    }, []);

    useEffect(() => {
        if (isAddingText) {
            const timer = setTimeout(() => {
                textInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isAddingText]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const active = !!document.fullscreenElement;
            setIsFullScreen(active);
            if (active) {
                setIsVisualFullScreen(true);
                wasFullScreenBeforeUpload.current = false;
            } else {
                if (wasFullScreenBeforeUpload.current) {
                    // Keeping isVisualFullScreen true because a file picker caused a temporary exit
                } else if (window.innerWidth < 768) {
                    // On mobile, keep visual full-screen mode active so board occupies entire mobile viewport
                } else {
                    setIsVisualFullScreen(false);
                }
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!isVisualFullScreen) {
            setIsVisualFullScreen(true);
            setTimeout(() => {
                if (boardRef.current && boardRef.current.isConnected) {
                    const el = boardRef.current as any;
                    const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
                    if (typeof requestFs === 'function') {
                        requestFs.call(el).catch((err: any) => {
                            console.warn(`Could not enable full-screen mode: ${err?.message}`);
                        });
                    }
                }
            }, 50);
        } else {
            setIsVisualFullScreen(false);
            wasFullScreenBeforeUpload.current = false;
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        }
    };

    // Current participant identifiers
    const currentUserId = user?.id || (user && 'uid' in user ? (user as any).uid : undefined) || (isTeacher ? 'teacher' : 'student');
    const currentUserName = user?.name || (isTeacher ? 'Profesor' : 'Estudiante');

    // 1. Sync Active state and student drawing permissions of the whiteboard
    useEffect(() => {
        if (!courseId) return;
        const boardMetaRef = doc(db, 'whiteboardMeta', courseId);
        
        const canInitiate = isTeacher || (user as any)?.canInitiateWhiteboard === true;

        if (canInitiate) {
            // Auto-activate whiteboard when opened by authorized initiator (teacher/admin or student with permission)
            setDoc(boardMetaRef, {
                active: true,
                updatedBy: currentUserName,
                updatedAt: new Date().toISOString()
            }, { merge: true }).catch(console.error);
        }

        const unsubMeta = onSnapshot(boardMetaRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setIsActive(data.active === true);
                if (data.bgPattern) {
                    setBgPattern(data.bgPattern);
                }
                const isAllowed = data.allowStudentDrawing === true;
                setAllowStudentDrawing(isAllowed);
                if (!isTeacher && prevAllowRef.current !== null && prevAllowRef.current !== isAllowed) {
                    if (isAllowed) {
                        showToast("✍️ El profesor ha activado la escritura. ¡Ya puedes escribir en la pizarra!");
                    } else {
                        showToast("🔒 La pizarra ha vuelto a modo solo lectura.");
                    }
                }
                prevAllowRef.current = isAllowed;
            } else {
                setIsActive(canInitiate);
                setAllowStudentDrawing(false);
                prevAllowRef.current = false;
            }
        });

        return () => unsubMeta();
    }, [courseId, currentUserName, isTeacher, user]);

    const toggleAllowStudentDrawing = async () => {
        if (!isTeacher) return;
        const nextState = !allowStudentDrawing;
        setAllowStudentDrawing(nextState);
        try {
            const boardMetaRef = doc(db, 'whiteboardMeta', courseId);
            await setDoc(boardMetaRef, { allowStudentDrawing: nextState }, { merge: true });
            showToast(nextState ? "✏️ Permisos de escritura activados para los alumnos" : "🔒 Alumnos puestos en modo solo lectura");
        } catch (err) {
            console.error("Error updating student drawing permission:", err);
        }
    };

    // Auto-center whiteboard for student on first load if content exists
    useEffect(() => {
        if (!isActive || isTeacher) return;
        if (hasAutoCenteredRef.current) return;
        if ((strokes && strokes.length > 0) || (boardDocs && boardDocs.length > 0)) {
            hasAutoCenteredRef.current = true;
            const timer = setTimeout(() => {
                handleFitToContent();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isActive, isTeacher, strokes, boardDocs]);

    const changeBgPattern = async (pattern: string) => {
        setBgPattern(pattern);
        localStorage.setItem('whiteboard_bg_pattern', pattern);
        try {
            const boardMetaRef = doc(db, 'whiteboardMeta', courseId);
            await setDoc(boardMetaRef, { bgPattern: pattern }, { merge: true });
        } catch (err) {
            console.error("Error setting whiteboard bgPattern: ", err);
        }
    };

    // WebSocket low-latency connection for multi-user live room
    useEffect(() => {
        if (!isActive || !courseId) return;

        let socket: WebSocket | null = null;
        let reconnectTimeout: any = null;
        let isDisposed = false;

        const connect = () => {
            if (isDisposed) return;

            try {
                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${wsProtocol}//${window.location.host}`;
                socket = new WebSocket(wsUrl);

                socket.onopen = () => {
                    if (isDisposed) {
                        socket?.close();
                        return;
                    }
                    setIsWsConnected(true);
                    // Join the course chat/whiteboard room
                    socket?.send(JSON.stringify({
                        type: 'join',
                        courseId,
                        role: isTeacher ? 'teacher' : 'student'
                    }));
                };

                socket.onmessage = (event) => {
                    if (isDisposed) return;
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'cursor' && data.courseId === courseId) {
                            const senderId = data.userId || data.senderId || (data.isTeacher ? 'teacher' : 'student');
                            if (senderId !== currentUserId) {
                                setParticipantCursors(prev => ({
                                    ...prev,
                                    [senderId]: {
                                        id: senderId,
                                        name: data.name || (data.isTeacher ? 'Profesor' : 'Estudiante'),
                                        isTeacher: !!data.isTeacher,
                                        x: data.x || 0,
                                        y: data.y || 0,
                                        active: data.active !== false,
                                        updatedAt: data.updatedAt || Date.now()
                                    }
                                }));
                            }
                        }
                    } catch (e) {
                        // ignore error
                    }
                };

                socket.onclose = () => {
                    setIsWsConnected(false);
                    if (!isDisposed) {
                        reconnectTimeout = setTimeout(connect, 3000);
                    }
                };

                socket.onerror = () => {
                    socket?.close();
                };

                wsRef.current = socket;
            } catch (err) {
                console.error('Failed to create WebSocket client:', err);
                setIsWsConnected(false);
                if (!isDisposed) {
                    reconnectTimeout = setTimeout(connect, 3000);
                }
            }
        };

        connect();

        return () => {
            isDisposed = true;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (socket) {
                socket.close();
            }
            setIsWsConnected(false);
        };
    }, [courseId, isActive, isTeacher, currentUserId]);

    // Broadcast current user's live cursor (Optimized for WebSockets with Firestore fallback)
    const updateTeacherCursor = async (x: number, y: number, active: boolean) => {
        if (!courseId) return;
        const now = Date.now();
        const throttleMs = isWsConnected ? 30 : 100;
        
        if (now - lastCursorWrite.current > throttleMs || !active) {
            lastCursorWrite.current = now;

            if (isWsConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                try {
                    wsRef.current.send(JSON.stringify({
                        type: "cursor",
                        courseId,
                        userId: currentUserId,
                        name: currentUserName,
                        isTeacher,
                        x,
                        y,
                        active
                    }));
                } catch (e) {
                    isWsConnected && setIsWsConnected(false);
                }
            } else {
                try {
                    await setDoc(doc(db, 'whiteboardCursors', `${courseId}_${currentUserId}`), {
                        courseId,
                        userId: currentUserId,
                        name: currentUserName,
                        isTeacher,
                        x,
                        y,
                        active,
                        updatedAt: now
                    }, { merge: true });
                } catch (e) {
                    // ignore
                }
            }
        }
    };

    // Subscribing to all participants' live cursors (Firestore Fallback Subscription)
    useEffect(() => {
        if (!isActive || !courseId) return;

        const cursorsColRef = collection(db, 'whiteboardCursors');
        const unsubCursor = onSnapshot(cursorsColRef, (snapshot) => {
            if (!isWsConnected) {
                const now = Date.now();
                const newCursors: Record<string, { id: string; name: string; isTeacher: boolean; x: number; y: number; active: boolean; updatedAt: number }> = {};
                snapshot.forEach((docSnap) => {
                    if (docSnap.id.startsWith(`${courseId}_`)) {
                        const data = docSnap.data();
                        const pId = data.userId || docSnap.id.replace(`${courseId}_`, '');
                        if (pId !== currentUserId) {
                            newCursors[pId] = {
                                id: pId,
                                name: data.name || (data.isTeacher ? 'Profesor' : 'Estudiante'),
                                isTeacher: !!data.isTeacher,
                                x: data.x || 0,
                                y: data.y || 0,
                                active: data.active !== false,
                                updatedAt: data.updatedAt || now
                            };
                        }
                    }
                });
                setParticipantCursors(prev => ({ ...prev, ...newCursors }));
            }
        });

        return () => unsubCursor();
    }, [courseId, isActive, isWsConnected, currentUserId]);

    // Clean up current user's cursor on unmount
    useEffect(() => {
        return () => {
            if (courseId && currentUserId) {
                setDoc(doc(db, 'whiteboardCursors', `${courseId}_${currentUserId}`), {
                    active: false,
                    updatedAt: Date.now()
                }, { merge: true }).catch(() => {});
            }
        };
    }, [courseId, currentUserId]);

    // Calculate content bounding box and fit zoom & pan seamlessly to display all drawings & documents
    const handleFitToContent = () => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        if (strokes && strokes.length > 0) {
            strokes.forEach(s => {
                if (s.points && s.points.length > 0) {
                    s.points.forEach(pt => {
                        if (pt.x < minX) minX = pt.x;
                        if (pt.x > maxX) maxX = pt.x;
                        if (pt.y < minY) minY = pt.y;
                        if (pt.y > maxY) maxY = pt.y;
                    });
                    if (s.type === 'text') {
                        const fontSize = s.size || 16;
                        const lines = s.textContent ? s.textContent.split('\n') : [''];
                        const maxChars = Math.max(...lines.map(line => line.length));
                        const estimatedWidth = Math.max(40, maxChars * fontSize * 0.55);
                        const estimatedHeight = Math.max(fontSize, lines.length * fontSize * 1.2);
                        const startX = s.points[0]?.x || 0;
                        const startY = s.points[0]?.y || 0;
                        if (startX < minX) minX = startX;
                        if (startX + estimatedWidth > maxX) maxX = startX + estimatedWidth;
                        if (startY < minY) minY = startY;
                        if (startY + estimatedHeight > maxY) maxY = startY + estimatedHeight;
                    }
                }
            });
        }

        if (boardDocs && boardDocs.length > 0) {
            boardDocs.forEach(d => {
                if (d.x < minX) minX = d.x;
                if (d.x + d.width > maxX) maxX = d.x + d.width;
                if (d.y < minY) minY = d.y;
                if (d.y + d.height > maxY) maxY = d.y + d.height;
            });
        }

        if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
            showToast("🔍 Pizarra sin contenido. Vista restablecida a 100%.");
            return;
        }

        const container = canvasContainerRef.current;
        if (!container) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
            return;
        }

        const rect = container.getBoundingClientRect();
        const contentWidth = Math.max(80, maxX - minX);
        const contentHeight = Math.max(80, maxY - minY);

        // Responsive padding ratio (90% available area on mobile screens < 640px)
        const paddingRatio = rect.width < 640 ? 0.90 : 0.85;
        const availableWidth = rect.width * paddingRatio;
        const availableHeight = rect.height * paddingRatio;

        const scaleX = availableWidth / contentWidth;
        const scaleY = availableHeight / contentHeight;
        
        let targetZoom = Math.min(scaleX, scaleY);
        // Allow zoom to scale down to 0.05 so large desktop whiteboard drawings scale down to fit small mobile screens completely!
        targetZoom = Math.max(0.05, Math.min(3.0, Number(targetZoom.toFixed(3))));

        const contentCenterX = minX + contentWidth / 2;
        const contentCenterY = minY + contentHeight / 2;

        const targetPanX = (rect.width / 2) - (contentCenterX * targetZoom);
        const targetPanY = (rect.height / 2) - (contentCenterY * targetZoom);

        setZoom(targetZoom);
        setPan({ x: Math.round(targetPanX), y: Math.round(targetPanY) });
        showToast("🎯 Vista ajustada para ver todo el contenido");
    };

    // Floating toolbar dragging handlers
    const handleToolbarDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setIsDraggingToolbar(true);
        setToolbarDragStart({
            x: clientX - formatToolbarPos.x,
            y: clientY - formatToolbarPos.y
        });
    };

    useEffect(() => {
        if (!isDraggingToolbar) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
            
            const nextX = clientX - toolbarDragStart.x;
            const nextY = clientY - toolbarDragStart.y;
            
            // Constrain within the window bounds so it doesn't get lost on mobile
            const menuWidth = window.innerWidth < 640 ? Math.min(310, window.innerWidth - 20) : 335;
            setFormatToolbarPos({
                x: Math.max(8, Math.min(window.innerWidth - menuWidth - 8, nextX)),
                y: Math.max(8, Math.min(window.innerHeight - 180, nextY))
            });
        };

        const handleUp = () => {
            setIsDraggingToolbar(false);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDraggingToolbar, toolbarDragStart]);

    // Format updates helpers for the floating toolbar
    const handleUpdateColor = (newColor: string) => {
        if (selectedStroke) {
            updateSelectedStroke({ color: newColor });
        } else {
            setColor(newColor);
        }
    };

    const handleUpdateSize = (newSize: number) => {
        if (selectedStroke) {
            updateSelectedStroke({ size: newSize });
        } else {
            setSize(newSize);
        }
    };

    const handleUpdateType = (newType: 'pencil' | 'marker' | 'eraser' | 'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow') => {
        if (selectedStroke) {
            updateSelectedStroke({ type: newType });
        } else {
            handleSetTool(newType);
        }
    };

    // 2. Load and Sync drawing strokes and documents in real-time
    useEffect(() => {
        if (!isActive) return;

        const strokesRef = collection(db, 'whiteboards', courseId, 'strokes');
        const unsubStrokes = onSnapshot(strokesRef, (snapshot) => {
            const list: Stroke[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    points: data.points || [],
                    color: data.color || '#000000',
                    size: data.size || 3,
                    type: data.type || 'pencil',
                    textContent: data.textContent
                });            });
            setStrokes(list);
        });

        const docsRef = collection(db, 'whiteboards', courseId, 'documents');
        const unsubDocs = onSnapshot(docsRef, (snapshot) => {
            const list: WhiteboardDoc[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    name: data.name || '',
                    url: data.url || '',
                    x: data.x || 10,
                    y: data.y || 10,
                    width: data.width || 200,
                    height: data.height || 150,
                    scale: data.scale || 1
                });
            });
            setBoardDocs(list);
        });

        return () => {
            unsubStrokes();
            unsubDocs();
        };
    }, [courseId, isActive]);

    const exportBoardState = () => {
        const boardData = {
            strokes,
            boardDocs
        };
        const blob = new Blob([JSON.stringify(boardData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pizarra_${courseId}_${new Date().toISOString()}.json`;
        a.click();
    };

    const getBoardBgHexColor = () => {
        if (boardColorTheme === 'cream') {
            return isDark ? '#1a1712' : '#fbfaf5';
        }
        if (boardColorTheme === 'chalkboard') {
            return '#0f241a';
        }
        if (boardColorTheme === 'blueprint') {
            return '#07152e';
        }
        if (boardColorTheme === 'charcoal') {
            return '#0f1115';
        }
        return isDark ? '#161a24' : '#fafafd';
    };

    const exportBoardAsImage = async () => {
        if (!canvasContainerRef.current) return;
        
        // Save current selections to hide borders/controls in final image
        const prevSelectedStrokeId = selectedStrokeId;
        const prevSelectedDocId = selectedDocId;
        
        setSelectedStrokeId(null);
        setSelectedDocId(null);
        
        // Slight delay to allow React to hide helper overlays & controls
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(canvasContainerRef.current!, {
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: getBoardBgHexColor(),
                    scale: 2, // crisp retina scale
                    logging: false,
                });
                
                const dataUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `pizarra_${courseId}_${new Date().toISOString()}.png`;
                a.click();
            } catch (error) {
                console.error("Error exporting whiteboard as image:", error);
            } finally {
                // Restore selections
                setSelectedStrokeId(prevSelectedStrokeId);
                setSelectedDocId(prevSelectedDocId);
            }
        }, 120);
    };

    // 3. Setup and close functions for teacher controls
    const handleRequestCloseBoard = () => {
        if (!isTeacher) {
            if (onClose) onClose();
            return;
        }
        setConfirmCloseBoardModalOpen(true);
    };

    const handleConfirmCloseAndClearBoard = async () => {
        setConfirmCloseBoardModalOpen(false);
        try {
            if (db && courseId) {
                // Deactivate board in meta
                const docRef = doc(db, 'whiteboardMeta', courseId);
                await setDoc(docRef, {
                    active: false,
                    closedAt: new Date().toISOString(),
                    closedBy: user?.name || 'Profesor'
                }, { merge: true }).catch(() => {});

                // Fetch and delete all documents in whiteboards subcollections
                const strokesColRef = collection(db, 'whiteboards', courseId, 'strokes');
                const docsColRef = collection(db, 'whiteboards', courseId, 'documents');

                const [strokesSnap, docsSnap] = await Promise.all([
                    getDocs(strokesColRef).catch(() => null),
                    getDocs(docsColRef).catch(() => null)
                ]);

                const batch = writeBatch(db);
                let count = 0;

                if (strokesSnap && !strokesSnap.empty) {
                    strokesSnap.forEach((d) => {
                        batch.delete(d.ref);
                        count++;
                    });
                }

                if (docsSnap && !docsSnap.empty) {
                    docsSnap.forEach((d) => {
                        batch.delete(d.ref);
                        count++;
                    });
                }

                // Delete legacy top-level docs if any
                batch.delete(doc(db, 'whiteboardStrokes', courseId));
                batch.delete(doc(db, 'whiteboardDocs', courseId));

                if (count > 0) {
                    await batch.commit().catch(async () => {
                        const deletePromises: Promise<any>[] = [];
                        if (strokesSnap) strokesSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
                        if (docsSnap) docsSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
                        await Promise.all(deletePromises).catch(() => {});
                    });
                }
            }

            // Clear local states, selections, zoom/pan, and undo stacks
            setStrokes([]);
            setBoardDocs([]);
            setSelectedStrokeId(null);
            setSelectedDocId(null);
            setActiveDragId(null);
            setActiveDragType(null);
            setEditingTextId(null);
            setIsAddingText(false);
            setPan({ x: 0, y: 0 });
            setZoom(1);
            setTool('pencil');
            setUndoStack([]);
            setRedoStack([]);
            if (courseId) {
                globalUndoStacks[courseId] = [];
                globalRedoStacks[courseId] = [];
            }
            setIsActive(false);
            if (onClose) onClose();
        } catch (e) {
            console.error("Error closing and clearing board:", e);
            setIsActive(false);
            if (onClose) onClose();
        }
    };

    const toggleActivateBoard = async () => {
        const canInitiate = isTeacher || (user as any)?.canInitiateWhiteboard === true;
        if (!canInitiate && !isActive) {
            showToast("🔒 No tienes permiso para activar la pizarra. Debes esperar a que un profesor o tutor la inicie.");
            return;
        }
        if (isActive) {
            handleRequestCloseBoard();
            return;
        }
        const nextState = true;
        try {
            const docRef = doc(db, 'whiteboardMeta', courseId);
            await setDoc(docRef, { active: nextState, updatedBy: user?.name, updatedAt: new Date().toISOString() }, { merge: true });
            setIsActive(nextState);
            setTool('pencil');
        } catch (e) {
            console.error('Error toggling whiteboard active index: ', e);
        }
    };

    const handleSetTool = (newTool: 'pencil' | 'marker' | 'eraser' | 'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow') => {
        if (!canUserDraw && newTool !== 'select') {
            showToast("🔒 La pizarra está en modo solo lectura. El profesor debe activar los permisos para dibujar.");
            return;
        }
        if (isAddingTextRef.current && newTool !== 'text') {
            handleSaveText();
        }
        if (editingTextId && newTool !== 'select') {
            handleSaveEditedText();
        }
        setTool(newTool);
        if (newTool === 'pencil') {
            setSize(4);
        } else if (newTool === 'marker') {
            setSize(16);
        } else if (newTool === 'eraser') {
            setSize(24);
        } else if (newTool === 'text') {
            setSize(20);
        } else if (['rectangle', 'circle', 'line', 'arrow'].includes(newTool)) {
            setSize(4);
        }
    };

    const handleMouseMoveOrTouch = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (isLocked) return;
        if (!canvasContainerRef.current) return;
        
        const rect = canvasContainerRef.current.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            if (e.touches.length === 0) return;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = (clientX - rect.left - pan.x) / zoom;
        const y = (clientY - rect.top - pan.y) / zoom;

        updateTeacherCursor(x, y, true);
    };

    const handleMouseLeaveBoard = () => {
        updateTeacherCursor(0, 0, false);
    };

    const activeDrawingToolRef = useRef<string>('pencil');

    // Calculate mouse/finger relative coordinates inside board element, adjusted for zoom and pan
    const getCoordinatesFromEvent = (e: React.MouseEvent<any> | React.TouchEvent<any> | React.PointerEvent<any>) => {
        if (!canvasContainerRef.current) return null;
        
        const rect = canvasContainerRef.current.getBoundingClientRect();
        let clientX = 0;
        let clientY = 0;
        let pressure = 0.5; // Default middle pressure

        if ('touches' in e) {
            if (e.touches.length === 0) return null;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
            
            // Extract pressure and detect pen stylus
            if ('pointerType' in e) {
                const pe = e as React.PointerEvent<any>;
                if (pe.pointerType === 'pen') {
                    // Modern styluses give real pressure (0.0 to 1.0)
                    pressure = pe.pressure && pe.pressure > 0 ? pe.pressure : 0.5;
                }
            }
        }

        // Return coordinates relative to the whiteboard card container, adjusted for zoom and pan
        const relativeX = (clientX - rect.left - pan.x) / zoom;
        const relativeY = (clientY - rect.top - pan.y) / zoom;

        return { x: relativeX, y: relativeY, p: pressure };
    };

    // Drawing Trigger methods
    const handleStartDrawing = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement> | React.PointerEvent<SVGSVGElement>) => {
        const isPointer = 'pointerType' in e;
        const pointerType = isPointer ? (e as React.PointerEvent<any>).pointerType : '';
        const pointerId = isPointer ? (e as React.PointerEvent<any>).pointerId : null;

        // If we are already drawing with a stylus/pen, ignore new touch/palm-starts completely.
        if (isDrawingWithStylusRef.current && pointerType === 'touch') {
            return;
        }

        // Multi-touch safeguard: if pinching or 2+ touches, do not start drawing (it is a pinch/pan gesture)
        if (isPinchingRef.current) return;
        if (pointerType !== 'pen') {
            const nativeEvent = e.nativeEvent as any;
            const touches = nativeEvent ? (nativeEvent.touches || nativeEvent.targetTouches) : null;
            if (touches && touches.length >= 2) {
                return;
            }
        }

        if (editingTextId) {
            handleSaveEditedText();
        }

        // Detect if using active stylus pen
        if (isPointer && pointerType === 'pen') {
            isDrawingWithStylusRef.current = true;
            if (!isPenDetected) {
                setIsPenDetected(true);
                if (!isPenOnlyDrawing) {
                    setIsPenOnlyDrawing(true);
                    localStorage.setItem('whiteboard_pen_only_drawing', 'true');
                    showToast("🖊️ ¡Lápiz óptico detectado! Hemos activado el Rechazo de Palma automáticamente. Escribe con tu lápiz y desliza/haz zoom con tus dedos.");
                } else {
                    showToast("🖊️ Lápiz óptico detectado. El Rechazo de Palma está activo para una escritura fluida.");
                }
            }
        }

        if (isPointer && pointerId !== null) {
            activePointerIdRef.current = pointerId;
        }

        // Auto-detect pen eraser tip (buttons = 32 or button = 5) or side barrel button (buttons = 2)
        let activeDrawingTool = tool;
        if (isPointer && pointerType === 'pen') {
            const isEraserTip = (e as any).buttons === 32 || (e as any).button === 5;
            const isSideButton = (e as any).buttons === 2 || (e as any).button === 2;
            if (isEraserTip || isSideButton) {
                activeDrawingTool = 'eraser';
            }
        }
        activeDrawingToolRef.current = activeDrawingTool;

        // Panning check
        const isMiddleClick = !isPointer && !('touches' in e) && (e as any).button === 1;
        
        // Automatic Palm Rejection / Separate Touch & Pen / Student read-only enforcement:
        // If pen-only drawing is active, or if student lacks write permissions, treat touch input as panning.
        const forcePanning = (isPointer && pointerType === 'touch' && (isPenOnlyDrawing || isPenDetected)) || !canUserDraw;

        if (tool === 'select' || isMiddleClick || isPresentationMode || forcePanning) {
            if (!isCanvasMovementLocked) {
                setIsPanning(true);
                const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
            }
            return;
        }

        if (isLocked || isPresentationMode) return;
        
        if (activeDrawingTool === 'text') {
            e.preventDefault(); // Prevents focus theft from the newly mounted input
            if (isAddingTextRef.current) {
                handleSaveText();
            }
            const coords = getCoordinatesFromEvent(e);
            if (coords) {
                setTextPosition(coords);
                updateIsAddingText(true);
            }
            return;
        }
        
        setIsDrawing(true);
        const coords = getCoordinatesFromEvent(e);
        if (coords) {
            setCurrentPoints([coords]);
        }
    };

    const handleDrawingMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement> | React.PointerEvent<SVGSVGElement>) => {
        const isPointer = 'pointerType' in e;
        const pointerType = isPointer ? (e as React.PointerEvent<any>).pointerType : '';
        const pointerId = isPointer ? (e as React.PointerEvent<any>).pointerId : null;

        // If a stylus is currently drawing, completely ignore concurrent touch movements (palm friction)
        if (isDrawingWithStylusRef.current && pointerType === 'touch') {
            return;
        }

        // If we are tracking by pointerId, make sure only the original pointer moves the drawing
        if (isDrawing && isPointer && activePointerIdRef.current !== null && pointerId !== activePointerIdRef.current) {
            return;
        }

        if (isPinchingRef.current) {
            if (isPanning) setIsPanning(false);
            if (isDrawing) setIsDrawing(false);
            return;
        }

        // Multi-touch safeguard: if there are 2 or more active touches, do not draw (it is a pinch/pan gesture)
        if (pointerType !== 'pen') {
            const nativeEvent = e.nativeEvent as any;
            const touches = nativeEvent ? (nativeEvent.touches || nativeEvent.targetTouches) : null;
            if (touches && touches.length >= 2) {
                if (isDrawing) {
                    setIsDrawing(false);
                    isDrawingWithStylusRef.current = false;
                    activePointerIdRef.current = null;
                    setCurrentPoints([]);
                }
                if (isPanning) {
                    setIsPanning(false);
                }
                return;
            }
        }

        if (isPanning) {
            const nativeEvent = e.nativeEvent as any;
            const touches = nativeEvent ? (nativeEvent.touches || nativeEvent.targetTouches) : null;
            if (touches && touches.length >= 2) {
                setIsPanning(false);
                return;
            }
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            setPan({
                x: clientX - panStart.x,
                y: clientY - panStart.y
            });
            return;
        }

        const activeDrawingTool = activeDrawingToolRef.current || tool;

        if (!isDrawing || tool === 'select') return;
        
        // Prevent browser viewport scrolling on drag touch
        if ('touches' in e) {
            if (e.cancelable) e.preventDefault();
        }

        const coords = getCoordinatesFromEvent(e);
        if (coords) {
            if (['rectangle', 'circle', 'line', 'arrow'].includes(activeDrawingTool)) {
                setCurrentPoints(prev => prev.length > 0 ? [prev[0], coords] : [coords]);
            } else {
                // Apply low-pass exponential moving average filter for stylus/pencil smoothing
                if (stabilizerStrength > 0 && currentPoints.length > 0) {
                    const lastPoint = currentPoints[currentPoints.length - 1];
                    const factor = stabilizerStrength * 0.16; // ranges from 0 to 0.8
                    const smoothedX = lastPoint.x * factor + coords.x * (1 - factor);
                    const smoothedY = lastPoint.y * factor + coords.y * (1 - factor);
                    
                    const smoothedP = coords.p !== undefined && lastPoint.p !== undefined
                        ? lastPoint.p * factor + coords.p * (1 - factor)
                        : coords.p;

                    setCurrentPoints(prev => [...prev, { x: smoothedX, y: smoothedY, p: smoothedP }]);
                } else {
                    setCurrentPoints(prev => [...prev, coords]);
                }
            }
        }
    };

    const handleStopDrawing = async (e?: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
        const isPointer = e ? 'pointerType' in e : false;
        const pointerType = isPointer ? (e as any).pointerType : '';
        const pointerId = isPointer ? (e as any).pointerId : null;

        // Ignore touch-up events if a stylus drawing stroke is active (palm lifts shouldn't stop the pen stroke)
        if (isDrawingWithStylusRef.current && pointerType === 'touch') {
            return;
        }

        // If we are tracking by pointerId, make sure only the original pointer ends the drawing
        if (isDrawing && isPointer && activePointerIdRef.current !== null && pointerId !== activePointerIdRef.current) {
            return;
        }

        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (!isDrawing) return;
        setIsDrawing(false);
        isDrawingWithStylusRef.current = false;
        activePointerIdRef.current = null;

        if (currentPoints.length < 2) {
            setCurrentPoints([]);
            return;
        }

        const activeDrawingTool = activeDrawingToolRef.current || tool;

        // Sync drawing stroke to firestore
        try {
            const strokesCollectionRef = collection(db, 'whiteboards', courseId, 'strokes');
            const strokeData = {
                points: currentPoints,
                color: activeDrawingTool === 'eraser' ? getBoardBgHexColor() : color,
                size: size,
                type: activeDrawingTool,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(strokesCollectionRef, strokeData);
            pushToHistory({
                type: 'add_stroke',
                targetType: 'stroke',
                targetId: docRef.id,
                beforeState: null,
                afterState: strokeData
            });
        } catch (err) {
            console.error('Firestore upload error of stroke: ', err);
        } finally {
            setCurrentPoints([]);
        }
    };

    async function handleSaveText() {
        if (isSavingTextRef.current) return;
        const textToSave = textInput.trim();
        if (textToSave === '') {
            updateIsAddingText(false);
            return;
        }

        isSavingTextRef.current = true;
        // Release the saving lock after 100ms to allow subsequent rapid text additions
        // while still perfectly blocking the immediate duplicate onBlur/Enter race events
        setTimeout(() => {
            isSavingTextRef.current = false;
        }, 100);

        // Synchronously clear input and close text state to avoid racing with onBlur
        updateIsAddingText(false);
        setTextInput('');

        try {
            const strokesCollectionRef = collection(db, 'whiteboards', courseId, 'strokes');
            const strokeData = {
                points: [textPosition],
                color: color,
                size: size || 20, // Use the selected font size!
                type: 'text' as const,
                textContent: textToSave,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(strokesCollectionRef, strokeData);
            pushToHistory({
                type: 'add_stroke',
                targetType: 'stroke',
                targetId: docRef.id,
                beforeState: null,
                afterState: strokeData
            });
            // Automatically select the newly created text block
            setSelectedStrokeId(docRef.id);
            // Only switch to select if we are not actively adding another text block and we are not in 'text' tool mode
            if (!isAddingTextRef.current && tool !== 'text') {
                setTool('select');
            }
        } catch (err) {
            console.error('Error saving text stroke: ', err);
        }
    }

    async function handleSaveEditedText() {
        if (!editingTextId) return;
        const targetId = editingTextId;
        const textToSave = editingTextValue.trim();
        const stroke = strokes.find(s => s.id === targetId);
        
        // Clean up editing state first to ensure quick UI response
        setEditingTextId(null);
        
        if (!stroke || stroke.type !== 'text') return;

        if (textToSave === '') {
            // Delete if edited to be empty
            try {
                await deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', targetId));
                pushToHistory({
                    type: 'delete_stroke',
                    targetType: 'stroke',
                    targetId: targetId,
                    beforeState: stroke,
                    afterState: null
                });
                if (selectedStrokeId === targetId) {
                    setSelectedStrokeId(null);
                }
            } catch (err) {
                console.error('Error deleting empty text stroke: ', err);
            }
            return;
        }

        if (textToSave === stroke.textContent) return;

        try {
            await updateStroke(targetId, { textContent: textToSave });
            pushToHistory({
                type: 'edit_text',
                targetType: 'stroke',
                targetId: targetId,
                beforeState: { textContent: stroke.textContent },
                afterState: { textContent: textToSave }
            });
        } catch (err) {
            console.error('Error saving edited text stroke: ', err);
        }
    }

    // Document actions: upload image/diag base64
    const triggerAddFile = () => {
        if (!canUserDraw) {
            showToast("🔒 No tienes permisos para añadir documentos a la pizarra.");
            return;
        }
        wasFullScreenBeforeUpload.current = isVisualFullScreen;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await uploadDocumentFirestore(file.name, base64);
        };
        reader.readAsDataURL(file);

        if (wasFullScreenBeforeUpload.current) {
            if (!document.fullscreenElement && boardRef.current && boardRef.current.isConnected) {
                const el = boardRef.current as any;
                const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
                if (typeof requestFs === 'function') {
                    requestFs.call(el)
                        .then(() => {
                            wasFullScreenBeforeUpload.current = false;
                        })
                        .catch((err: any) => {
                            console.warn("Synchronous fullscreen restore in handleFileChange failed, trying with timeout:", err);
                            setTimeout(() => {
                                if (!document.fullscreenElement && boardRef.current && boardRef.current.isConnected) {
                                    const el = boardRef.current as any;
                                    const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
                                    if (typeof requestFs === 'function') {
                                        requestFs.call(el)
                                            .then(() => {
                                                wasFullScreenBeforeUpload.current = false;
                                            })
                                            .catch((timeoutErr: any) => {
                                                console.warn("Could not restore fullscreen in timeout:", timeoutErr);
                                            });
                                    }
                                }
                            }, 300);
                        });
                }
            } else {
                wasFullScreenBeforeUpload.current = false;
            }
        }
    };

    const uploadDocumentFirestore = async (name: string, url: string) => {
        try {
            const docsCollectionRef = collection(db, 'whiteboards', courseId, 'documents');
            const docData = {
                name,
                url,
                x: 120 + Math.random() * 50,
                y: 100 + Math.random() * 50,
                width: 280,
                height: 200,
                scale: 1,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(docsCollectionRef, docData);
            pushToHistory({
                type: 'add_doc',
                targetType: 'doc',
                targetId: docRef.id,
                beforeState: null,
                afterState: docData
            });
        } catch (err) {
            console.error('Error inserting whiteboard document: ', err);
        }
    };

    const handleSelectStroke = (strokeId: string, force: boolean = false) => {
        if (tool !== 'select' && !force) return;
        setSelectedStrokeId(strokeId);
    };

    const deleteSelectedStroke = async () => {
        if (!selectedStrokeId || !selectedStroke) return;
        try {
            pushToHistory({
                type: 'delete_stroke',
                targetType: 'stroke',
                targetId: selectedStrokeId,
                beforeState: selectedStroke,
                afterState: null
            });
            await deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', selectedStrokeId));
            setSelectedStrokeId(null);
        } catch (e) {
            console.error('Error deleting stroke:', e);
        }
    };

    const updateStroke = async (strokeId: string, updates: Partial<Stroke>) => {
        try {
            await setDoc(doc(db, 'whiteboards', courseId, 'strokes', strokeId), updates, { merge: true });
        } catch (e) {
            console.error('Error updating stroke:', e);
        }
    };

    const updateSelectedStroke = async (updates: Partial<Stroke>) => {
        if (!selectedStrokeId) return;
        await updateStroke(selectedStrokeId, updates);
    };

    const undo = async () => {
        if (undoStack.length === 0) return;
        const action = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        
        try {
            if (action.type === 'move' || action.type === 'resize' || action.type === 'edit_text') {
                if (action.targetType === 'stroke') {
                    await updateStroke(action.targetId, action.beforeState);
                } else if (action.targetType === 'doc') {
                    await updateDocPosition(action.targetId, action.beforeState);
                }
            } else if (action.type === 'add_stroke') {
                await deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', action.targetId));
                if (selectedStrokeId === action.targetId) {
                    setSelectedStrokeId(null);
                }
            } else if (action.type === 'delete_stroke') {
                await setDoc(doc(db, 'whiteboards', courseId, 'strokes', action.targetId), action.beforeState);
            } else if (action.type === 'add_doc') {
                await deleteDoc(doc(db, 'whiteboards', courseId, 'documents', action.targetId));
                if (selectedDocId === action.targetId) {
                    setSelectedDocId(null);
                }
            } else if (action.type === 'delete_doc') {
                await setDoc(doc(db, 'whiteboards', courseId, 'documents', action.targetId), action.beforeState);
            } else if (action.type === 'clear_board') {
                const batch = writeBatch(db);
                if (action.beforeState.strokes) {
                    action.beforeState.strokes.forEach((stroke: any) => {
                        const { id, ...data } = stroke;
                        batch.set(doc(db, 'whiteboards', courseId, 'strokes', id), data);
                    });
                }
                if (action.beforeState.documents) {
                    action.beforeState.documents.forEach((d: any) => {
                        const { id, ...data } = d;
                        batch.set(doc(db, 'whiteboards', courseId, 'documents', id), data);
                    });
                }
                await batch.commit();
            }
            
            setRedoStack(prev => [...prev, action]);
        } catch (err) {
            console.error('Error executing undo:', err);
        }
    };

    const redo = async () => {
        if (redoStack.length === 0) return;
        const action = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        
        try {
            if (action.type === 'move' || action.type === 'resize' || action.type === 'edit_text') {
                if (action.targetType === 'stroke') {
                    await updateStroke(action.targetId, action.afterState);
                } else if (action.targetType === 'doc') {
                    await updateDocPosition(action.targetId, action.afterState);
                }
            } else if (action.type === 'add_stroke') {
                await setDoc(doc(db, 'whiteboards', courseId, 'strokes', action.targetId), action.afterState);
            } else if (action.type === 'delete_stroke') {
                await deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', action.targetId));
                if (selectedStrokeId === action.targetId) {
                    setSelectedStrokeId(null);
                }
            } else if (action.type === 'add_doc') {
                await setDoc(doc(db, 'whiteboards', courseId, 'documents', action.targetId), action.afterState);
            } else if (action.type === 'delete_doc') {
                await deleteDoc(doc(db, 'whiteboards', courseId, 'documents', action.targetId));
                if (selectedDocId === action.targetId) {
                    setSelectedDocId(null);
                }
            } else if (action.type === 'clear_board') {
                const strokesSnap = await getDocs(collection(db, 'whiteboards', courseId, 'strokes'));
                const docsSnap = await getDocs(collection(db, 'whiteboards', courseId, 'documents'));
                const batch = writeBatch(db);
                strokesSnap.forEach((doc) => batch.delete(doc.ref));
                docsSnap.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }
            
            setUndoStack(prev => [...prev, action]);
        } catch (err) {
            console.error('Error executing redo:', err);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const state = stateRef.current;
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            const isCmdOrCtrl = e.metaKey || e.ctrlKey;
            if (isCmdOrCtrl) {
                if (e.key === 'z' || e.key === 'Z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                } else if (e.key === 'y' || e.key === 'Y') {
                    e.preventDefault();
                    redo();
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedStrokeId) {
                    e.preventDefault();
                    deleteSelectedStroke();
                } else if (selectedDocId) {
                    e.preventDefault();
                    const docItem = state.boardDocs.find(d => d.id === selectedDocId);
                    if (docItem) {
                        pushToHistory({
                            type: 'delete_doc',
                            targetType: 'doc',
                            targetId: selectedDocId,
                            beforeState: docItem,
                            afterState: null
                        });
                        deleteDoc(doc(db, 'whiteboards', courseId, 'documents', selectedDocId));
                        setSelectedDocId(null);
                    }
                }
            } else if (e.key === 'Escape') {
                setSelectedStrokeId(null);
                setSelectedDocId(null);
            } else {
                // Single key shortcuts for tools and actions
                const key = e.key.toLowerCase();
                if (key === 'p') {
                    e.preventDefault();
                    handleSetTool('pencil');
                } else if (key === 'm') {
                    e.preventDefault();
                    handleSetTool('marker');
                } else if (key === 'e') {
                    e.preventDefault();
                    handleSetTool('eraser');
                } else if (key === 's') {
                    e.preventDefault();
                    handleSetTool('select');
                } else if (key === 't') {
                    e.preventDefault();
                    handleSetTool('text');
                } else if (key === 'r') {
                    e.preventDefault();
                    handleSetTool('rectangle');
                } else if (key === 'o') {
                    e.preventDefault();
                    handleSetTool('circle');
                } else if (key === 'l') {
                    e.preventDefault();
                    handleSetTool('line');
                } else if (key === 'a') {
                    e.preventDefault();
                    handleSetTool('arrow');
                } else if (key === 'h') {
                    e.preventDefault();
                    toggleToolbar();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTeacher, undoStack, redoStack, selectedStrokeId, selectedDocId, handleSetTool, toggleToolbar]);

    // Document reposition methods: Dragging & Resizing inside whiteboard ref
    const handleStartDrag = (e: React.MouseEvent | React.TouchEvent, docId: string, itemX: number, itemY: number) => {
        if (isLocked) return;
        e.stopPropagation();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setSelectedDocId(docId);
        setSelectedStrokeId(null);
        setActiveDragId(docId);
        setActiveDragType('doc');
        setDragOffset({
            x: itemX,
            y: itemY,
            clientX,
            clientY
        });
        
        const docItem = boardDocs.find(d => d.id === docId);
        if (docItem) {
            setActionBeforeState({ x: docItem.x, y: docItem.y });
        }
    };

    const handleStartResize = (e: React.MouseEvent | React.TouchEvent, item: WhiteboardDoc, corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right') => {
        if (isLocked) return;
        e.stopPropagation();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setSelectedDocId(item.id);
        setSelectedStrokeId(null);
        setActiveResizeId(item.id);
        setActiveResizeCorner(corner);
        setResizeStartSize({
            width: item.width,
            height: item.height,
            scale: item.scale
        });
        setResizeStartPos({
            x: clientX,
            y: clientY
        });
        setResizeStartPosItem({
            x: item.x,
            y: item.y
        });
        
        setActionBeforeState({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height
        });
    };

    const handleStartResizeStroke = (
        e: React.MouseEvent | React.TouchEvent,
        stroke: Stroke,
        corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    ) => {
        if (isLocked) return;
        e.stopPropagation();
        if ('preventDefault' in e) e.preventDefault();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        let box;
        let fontSize = stroke.size || 16;
        if (stroke.type === 'text') {
            const lines = stroke.textContent ? stroke.textContent.split('\n') : [''];
            const maxChars = Math.max(...lines.map(line => line.length));
            const estimatedWidth = Math.max(40, maxChars * fontSize * 0.55);
            const estimatedHeight = Math.max(fontSize, lines.length * fontSize * 1.2);
            const startX = stroke.points[0]?.x || 0;
            const startY = stroke.points[0]?.y || 0;
            box = {
                x: startX,
                y: startY,
                width: estimatedWidth,
                height: estimatedHeight
            };
        } else {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            stroke.points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            });
            box = {
                x: minX,
                y: minY,
                width: Math.max(1, maxX - minX),
                height: Math.max(1, maxY - minY)
            };
        }

        setActiveResizeStrokeId(stroke.id);
        setActiveResizeStrokeCorner(corner);
        setResizeStrokeStartBox(box);
        setResizeStrokeStartMouse({ x: clientX, y: clientY });
        setResizeStrokeOriginalPoints([...stroke.points]);
        setResizeStrokeStartSize(fontSize);
        
        setActionBeforeState({
            points: [...stroke.points],
            size: fontSize
        });
    };

    const getEventClientCoords = (e: MouseEvent | TouchEvent) => {
        if ('touches' in e && e.touches && e.touches.length > 0) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        }
        const mouseEv = e as MouseEvent;
        return { clientX: mouseEv.clientX, clientY: mouseEv.clientY };
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
        const state = stateRef.current;
        if (state.activeDragId || state.activeResizeId || state.activeResizeStrokeId) {
            if (e.cancelable) e.preventDefault();
            handleGlobalMouseMove(e);
        }
    };

    // Tracking movement triggers globally for smooth drag responses
    const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => {
        const state = stateRef.current;
        if (state.activeDragType === 'doc' && state.activeDragId && state.isTeacher) {
            const { clientX, clientY } = getEventClientCoords(e);
            const originalX = state.actionBeforeState?.x ?? state.dragOffset.x;
            const originalY = state.actionBeforeState?.y ?? state.dragOffset.y;
            const deltaX = (clientX - state.dragOffset.clientX) / state.zoom;
            const deltaY = (clientY - state.dragOffset.clientY) / state.zoom;
            const nextX = Math.max(0, originalX + deltaX);
            const nextY = Math.max(0, originalY + deltaY);
            setBoardDocs(prev => prev.map(d => d.id === state.activeDragId ? { ...d, x: nextX, y: nextY } : d));
        } else if (state.activeDragType === 'stroke' && state.activeDragId) {
            const originalPoints = state.actionBeforeState?.points;
            if (originalPoints) {
                const { clientX, clientY } = getEventClientCoords(e);
                const deltaX = (clientX - state.dragOffset.clientX) / state.zoom;
                const deltaY = (clientY - state.dragOffset.clientY) / state.zoom;
                const nextPoints = originalPoints.map((p: { x: number; y: number }) => ({ x: p.x + deltaX, y: p.y + deltaY }));
                setStrokes(prev => prev.map(s => s.id === state.activeDragId ? { ...s, points: nextPoints } : s));
            }
        } else if (state.activeResizeStrokeId && state.activeResizeStrokeCorner && state.resizeStrokeStartBox && state.resizeStrokeStartMouse && state.isTeacher) {
            const stroke = state.strokes.find(s => s.id === state.activeResizeStrokeId);
            if (stroke) {
                const { clientX, clientY } = getEventClientCoords(e);
                const deltaX = (clientX - state.resizeStrokeStartMouse.x) / state.zoom;
                const deltaY = (clientY - state.resizeStrokeStartMouse.y) / state.zoom;
                const startBox = state.resizeStrokeStartBox;
                let scaleFactor = 1;

                if (state.activeResizeStrokeCorner === 'bottom-right') {
                    const scaleX = (startBox.width + deltaX) / startBox.width;
                    const scaleY = (startBox.height + deltaY) / startBox.height;
                    scaleFactor = Math.max(0.1, (scaleX + scaleY) / 2);
                } else if (state.activeResizeStrokeCorner === 'bottom-left') {
                    const scaleX = (startBox.width - deltaX) / startBox.width;
                    const scaleY = (startBox.height + deltaY) / startBox.height;
                    scaleFactor = Math.max(0.1, (scaleX + scaleY) / 2);
                } else if (state.activeResizeStrokeCorner === 'top-right') {
                    const scaleX = (startBox.width + deltaX) / startBox.width;
                    const scaleY = (startBox.height - deltaY) / startBox.height;
                    scaleFactor = Math.max(0.1, (scaleX + scaleY) / 2);
                } else if (state.activeResizeStrokeCorner === 'top-left') {
                    const scaleX = (startBox.width - deltaX) / startBox.width;
                    const scaleY = (startBox.height - deltaY) / startBox.height;
                    scaleFactor = Math.max(0.1, (scaleX + scaleY) / 2);
                }

                const nextBoxWidth = startBox.width * scaleFactor;
                const nextBoxHeight = startBox.height * scaleFactor;

                let nextBoxX = startBox.x;
                let nextBoxY = startBox.y;

                if (state.activeResizeStrokeCorner === 'bottom-left' || state.activeResizeStrokeCorner === 'top-left') {
                    nextBoxX = startBox.x - (nextBoxWidth - startBox.width);
                }
                if (state.activeResizeStrokeCorner === 'top-right' || state.activeResizeStrokeCorner === 'top-left') {
                    nextBoxY = startBox.y - (nextBoxHeight - startBox.height);
                }

                if (stroke.type === 'text') {
                    const nextSize = Math.max(8, Math.min(120, state.resizeStrokeStartSize * scaleFactor));
                    const nextPoints = [{ x: nextBoxX, y: nextBoxY }];
                    setStrokes(prev => prev.map(s => s.id === state.activeResizeStrokeId ? { ...s, points: nextPoints, size: nextSize } : s));
                } else {
                    const nextPoints = state.resizeStrokeOriginalPoints.map(p => {
                        const fx = (p.x - startBox.x) / startBox.width;
                        const fy = (p.y - startBox.y) / startBox.height;
                        return {
                            x: nextBoxX + fx * nextBoxWidth,
                            y: nextBoxY + fy * nextBoxHeight
                        };
                    });
                    setStrokes(prev => prev.map(s => s.id === state.activeResizeStrokeId ? { ...s, points: nextPoints } : s));
                }
            }
        } else if (state.activeResizeId && state.isTeacher) {
            const item = state.boardDocs.find(d => d.id === state.activeResizeId);
            if (item) {
                const { clientX, clientY } = getEventClientCoords(e);
                const deltaX = (clientX - state.resizeStartPos.x) / state.zoom;
                const aspectRatio = state.resizeStartSize.height / state.resizeStartSize.width;

                let nextWidth = state.resizeStartSize.width;
                let nextHeight = state.resizeStartSize.height;
                let nextX = state.resizeStartPosItem.x;
                let nextY = state.resizeStartPosItem.y;

                if (state.activeResizeCorner === 'bottom-right') {
                    nextWidth = Math.max(100, state.resizeStartSize.width + deltaX);
                    nextHeight = Math.max(80, state.resizeStartSize.height + (deltaX * aspectRatio));
                } else if (state.activeResizeCorner === 'bottom-left') {
                    nextWidth = Math.max(100, state.resizeStartSize.width - deltaX);
                    const widthChange = nextWidth - state.resizeStartSize.width;
                    nextHeight = Math.max(80, state.resizeStartSize.height + (widthChange * aspectRatio));
                    nextX = state.resizeStartPosItem.x - widthChange;
                } else if (state.activeResizeCorner === 'top-right') {
                    nextWidth = Math.max(100, state.resizeStartSize.width + deltaX);
                    const widthChange = nextWidth - state.resizeStartSize.width;
                    nextHeight = Math.max(80, state.resizeStartSize.height + (widthChange * aspectRatio));
                    nextY = state.resizeStartPosItem.y - (nextHeight - state.resizeStartSize.height);
                } else if (state.activeResizeCorner === 'top-left') {
                    nextWidth = Math.max(100, state.resizeStartSize.width - deltaX);
                    const widthChange = nextWidth - state.resizeStartSize.width;
                    nextHeight = Math.max(80, state.resizeStartSize.height + (widthChange * aspectRatio));
                    nextX = state.resizeStartPosItem.x - widthChange;
                    nextY = state.resizeStartPosItem.y - (nextHeight - state.resizeStartSize.height);
                }

                setBoardDocs(prev => prev.map(d => d.id === state.activeResizeId ? {
                    ...d,
                    width: nextWidth,
                    height: nextHeight,
                    x: nextX,
                    y: nextY
                } : d));
            }
        }
    };

    const handleGlobalMouseUp = async () => {
        const state = stateRef.current;
        if (state.activeDragId || state.activeResizeId || state.activeResizeStrokeId) {
            // Capture state variables BEFORE clearing them synchronously to prevent blocking the UI
            const dragId = state.activeDragId;
            const dragType = state.activeDragType;
            const resizeId = state.activeResizeId;
            const resizeStrokeId = state.activeResizeStrokeId;
            const actionBeforeStateLocal = state.actionBeforeState;

            // Clear state immediately so visual elements detach from the pointer instantly
            setActiveDragId(null);
            setActiveDragType(null);
            setActiveResizeId(null);
            setActiveResizeCorner(null);
            setActiveResizeStrokeId(null);
            setActiveResizeStrokeCorner(null);
            setResizeStrokeStartBox(null);
            setResizeStrokeStartMouse(null);
            setResizeStrokeOriginalPoints([]);
            setActionBeforeState(null);

            try {
                // Write final state to Firestore using captured variables
                if (dragType === 'doc' && dragId) {
                    const docItem = state.boardDocs.find(d => d.id === dragId);
                    if (docItem) {
                        await updateDocPosition(dragId, { x: docItem.x, y: docItem.y });
                        if (actionBeforeStateLocal && (actionBeforeStateLocal.x !== docItem.x || actionBeforeStateLocal.y !== docItem.y)) {
                            pushToHistory({
                                type: 'move',
                                targetType: 'doc',
                                targetId: dragId,
                                beforeState: { x: actionBeforeStateLocal.x, y: actionBeforeStateLocal.y },
                                afterState: { x: docItem.x, y: docItem.y }
                            });
                        }
                    }
                } else if (dragType === 'stroke' && dragId) {
                    const strokeItem = state.strokes.find(s => s.id === dragId);
                    if (strokeItem) {
                        await updateStroke(dragId, { points: strokeItem.points });
                        if (actionBeforeStateLocal && actionBeforeStateLocal.points) {
                            pushToHistory({
                                type: 'move',
                                targetType: 'stroke',
                                targetId: dragId,
                                beforeState: { points: actionBeforeStateLocal.points },
                                afterState: { points: [...strokeItem.points] }
                            });
                        }
                    }
                } else if (resizeStrokeId) {
                    const strokeItem = state.strokes.find(s => s.id === resizeStrokeId);
                    if (strokeItem) {
                        const finalSize = Math.round(strokeItem.size);
                        await updateStroke(resizeStrokeId, { points: strokeItem.points, size: finalSize });
                        if (actionBeforeStateLocal && actionBeforeStateLocal.points) {
                            pushToHistory({
                                type: 'resize',
                                targetType: 'stroke',
                                targetId: resizeStrokeId,
                                beforeState: { points: actionBeforeStateLocal.points, size: actionBeforeStateLocal.size },
                                afterState: { points: [...strokeItem.points], size: finalSize }
                            });
                        }
                    }
                } else if (resizeId) {
                    const docItem = state.boardDocs.find(d => d.id === resizeId);
                    if (docItem) {
                        await updateDocPosition(resizeId, {
                            width: docItem.width,
                            height: docItem.height,
                            x: docItem.x,
                            y: docItem.y
                        });
                        if (actionBeforeStateLocal) {
                            pushToHistory({
                                type: 'resize',
                                targetType: 'doc',
                                targetId: resizeId,
                                beforeState: {
                                    x: actionBeforeStateLocal.x,
                                    y: actionBeforeStateLocal.y,
                                    width: actionBeforeStateLocal.width,
                                    height: actionBeforeStateLocal.height
                                },
                                afterState: {
                                    x: docItem.x,
                                    y: docItem.y,
                                    width: docItem.width,
                                    height: docItem.height
                                }
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Error saving drag/resize state:", err);
            }
        }
    };

    useEffect(() => {
        if (!isActive) return;
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
        window.addEventListener('touchend', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchmove', handleGlobalTouchMove);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, isActive]);

    // Active Wheel listener to support zooming in and out relative to the mouse pointer seamlessly
    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;

        const handleNativeWheel = (e: WheelEvent) => {
            // Prevent default page scrolling when zooming inside the canvas
            e.preventDefault();

            // If canvas movement is locked, block any zooming via wheel
            if (isCanvasMovementLocked) {
                return;
            }

            const zoomFactor = 1.15;
            const direction = e.deltaY < 0 ? 1 : -1;
            
            // Get pointer relative to container
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Target zoom level
            const currZoom = zoomRef.current;
            const currPan = panRef.current;
            let nextZoom = currZoom;
            if (direction > 0) {
                nextZoom = Math.min(5.0, Number((currZoom * zoomFactor).toFixed(2)));
            } else {
                nextZoom = Math.max(0.15, Number((currZoom / zoomFactor).toFixed(2)));
            }
            
            if (nextZoom !== currZoom) {
                // Adjust pan coordinates so that the zoom target focuses seamlessly on the cursor spot
                const dx = mouseX - currPan.x;
                const dy = mouseY - currPan.y;
                const nextPanX = mouseX - dx * (nextZoom / currZoom);
                const nextPanY = mouseY - dy * (nextZoom / currZoom);
                
                setZoom(nextZoom);
                setPan({ x: nextPanX, y: nextPanY });
            }
        };

        container.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleNativeWheel);
        };
    }, [isCanvasMovementLocked]);

    // Pinch-to-zoom is now managed via the modern custom `usePinchZoom` hook utilizing Pointer Events API.

    const updateDocPosition = async (id: string, fields: Partial<WhiteboardDoc>) => {
        try {
            const documentRef = doc(db, 'whiteboards', courseId, 'documents', id);
            await setDoc(documentRef, fields, { merge: true });
        } catch (err) {
            console.error('Error synchronizing document position drag:', err);
        }
    };

    // Clear board wipes out elements in a fast transaction
    const clearCanvasStrokes = () => {
        setShowClearConfirm(true);
    };

    const executeClearCanvasStrokes = async () => {
        try {
            const strokesSnap = await getDocs(collection(db, 'whiteboards', courseId, 'strokes'));
            const docsSnap = await getDocs(collection(db, 'whiteboards', courseId, 'documents'));

            const previousStrokes: Stroke[] = [];
            strokesSnap.forEach(d => {
                previousStrokes.push({ id: d.id, ...d.data() } as Stroke);
            });
            const previousDocs: WhiteboardDoc[] = [];
            docsSnap.forEach(d => {
                previousDocs.push({ id: d.id, ...d.data() } as WhiteboardDoc);
            });

            const batch = writeBatch(db);
            strokesSnap.forEach((doc) => batch.delete(doc.ref));
            docsSnap.forEach((doc) => batch.delete(doc.ref));
            
            await batch.commit();

            pushToHistory({
                type: 'clear_board',
                targetType: 'board',
                targetId: 'board',
                beforeState: { strokes: previousStrokes, documents: previousDocs },
                afterState: null
            });

            setStrokes([]);
            setBoardDocs([]);
        } catch (e) {
            console.error('Error wiping whiteboard:', e);
        }
    };

    // Record whiteboard frame updates while active
    useEffect(() => {
        if (!isRecording || !recordingStartTime) return;

        const offsetMs = Date.now() - recordingStartTime;

        const recStrokes = strokes.map(s => ({
            id: s.id,
            points: s.points,
            color: s.color,
            size: s.size,
            type: s.type
        }));

        const recDocs = boardDocs.map(d => ({
            id: d.id,
            name: d.name,
            url: d.url,
            x: d.x,
            y: d.y,
            width: d.width,
            height: d.height,
            scale: d.scale
        }));

        setRecordingFrames((prev) => [
            ...prev,
            {
                offsetMs,
                strokes: recStrokes,
                boardDocs: recDocs
            }
        ]);
    }, [strokes, boardDocs, isRecording, recordingStartTime]);

    const startRecording = async () => {
        try {
            // Get microphone stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((err) => {
                console.error("Microphone permission denied:", err);
                alert("Para guardar tu explicación de audio, se requiere acceso al micrófono. Grabaremos únicamente las acciones visuales de la pizarra.");
                return null;
            });

            const startTime = Date.now();
            setRecordingStartTime(startTime);
            recordedChunksRef.current = [];
            
            // Re-map current strokes to record initial frame
            const initialStrokes = strokes.map(s => ({
                id: s.id,
                points: s.points,
                color: s.color,
                size: s.size,
                type: s.type
            }));
            
            const initialDocs = boardDocs.map(d => ({
                id: d.id,
                name: d.name,
                url: d.url,
                x: d.x,
                y: d.y,
                width: d.width,
                height: d.height,
                scale: d.scale
            }));

            // Save initial frame
            setRecordingFrames([{
                offsetMs: 0,
                strokes: initialStrokes,
                boardDocs: initialDocs
            }]);

            if (stream) {
                micStreamRef.current = stream;
                let mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported('audio/webm')) {
                    mimeType = 'audio/ogg';
                }
                
                const mediaRecorder = new MediaRecorder(stream, { mimeType });
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        recordedChunksRef.current.push(e.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    await handleSaveRecordingPayload();
                };

                mediaRecorder.start(100); // chunk every 100ms
            } else {
                mediaRecorderRef.current = null;
                // Since there is no audio stream to stop and trigger onstop, we will handle save triggers manually on stopRecording
            }

            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording: ", err);
        }
    };

    const stopRecording = () => {
        if (!isRecording) return;
        
        setIsSavingRecording(true);
        setIsRecording(false);

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        } else {
            // No audio recorder active (video frame recording only)
            handleSaveRecordingPayload();
        }

        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }
    };

    const handleSaveRecordingPayload = async () => {
        const recordingDuration = Date.now() - (recordingStartTime || Date.now());
        const recordingId = `recording_${Date.now()}`;
        const titlePrompt = window.prompt("Introduce un título para esta grabación:", `Clase de repaso - ${new Date().toLocaleDateString()}`);
        const finalTitle = titlePrompt?.trim() || `Clase de repaso - ${new Date().toLocaleDateString()}`;

        let audioUrl = '';

        // If audio chunks exist, compile them and try uploading to Firebase Storage or base64 DataURL
        if (recordedChunksRef.current.length > 0) {
            const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
            
            try {
                // Import storage features dynamically
                const { ref: sRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
                const fileRef = sRef(storage, `recordings/${courseId}/${recordingId}.webm`);
                
                console.log("Uploading audio bytes to Firebase Storage...");
                const uploadResult = await uploadBytes(fileRef, audioBlob);
                audioUrl = await getDownloadURL(uploadResult.ref);
                console.log("Uploaded successfully. Audio download URL:", audioUrl);
            } catch (storageErr) {
                console.warn("Storage upload failed (possibly rules/config issues), falling back to Base64 in document: ", storageErr);
                
                // Base64 conversion fallback
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                await new Promise<void>((resolve) => {
                    reader.onloadend = () => {
                        audioUrl = reader.result as string;
                        resolve();
                    };
                });
            }
        }

        try {
            console.log("Saving final metadata and frames database document...");
            const recordingData = {
                id: recordingId,
                courseId,
                title: finalTitle,
                createdAt: new Date().toISOString(),
                durationMs: recordingDuration,
                recordedBy: user?.name || 'Profesor',
                frames: recordingFrames,
                audioUrl: audioUrl || null
            };

            // Add to classRecordings collection
            await setDoc(doc(db, 'classRecordings', recordingId), recordingData);

            // Trigger automatic download of the .aula file on the device
            try {
                const fileContent = JSON.stringify(recordingData, null, 2);
                const blob = new Blob([fileContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Grabacion_Pizarra_${finalTitle.replace(/\s+/g, '_')}.aula`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (downloadErr) {
                console.error("Error trigger automatic download of .aula file:", downloadErr);
            }

            alert("¡Grabación guardada con éxito! Se ha descargado automáticamente en tu dispositivo como archivo '.aula' y ya está disponible para los alumnos en 'Repeticiones de Clase'.");
        } catch (err) {
            console.error("Error committing ClassRecording document: ", err);
            
            // Still allow local download even if database save fails
            try {
                const fallbackData = {
                    id: recordingId,
                    courseId,
                    title: finalTitle,
                    createdAt: new Date().toISOString(),
                    durationMs: recordingDuration,
                    recordedBy: user?.name || 'Profesor',
                    frames: recordingFrames,
                    audioUrl: audioUrl || null
                };
                const fileContent = JSON.stringify(fallbackData, null, 2);
                const blob = new Blob([fileContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Grabacion_Pizarra_${finalTitle.replace(/\s+/g, '_')}.aula`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                alert("La grabación se ha descargado en tu dispositivo como archivo '.aula' (aunque no se pudo guardar en la base de datos de la plataforma).");
            } catch (downloadErr) {
                alert("No se pudo guardar la grabación en la base de datos ni descargarla localmente.");
            }
        } finally {
            setIsSavingRecording(false);
            setRecordingStartTime(null);
            setRecordingFrames([]);
            recordedChunksRef.current = [];
        }
    };

    const handleBoardClick = () => {
        if (wasFullScreenBeforeUpload.current && !document.fullscreenElement && boardRef.current && boardRef.current.isConnected) {
            const el = boardRef.current as any;
            const requestFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
            if (typeof requestFs === 'function') {
                requestFs.call(el)
                    .then(() => {
                        wasFullScreenBeforeUpload.current = false;
                    })
                    .catch((err: any) => {
                        console.warn("Could not restore fullscreen on click:", err);
                    });
            }
        }
    };

    const whiteboardRender = (
        <div 
            id="whiteboard-container" 
            ref={boardRef}
            onClick={handleBoardClick}
            className={`flex flex-col bg-white dark:bg-slate-800 border dark:border-slate-700/80 
                ${isVisualFullScreen ? 'fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] h-[100dvh] w-[100dvw] m-0 rounded-none shadow-none pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]' : onClose ? ('border-0 rounded-none my-0 shadow-none ' + containerHeight) : ('rounded-2xl shadow-md my-3 ' + containerHeight)} 
                overflow-hidden relative transition-all duration-300 whiteboard-container overscroll-none select-none`}
            style={{ touchAction: 'none', overscrollBehavior: 'none' }}
        >
            {/* Elegant Floating Toast Notification */}
            {toastMessage && (
                <div 
                    id="whiteboard-toast"
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] bg-indigo-950/95 dark:bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-indigo-500/20 dark:border-slate-700/50 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 select-none pointer-events-none max-w-[320px] sm:max-w-md text-center transition-all duration-300"
                >
                    {toastMessage}
                </div>
            )}
            {/* Header Panel */}
            <div className={`bg-slate-50 dark:bg-slate-750 border-b dark:border-slate-700 flex items-center justify-between gap-2 flex-shrink-0 z-20 transition-all ${isVisualFullScreen ? 'px-2 py-1.5 md:px-4 md:py-3' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {isPresentationMode ? (
                        <div className="p-1 px-2.5 rounded bg-indigo-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm flex-shrink-0 animate-pulse">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Modo Presentación</span>
                        </div>
                    ) : (
                        <>
                            <div className="p-1 px-2.5 rounded bg-indigo-500 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm flex-shrink-0">
                                <Activity className="w-3.5 h-3.5 animate-pulse" />
                                <span className="hidden sm:inline">Pizarra Digital Grupal</span>
                                <span className="inline sm:hidden">Pizarra</span>
                            </div>
                            {isActive && (
                                <span className="text-[10px] text-green-500 font-bold uppercase animate-pulse flex items-center gap-1 flex-shrink-0">
                                    ● Emitiendo
                                </span>
                            )}
                            {isActive && (
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border flex-shrink-0 ${
                                    isWsConnected 
                                    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/20' 
                                    : 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/20'
                                }`} title={isWsConnected ? "Conexión WebSocket fluida de ultra-baja latencia (60fps)" : "Buscando WebSocket. Conexión de respaldo en la nube activada."}>
                                    {isWsConnected ? '⚡ Tiempo Real' : '☁️ Respaldo DB'}
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Size toggle controls */}
                {isActive && !isVisualFullScreen && !isPresentationMode && (
                    <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setBoardSize('compact')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                boardSize === 'compact'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
                            }`}
                            title="Pizarra Compacta (Ahorro de espacio)"
                        >
                            Minimizado
                        </button>
                        <button
                            type="button"
                            onClick={() => setBoardSize('normal')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                boardSize === 'normal'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
                            }`}
                            title="Tamaño Estándar (Recomendado)"
                        >
                            Estándar
                        </button>
                        <button
                            type="button"
                            onClick={() => setBoardSize('expanded')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                boardSize === 'expanded'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
                            }`}
                            title="Dibujo Amplio"
                        >
                            Grande
                        </button>
                    </div>
                )}
            
                {/* Switch toggler exclusively for Teachers */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[65%] sm:max-w-[80%] flex-nowrap py-0.5 scrollbar-none flex-shrink-0">
                    <button
                        onClick={() => {
                            if (!isPresentationMode) {
                                setSelectedStrokeId(null);
                                setSelectedDocId(null);
                            }
                            setIsPresentationMode(!isPresentationMode);
                        }}
                        className={`p-2 rounded-lg transition border flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                            isPresentationMode 
                            ? 'bg-amber-500 border-amber-600 hover:bg-amber-600 text-white font-extrabold shadow-sm' 
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400'
                        }`}
                        title={isPresentationMode ? "Salir del modo presentación sin distracciones" : "Entrar al modo presentación (Ocultar herramientas y paneles)"}
                    >
                        {isPresentationMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="text-[10px] font-bold hidden sm:inline">
                            {isPresentationMode ? 'Salir Presentación' : 'Modo Presentación'}
                        </span>
                    </button>

                    {!isPresentationMode && (
                        <button
                            onClick={toggleToolbar}
                            className={`p-2 rounded-lg transition border flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                !showToolbar 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900' 
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400'
                            }`}
                            title={showToolbar ? "Ocultar barra de herramientas de dibujo" : "Mostrar barra de herramientas de dibujo"}
                        >
                            {!showToolbar ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <span className="text-[10px] font-bold hidden sm:inline">
                                {showToolbar ? 'Ocultar Herramientas' : 'Mostrar Herramientas'}
                            </span>
                        </button>
                    )}

                    {!isPresentationMode && (
                        <button
                            onClick={toggleFloatingMenu}
                            className={`p-2 rounded-lg transition border flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                !showFloatingMenu 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900 animate-pulse' 
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400'
                            }`}
                            title={showFloatingMenu ? "Desactivar/Ocultar menú flotante de edición" : "Activar/Mostrar menú flotante de edición"}
                        >
                            <Sliders className={`w-4 h-4 ${showFloatingMenu ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-bold hidden sm:inline">
                                {showFloatingMenu ? 'Ocultar Menú Edición' : 'Mostrar Menú Edición'}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition border border-slate-200 dark:border-slate-600 flex-shrink-0 cursor-pointer"
                        title={isVisualFullScreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                        {isVisualFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    {!isPresentationMode && (
                        <>
                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition border border-slate-200 dark:border-slate-600 flex-shrink-0 cursor-pointer"
                                title="Instrucciones de uso"
                            >
                                <HelpCircle className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsLocked(!isLocked)}
                                className={`p-2 rounded-lg transition border border-slate-200 dark:border-slate-600 flex-shrink-0 cursor-pointer ${isLocked ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-white dark:bg-slate-700 text-slate-500 hover:text-indigo-600'}`}
                                title={isLocked ? "Desbloquear edición" : "Bloquear edición"}
                            >
                                <Lock className="w-4 h-4" />
                            </button>
                            {true && (
                                <>
                                    <button
                                        onClick={exportBoardAsImage}
                                        className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition border border-indigo-100 dark:border-indigo-900 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                                        title="Exportar pizarra como imagen (PNG)"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        <span className="text-[10px] font-bold hidden sm:inline">Exportar Imagen</span>
                                    </button>
                                    <button
                                        onClick={exportBoardState}
                                        className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition border border-slate-200 dark:border-slate-600 flex-shrink-0 cursor-pointer"
                                        title="Exportar copia de seguridad (JSON)"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={clearCanvasStrokes}
                                        className="p-2 bg-white dark:bg-slate-700 rounded-lg text-rose-500 hover:text-rose-600 transition border border-slate-200 dark:border-slate-600 flex-shrink-0 cursor-pointer"
                                        title="Limpiar toda la pizarra"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            {isTeacher && isActive && (
                                <button
                                    type="button"
                                    onClick={toggleAllowStudentDrawing}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 border flex-shrink-0 ${
                                        allowStudentDrawing 
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' 
                                        : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                                    }`}
                                    title={allowStudentDrawing ? "Pulsar para revocar permisos de escritura a alumnos (modo solo lectura)" : "Pulsar para permitir que los alumnos escriban en la pizarra"}
                                >
                                    {allowStudentDrawing ? (
                                        <>
                                            <Edit className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            <span className="hidden sm:inline">Alumnos: Pueden Escribir</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                            <span className="hidden sm:inline">Alumnos: Solo Lectura</span>
                                        </>
                                    )}
                                </button>
                            )}
                            {isTeacher && isActive && (
                                <button
                                    type="button"
                                    disabled={isSavingRecording}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 border flex-shrink-0 ${
                                        isRecording 
                                        ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-450' 
                                        : 'bg-rose-600 border-rose-700 hover:bg-rose-700 text-white dark:bg-rose-700 dark:hover:bg-rose-800'
                                    }`}
                                >
                                    <span className="h-2 w-2 rounded-full bg-current"></span>
                                    <span>{isRecording ? 'Grabando...' : isSavingRecording ? 'Guardando...' : 'Grabar'}</span>
                                </button>
                            )}
                            {isTeacher ? (
                                <button
                                    onClick={toggleActivateBoard}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                                        isActive 
                                        ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                >
                                    {isActive ? (
                                        <>
                                            <X className="w-4 h-4" /> <span className="hidden sm:inline">Desactivar</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" /> <span className="hidden sm:inline">Activar</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>{isActive ? 'Estudiante' : 'Pizarra Off'}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Fixed Close Button on Far Right - Always Visible */}
                {onClose && (
                    <button
                        type="button"
                        onClick={handleRequestCloseBoard}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md border border-rose-500 active:scale-95 flex-shrink-0 z-30"
                        title="Cerrar Pizarra"
                    >
                        <X className="w-4 h-4" />
                        <span className="hidden xs:inline">Cerrar</span>
                    </button>
                )}
            </div>

            {/* Conditional Board State - Inactive vs Active */}
            <div className="flex-1 w-full h-full relative">
                { !isActive ? (
                    <div id="inactive-screen" className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 p-6 text-center">
                        <PenTool className="w-16 h-16 mb-4 text-indigo-500 opacity-60 animate-bounce" />
                        <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">La pizarra interactiva está inactiva</h4>
                        <p className="text-sm mt-2 max-w-md text-slate-600 dark:text-slate-300 leading-relaxed">
                            {isTeacher || (user as any)?.canInitiateWhiteboard === true
                                ? 'Activa la pizarra digital para poder dibujar, explicar conceptos e insertar documentos en tiempo real.'
                                : '🔒 El administrador ha configurado tu usuario para recibir pizarras. La pizarra está en espera de que un profesor o tutor la inicie.'}
                        </p>
                        {(isTeacher || (user as any)?.canInitiateWhiteboard === true) ? (
                            <button onClick={toggleActivateBoard} className="mt-5 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2">
                                <PenTool className="w-4 h-4" />
                                <span>Activar Pizarra Ahora</span>
                            </button>
                        ) : (
                            <div className="mt-5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-amber-500" />
                                <span>Esperando que un profesor o tutor inicie la pizarra...</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div id="active-screen" className="relative w-full h-full flex md:flex-row flex-col overflow-hidden">
                        {/* Floating Controls Sidebar - (Show to users with write permissions) */}
                        {!isPresentationMode && showToolbar && canUserDraw && (
                            <div id="floating-controls" className="flex md:flex-col flex-row gap-2 p-2.5 bg-white dark:bg-slate-800 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700/80 shadow-sm flex-shrink-0 z-20 overflow-x-auto overflow-y-hidden md:overflow-y-auto md:overflow-x-hidden items-center">
                                {/* Brush shapes */}
                                <button
                                    onClick={() => handleSetTool('pencil')}
                                    className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${tool === 'pencil' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750'}`}
                                    title="Lápiz de dibujo (P)"
                                >
                                    <PenTool className="w-5 h-5" />
                                </button>
                                
                                <button
                                    onClick={() => handleSetTool('marker')}
                                    className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${tool === 'marker' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750'}`}
                                    title="Marcador resaltador (M)"
                                >
                                    <Highlighter className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => handleSetTool('eraser')}
                                    className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${tool === 'eraser' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750'}`}
                                    title="Borrador manual (E)"
                                >
                                    <Eraser className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => handleSetTool('select')}
                                    className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${tool === 'select' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750'}`}
                                    title="Mover y redimensionar elementos (S)"
                                >
                                    <Move className="w-5 h-5" />
                                </button>
                                
                                <button
                                    onClick={() => handleSetTool('text')}
                                    className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${tool === 'text' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750'}`}
                                    title="Insertar texto (T)"
                                >
                                    <FileText className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={triggerAddFile}
                                    className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition flex-shrink-0 cursor-pointer"
                                    title="Insertar documento / imagen"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>

                                <div className="h-px md:w-8 w-px md:h-px bg-slate-200 dark:bg-slate-700/85 my-1 mx-2 md:mx-0 flex-shrink-0" />

                                {/* Formas geométricas */}
                                <button
                                    onClick={() => handleSetTool('rectangle')}
                                    className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${tool === 'rectangle' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750'}`}
                                    title="Dibujar rectángulo (R)"
                                >
                                    <Square className="w-5 h-5" />
                                </button>
                                
                                <button
                                    onClick={() => handleSetTool('circle')}
                                    className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${tool === 'circle' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750'}`}
                                    title="Dibujar círculo/óvalo (O)"
                                >
                                    <Circle className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => handleSetTool('line')}
                                    className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${tool === 'line' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750'}`}
                                    title="Dibujar línea recta (L)"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => handleSetTool('arrow')}
                                    className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 ${tool === 'arrow' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750'}`}
                                    title="Dibujar flecha (A)"
                                >
                                    <ArrowUpRight className="w-5 h-5" />
                                </button>

                                <div className="h-px md:w-8 w-px md:h-px bg-slate-200 dark:bg-slate-700/85 my-1 mx-2 md:mx-0 flex-shrink-0" />

                                {/* Color Selection Palette (Pre-selected colors + custom picker) */}
                                {(tool === 'pencil' || tool === 'marker' || tool === 'text' || ['rectangle', 'circle', 'line', 'arrow'].includes(tool)) && (
                                    <div className="flex md:flex-col items-center gap-1.5 p-1 flex-shrink-0">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setColor(c)}
                                                className={`w-5 h-5 rounded-full border shadow-sm transition transform hover:scale-110 flex-shrink-0 cursor-pointer ${color === c ? 'ring-2 ring-indigo-500 scale-105' : 'border-slate-300/40 dark:border-slate-600/50'}`}
                                                style={{ backgroundColor: c }}
                                                title={tool === 'text' ? "Cambiar color de texto" : "Cambiar color"}
                                            />
                                        ))}
                                        
                                        {/* Custom Picker with Conic Gradient border */}
                                        <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                                title="Selector de color personalizado"
                                            />
                                            <div 
                                                className="w-5 h-5 rounded-full shadow-sm transition transform hover:scale-110 flex items-center justify-center overflow-hidden border border-slate-300/40 dark:border-slate-600/50"
                                                style={{
                                                    background: 'conic-gradient(from 0deg, red, yellow, green, cyan, blue, magenta, red)',
                                                }}
                                            >
                                                <div 
                                                    className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
                                                    style={{ backgroundColor: color }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Brush Size presets */}
                                {(tool === 'pencil' || tool === 'marker' || tool === 'eraser' || tool === 'text' || ['rectangle', 'circle', 'line', 'arrow'].includes(tool)) && (
                                    <div className="hidden md:flex flex-col items-center gap-2 py-1.5 border-b border-slate-150 dark:border-slate-700/60 w-full flex-shrink-0">
                                        {((['rectangle', 'circle', 'line', 'arrow'].includes(tool) ? [2, 4, 6, 10] : tool === 'pencil' ? [1, 2, 4, 8] : tool === 'marker' ? [10, 20, 32] : tool === 'text' ? [14, 20, 28, 42] : [16, 32, 64])).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSize(s)}
                                                className={`rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                                    size === s 
                                                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold scale-110' 
                                                    : 'text-slate-400 hover:text-slate-600 hover:scale-105'
                                                }`}
                                                style={{ width: '22px', height: '22px' }}
                                                title={tool === 'text' ? `Tamaño de texto: ${s}px` : ['rectangle', 'circle', 'line', 'arrow'].includes(tool) ? `Grosor de forma: ${s}px` : `Grosor de trazo: ${s}px`}
                                            >
                                                <div 
                                                    className="rounded-full bg-current" 
                                                    style={{ 
                                                        width: `${Math.max(4, Math.min(15, s / (tool === 'eraser' ? 3.5 : tool === 'text' ? 1.5 : 1.5)))}px`, 
                                                        height: `${Math.max(4, Math.min(15, s / (tool === 'eraser' ? 3.5 : tool === 'text' ? 1.5 : 1.5)))}px` 
                                                    }} 
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex md:flex-col items-center gap-2 md:mt-1 flex-shrink-0">
                                    {/* Undo / Redo controls */}
                                    <div className="flex md:flex-col items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={undo}
                                            disabled={undoStack.length === 0}
                                            className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 border border-transparent ${undoStack.length > 0 ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750' : 'text-slate-300 dark:text-slate-600 opacity-50 cursor-not-allowed'}`}
                                            title="Deshacer (Ctrl+Z)"
                                        >
                                            <Undo className="w-5 h-5" />
                                        </button>

                                        <button
                                            onClick={redo}
                                            disabled={redoStack.length === 0}
                                            className={`p-2.5 rounded-xl transition cursor-pointer flex-shrink-0 border border-transparent ${redoStack.length > 0 ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750' : 'text-slate-300 dark:text-slate-600 opacity-50 cursor-not-allowed'}`}
                                            title="Rehacer (Ctrl+Y)"
                                        >
                                            <Redo className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="h-px md:w-8 w-px md:h-px bg-slate-200 dark:bg-slate-705/50 my-1 flex-shrink-0" />

                                    {/* Background Pattern Selector */}
                                    <div className="flex md:flex-col items-center gap-1.5 flex-shrink-0" title="Plantilla de fondo">
                                        <button
                                            onClick={() => changeBgPattern('blank')}
                                            className={`p-2 rounded-xl border transition cursor-pointer flex-shrink-0 flex items-center justify-center ${bgPattern === 'blank' ? 'bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-805/50' : 'border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750'}`}
                                            title="Papel: Blanco"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeDasharray="3 3" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => changeBgPattern('grid')}
                                            className={`p-2 rounded-xl border transition cursor-pointer flex-shrink-0 flex items-center justify-center ${bgPattern === 'grid' ? 'bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-805/50' : 'border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750'}`}
                                            title="Papel: Cuadriculado"
                                        >
                                            <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M3 9h18M3 15h18M9 3v18M15 3v18" strokeLinecap="round" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => changeBgPattern('dots')}
                                            className={`p-2 rounded-xl border transition cursor-pointer flex-shrink-0 flex items-center justify-center ${bgPattern === 'dots' ? 'bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-805/50' : 'border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750'}`}
                                            title="Papel: Puntos"
                                        >
                                            <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="currentColor">
                                                <circle cx="6" cy="6" r="1.5" />
                                                <circle cx="12" cy="6" r="1.5" />
                                                <circle cx="18" cy="6" r="1.5" />
                                                <circle cx="6" cy="12" r="1.5" />
                                                <circle cx="12" cy="12" r="1.5" />
                                                <circle cx="18" cy="12" r="1.5" />
                                                <circle cx="6" cy="18" r="1.5" />
                                                <circle cx="12" cy="18" r="1.5" />
                                                <circle cx="18" cy="18" r="1.5" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => changeBgPattern('simple-line')}
                                            className={`p-2 rounded-xl border transition cursor-pointer flex-shrink-0 flex items-center justify-center ${bgPattern === 'simple-line' ? 'bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-805/50' : 'border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750'}`}
                                            title="Papel: Línea Simple"
                                        >
                                            <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => changeBgPattern('double-line')}
                                            className={`p-2 rounded-xl border transition cursor-pointer flex-shrink-0 flex items-center justify-center ${bgPattern === 'double-line' ? 'bg-indigo-50 border-indigo-400 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-805/50' : 'border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750'}`}
                                            title="Papel: Pauta Caligrafía"
                                        >
                                            <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M3 6h18M3 10h18M3 15h18M3 19h18" strokeLinecap="round" strokeWidth="1" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="h-px md:w-8 w-px md:h-px bg-slate-200 dark:bg-slate-705/50 my-1 flex-shrink-0" />

                                    {selectedStrokeId && (
                                        <>
                                            <button
                                                onClick={deleteSelectedStroke}
                                                className="p-2.5 text-rose-500 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer flex-shrink-0 border border-rose-200 dark:border-rose-900"
                                                title="Eliminar trazo seleccionado"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <div className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-xl mt-2 w-full">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase">Propiedades</h4>
                                                
                                                {/* Color Palette */}
                                                <div className="flex items-center gap-2">
                                                    {COLORS.slice(0, 4).map((c) => (
                                                        <button
                                                            key={c}
                                                            onClick={() => updateSelectedStroke({ color: c })}
                                                            className={`w-6 h-6 rounded-full border border-slate-200 shadow-sm transition transform hover:scale-110 flex-shrink-0 cursor-pointer ${selectedStroke?.color === c ? 'ring-2 ring-indigo-500' : ''}`}
                                                            style={{ backgroundColor: c }}
                                                            title="Cambiar color del trazo"
                                                        />
                                                    ))}
                                                </div>

                                                {/* Size Slider */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] text-slate-400">Grosor: {selectedStroke?.size}px</label>
                                                    <input 
                                                        type="range" 
                                                        min="1" 
                                                        max="20" 
                                                        value={selectedStroke?.size || 4} 
                                                        onChange={(e) => updateSelectedStroke({ size: Number(e.target.value) })}
                                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        )}

                        {isTeacher && !isPresentationMode && !showToolbar && (
                            <button
                                onClick={toggleToolbar}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-xl shadow-xl flex items-center justify-center cursor-pointer transition transform hover:scale-105 border border-l-0 border-indigo-500"
                                title="Mostrar barra de herramientas"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                        )}

                        {/* Infinite Canvas/Draw Container */}
                        <div 
                            ref={canvasContainerRef}
                            onMouseMove={handleMouseMoveOrTouch}
                            onTouchMove={handleMouseMoveOrTouch}
                            onMouseLeave={handleMouseLeaveBoard}
                            className={`flex-1 w-full h-full relative overflow-hidden flex items-stretch select-none overscroll-none transition-colors duration-250 whiteboard-canvas-container ${getBoardBgStyle()}`}
                            style={{ touchAction: 'none', overscrollBehavior: 'none' }}
                        >
                            {/* Grid Background aesthetic */}
                            {bgPattern === 'blank' && (
                                <div 
                                    className="absolute inset-0 bg-grid dark:bg-grid-dark opacity-10" 
                                    onClick={() => {
                                        setSelectedStrokeId(null);
                                        setSelectedDocId(null);
                                    }}
                                />
                            )}

                            {/* TEXT INPUT overlay (1x scale, correctly positioned taking panel zoom/pan into account) */}
                            {isAddingText && (() => {
                                const textLines = textInput.split('\n');
                                const maxLineLength = Math.max(...textLines.map(l => l.length), 0);
                                // Calculate dynamically to bound the click-blocking footprint
                                const calculatedWidth = Math.max(160, Math.min(800, maxLineLength * (size * zoom * 0.55) + 32));
                                const calculatedHeight = Math.max(size * zoom * 1.5, textLines.length * (size * zoom * 1.25) + 20);
                                return (
                                    <textarea
                                        ref={textInputRef as any}
                                        className="absolute z-50 bg-white/15 dark:bg-slate-900/40 border-2 border-dashed border-indigo-500/80 rounded-lg shadow-sm outline-none focus:outline-none p-2 font-sans font-medium resize-none overflow-hidden select-text pointer-events-auto transition-all"
                                        style={{
                                            left: `${textPosition.x * zoom + pan.x}px`,
                                            top: `${textPosition.y * zoom + pan.y - (size * zoom * 0.5) - 8}px`, // adjust slightly for padding
                                            color: color,
                                            fontSize: `${size * zoom}px`,
                                            lineHeight: '1.25',
                                            width: `${calculatedWidth}px`,
                                            height: `${calculatedHeight}px`,
                                            caretColor: color,
                                            boxSizing: 'border-box'
                                        }}
                                        value={textInput}
                                        autoFocus
                                        placeholder="Escribe aquí..."
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onBlur={() => handleSaveText()}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSaveText();
                                            } else if (e.key === 'Escape') {
                                                setTextInput('');
                                                updateIsAddingText(false);
                                            }
                                        }}
                                    />
                                );
                            })()}

                            {/* EDIT TEXT INPUT overlay (1x scale, correctly positioned taking panel zoom/pan into account) */}
                            {editingTextId && (() => {
                                const stroke = strokes.find(s => s.id === editingTextId);
                                if (!stroke || stroke.type !== 'text') return null;
                                const strokeSize = stroke.size || 16;
                                const textLines = editingTextValue.split('\n');
                                const maxLineLength = Math.max(...textLines.map(l => l.length), 0);
                                const calculatedWidth = Math.max(160, Math.min(800, maxLineLength * (strokeSize * zoom * 0.55) + 32));
                                const calculatedHeight = Math.max(strokeSize * zoom * 1.5, textLines.length * (strokeSize * zoom * 1.25) + 20);
                                return (
                                    <textarea
                                        className="absolute z-50 bg-white/15 dark:bg-slate-900/40 border-2 border-dashed border-emerald-500/85 rounded-lg shadow-sm outline-none focus:outline-none p-2 font-sans font-medium resize-none overflow-hidden select-text pointer-events-auto transition-all"
                                        style={{
                                            left: `${stroke.points[0].x * zoom + pan.x}px`,
                                            top: `${stroke.points[0].y * zoom + pan.y - 8}px`, // align with top baseline of text
                                            color: stroke.color,
                                            fontSize: `${strokeSize * zoom}px`,
                                            lineHeight: '1.25',
                                            width: `${calculatedWidth}px`,
                                            height: `${calculatedHeight}px`,
                                            caretColor: stroke.color,
                                            boxSizing: 'border-box'
                                        }}
                                        value={editingTextValue}
                                        autoFocus
                                        placeholder="Editar texto..."
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onBlur={() => handleSaveEditedText()}
                                        onChange={(e) => setEditingTextValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSaveEditedText();
                                            } else if (e.key === 'Escape') {
                                                handleSaveEditedText();
                                            }
                                        }}
                                        ref={(el) => {
                                            if (el) {
                                                el.focus();
                                                if (el.selectionStart === 0 && el.selectionEnd === 0) {
                                                    el.selectionStart = el.value.length;
                                                    el.selectionEnd = el.value.length;
                                                }
                                            }
                                        }}
                                    />
                                );
                            })()}

                            {/* Zoomable & Pannable Canvas Wrapper */}
                            <div
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                    transformOrigin: '0 0',
                                }}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                            >
                                <div className="w-full h-full relative pointer-events-auto">

                            {/* Live Cursors for All Active Participants */}
                            {Object.values(participantCursors).map(cursor => {
                                if (!cursor.active || (Date.now() - cursor.updatedAt > 10000)) return null;
                                const isTeacherCursor = cursor.isTeacher;
                                const badgeBg = isTeacherCursor ? 'bg-rose-600' : 'bg-teal-600';
                                const dotPingBg = isTeacherCursor ? 'bg-rose-400' : 'bg-teal-400';
                                const dotMainBg = isTeacherCursor ? 'bg-rose-600' : 'bg-teal-600';

                                return (
                                    <div 
                                        key={cursor.id}
                                        style={{
                                            position: 'absolute',
                                            left: `${cursor.x}px`,
                                            top: `${cursor.y}px`,
                                            transform: 'translate(-2px, -2px)',
                                            pointerEvents: 'none',
                                            zIndex: 50,
                                            transition: 'left 0.08s cubic-bezier(0.1, 0.8, 0.2, 1), top 0.08s cubic-bezier(0.1, 0.8, 0.2, 1)'
                                        }}
                                        className="flex flex-col items-start gap-1 select-none"
                                    >
                                        {/* Laser pointer / Cursor dot */}
                                        <div className="flex items-center justify-center">
                                            <span className="flex h-3 w-3 relative">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPingBg} opacity-75`}></span>
                                                <span className={`relative inline-flex rounded-full h-3 w-3 ${dotMainBg} border border-white shadow-lg`}></span>
                                            </span>
                                        </div>
                                        {/* Participant name badge */}
                                        <div className={`${badgeBg} text-white font-extrabold text-[9px] tracking-wider px-1.5 py-0.5 rounded-md shadow-md border border-white/20 flex items-center gap-1 select-none whitespace-nowrap`}>
                                            <PenTool className="w-2.5 h-2.5" />
                                            <span>{cursor.name || (isTeacherCursor ? 'Profesor' : 'Estudiante')}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Background Grid Pattern SVG (stays behind everything, including images) */}
                            <svg
                                preserveAspectRatio="xMidYMid meet"
                                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                            >
                                <defs>
                                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path 
                                            d="M 40 0 L 0 0 0 40" 
                                            fill="none" 
                                            stroke={getGridStrokeColor()} 
                                            strokeOpacity={gridOpacity} 
                                            strokeWidth={gridStrokeWidth} 
                                            className="transition-opacity duration-300"
                                            style={{ transition: 'stroke-opacity 300ms ease-in-out, opacity 300ms ease-in-out' }}
                                        />
                                    </pattern>
                                    <pattern id="dots-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <circle 
                                            cx="20" 
                                            cy="20" 
                                            r="1.25" 
                                            fill={getGridStrokeColor()} 
                                            fillOpacity={gridOpacity} 
                                            className="transition-opacity duration-300"
                                            style={{ transition: 'fill-opacity 300ms ease-in-out, opacity 300ms ease-in-out' }}
                                        />
                                    </pattern>
                                    <pattern id="simple-line-pattern" width="40" height="32" patternUnits="userSpaceOnUse">
                                        <path 
                                            d="M 0 32 L 40 32" 
                                            fill="none" 
                                            stroke={getGridStrokeColor()} 
                                            strokeOpacity={gridOpacity} 
                                            strokeWidth={gridStrokeWidth} 
                                            className="transition-opacity duration-300"
                                            style={{ transition: 'stroke-opacity 300ms ease-in-out, opacity 300ms ease-in-out' }}
                                        />
                                    </pattern>
                                    <pattern id="double-line-pattern" width="40" height="48" patternUnits="userSpaceOnUse">
                                        <path 
                                            d="M 0 16 L 40 16 M 0 32 L 40 32" 
                                            fill="none" 
                                            stroke={getGridStrokeColor()} 
                                            strokeOpacity={gridOpacity} 
                                            strokeWidth={gridStrokeWidth} 
                                            className="transition-opacity duration-300"
                                            style={{ transition: 'stroke-opacity 300ms ease-in-out, opacity 300ms ease-in-out' }}
                                        />
                                    </pattern>
                                </defs>
                                <rect 
                                    x="-50000" 
                                    y="-50000" 
                                    width="100000" 
                                    height="100000" 
                                    fill={
                                        bgPattern === 'grid' 
                                            ? 'url(#grid-pattern)' 
                                            : bgPattern === 'dots' 
                                            ? 'url(#dots-pattern)' 
                                            : bgPattern === 'simple-line'
                                            ? 'url(#simple-line-pattern)'
                                            : bgPattern === 'double-line'
                                            ? 'url(#double-line-pattern)'
                                            : 'transparent'
                                    } 
                                />
                            </svg>

                            {/* Document Underlays (drags & rescales) */}
                            <div className={`absolute inset-0 pointer-events-none ${isTeacher && tool === 'select' ? 'z-30' : 'z-10'}`}>
                                {boardDocs.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            position: 'absolute',
                                            left: `${item.x}px`,
                                            top: `${item.y}px`,
                                            width: `${item.width}px`,
                                            height: `${item.height}px`,
                                            touchAction: 'none'
                                        }}
                                        className={`pointer-events-auto bg-white dark:bg-slate-900 border dark:border-slate-700/80 rounded-xl shadow-lg overflow-hidden group select-none transition-all duration-150 ${
                                            isTeacher && tool === 'select'
                                                ? (selectedDocId === item.id
                                                    ? 'ring-3 ring-indigo-500 shadow-2xl scale-[1.01] z-20'
                                                    : 'ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-indigo-400 hover:shadow-xl cursor-move')
                                                : ''
                                        }`}
                                        onMouseDown={(e) => {
                                            if (isTeacher && tool === 'select') {
                                                e.stopPropagation();
                                                setSelectedDocId(item.id);
                                                setSelectedStrokeId(null);
                                                handleStartDrag(e, item.id, item.x, item.y);
                                            }
                                        }}
                                        onTouchStart={(e) => {
                                            if (isTeacher && tool === 'select') {
                                                e.stopPropagation();
                                                setSelectedDocId(item.id);
                                                setSelectedStrokeId(null);
                                                handleStartDrag(e, item.id, item.x, item.y);
                                            }
                                        }}
                                    >
                                        {/* Document Header Panel */}
                                        <div 
                                            className="h-7 bg-slate-100 dark:bg-slate-800 border-b dark:border-slate-700 flex items-center justify-between px-2 cursor-move"
                                            onMouseDown={(e) => handleStartDrag(e, item.id, item.x, item.y)}
                                            onTouchStart={(e) => handleStartDrag(e, item.id, item.x, item.y)}
                                        >
                                            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 truncate min-w-0 pr-2">
                                                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="truncate pr-1">{item.name}</span>
                                            </div>
                                            {isTeacher && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        try {
                                                            pushToHistory({
                                                                type: 'delete_doc',
                                                                targetType: 'doc',
                                                                targetId: item.id,
                                                                beforeState: item,
                                                                afterState: null
                                                            });
                                                            await deleteDoc(doc(db, 'whiteboards', courseId, 'documents', item.id));
                                                            if (selectedDocId === item.id) {
                                                                setSelectedDocId(null);
                                                            }
                                                        } catch (e) {
                                                            console.error(e);
                                                        }
                                                    }}
                                                    className="p-0.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded"
                                                    title="Eliminar documento"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Document contents (Image or preview) */}
                                        <div className="w-full h-[calc(100%-1.75rem)] relative overflow-hidden bg-slate-50 flex items-center justify-center p-1.5 select-none font-sans text-xs">
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                referrerPolicy="no-referrer"
                                                className="max-w-full max-h-full object-contain rounded select-none pointer-events-none"
                                                draggable={false}
                                            />

                                            {/* Resize handles inside the image area container at all 4 corners */}
                                            {isTeacher && tool === 'select' && selectedDocId === item.id && (
                                                <>
                                                    {/* Top-Left Handle */}
                                                    <div
                                                        onMouseDown={(e) => handleStartResize(e, item, 'top-left')}
                                                        onTouchStart={(e) => handleStartResize(e, item, 'top-left')}
                                                        className="absolute top-1.5 left-1.5 w-5 h-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-nw-resize z-25 active:scale-95 border-2 border-white transition-all duration-150 touch-none"
                                                        title="Redimensionar desde la esquina superior izquierda"
                                                    />
                                                    {/* Top-Right Handle */}
                                                    <div
                                                        onMouseDown={(e) => handleStartResize(e, item, 'top-right')}
                                                        onTouchStart={(e) => handleStartResize(e, item, 'top-right')}
                                                        className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-ne-resize z-25 active:scale-95 border-2 border-white transition-all duration-150 touch-none"
                                                        title="Redimensionar desde la esquina superior derecha"
                                                    />
                                                    {/* Bottom-Left Handle */}
                                                    <div
                                                        onMouseDown={(e) => handleStartResize(e, item, 'bottom-left')}
                                                        onTouchStart={(e) => handleStartResize(e, item, 'bottom-left')}
                                                        className="absolute bottom-1.5 left-1.5 w-5 h-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-sw-resize z-25 active:scale-95 border-2 border-white transition-all duration-150 touch-none"
                                                        title="Redimensionar desde la esquina inferior izquierda"
                                                    />
                                                    {/* Bottom-Right Handle */}
                                                    <div
                                                        onMouseDown={(e) => handleStartResize(e, item, 'bottom-right')}
                                                        onTouchStart={(e) => handleStartResize(e, item, 'bottom-right')}
                                                        className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-se-resize z-25 active:scale-95 border-2 border-white transition-all duration-150 touch-none"
                                                        title="Redimensionar desde la esquina inferior derecha"
                                                    >
                                                        <Maximize2 className="w-2.5 h-2.5 text-white transform rotate-95" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Interactive SVG layer for dynamic paths */}
                            <svg
                                preserveAspectRatio="xMidYMid meet"
                                onPointerDown={handleStartDrawing}
                                onPointerMove={handleDrawingMove}
                                onPointerUp={handleStopDrawing}
                                onPointerCancel={handleStopDrawing}
                                onPointerLeave={handleStopDrawing}
                                onDoubleClick={(e) => {
                                    if (!isTeacher || isLocked || isPresentationMode) return;
                                    const coords = getCoordinatesFromEvent(e);
                                    if (coords) {
                                        if (isAddingTextRef.current) {
                                            handleSaveText();
                                        }
                                        if (editingTextId) {
                                            handleSaveEditedText();
                                        }
                                        setTextPosition(coords);
                                        setTool('text');
                                        updateIsAddingText(true);
                                    }
                                }}
                                className={`flex-1 w-full h-full relative z-20 outline-none whiteboard-svg-canvas overscroll-none select-none ${
                                    isTeacher && tool === 'eraser' 
                                    ? 'cursor-crosshair' 
                                    : isTeacher 
                                    ? 'cursor-edit' 
                                    : ''
                                }`}                
                                style={{ pointerEvents: 'auto', touchAction: 'none', overscrollBehavior: 'none' }}
                            >
                                <defs>
                                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path 
                                            d="M 40 0 L 0 0 0 40" 
                                            fill="none" 
                                            stroke={getGridStrokeColor()} 
                                            strokeOpacity={gridOpacity} 
                                            strokeWidth={gridStrokeWidth} 
                                            className="transition-opacity duration-300"
                                            style={{ transition: 'stroke-opacity 300ms ease-in-out, opacity 300ms ease-in-out' }}
                                        />
                                    </pattern>
                                    <pattern id="dots-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <circle 
                                            cx="20" 
                                            cy="20" 
                                            r="1.25" 
                                            fill={getGridStrokeColor()} 
                                            fillOpacity={gridOpacity} 
                                            className="transition-opacity duration-300"
                                            style={{ transition: 'fill-opacity 300ms ease-in-out, opacity 300ms ease-in-out' }}
                                        />
                                    </pattern>
                                    <pattern id="simple-line-pattern" width="40" height="32" patternUnits="userSpaceOnUse">
                                        <path 
                                            d="M 0 32 L 40 32" 
                                            fill="none" 
                                            stroke={getGridStrokeColor()} 
                                            strokeOpacity={gridOpacity} 
                                            strokeWidth={gridStrokeWidth} 
                                            className="transition-opacity duration-300"
                                            style={{ transition: 'stroke-opacity 300ms ease-in-out, opacity 300ms ease-in-out' }}
                                        />
                                    </pattern>
                                    <pattern id="double-line-pattern" width="40" height="48" patternUnits="userSpaceOnUse">
                                        <path 
                                            d="M 0 16 L 40 16 M 0 32 L 40 32" 
                                            fill="none" 
                                            stroke={getGridStrokeColor()} 
                                            strokeOpacity={gridOpacity} 
                                            strokeWidth={gridStrokeWidth} 
                                            className="transition-opacity duration-300"
                                            style={{ transition: 'stroke-opacity 300ms ease-in-out, opacity 300ms ease-in-out' }}
                                        />
                                    </pattern>
                                </defs>
                                
                                <rect 
                                    x="-50000" 
                                    y="-50000" 
                                    width="100000" 
                                    height="100000" 
                                    fill="transparent" 
                                    onClick={() => {
                                        setSelectedStrokeId(null);
                                        setSelectedDocId(null);
                                    }}
                                    className="cursor-default"
                                />

                                {/* Render completed drawing lines */}
                                {[...strokes]
                                    .sort((a, b) => {
                                        if (a.type === 'text' && b.type !== 'text') return 1;
                                        if (a.type !== 'text' && b.type === 'text') return -1;
                                        return 0;
                                    }).map((stroke) => {
                                        if (stroke.type === 'text') {
                                            const fontSize = stroke.size || 16;
                                            const lines = stroke.textContent ? stroke.textContent.split('\n') : [''];
                                            const maxChars = Math.max(...lines.map(line => line.length));
                                            const estimatedWidth = Math.max(40, maxChars * fontSize * 0.55);
                                            const estimatedHeight = Math.max(fontSize, lines.length * fontSize * 1.2);
                                            return (
                                                <g
                                                    key={stroke.id}
                                                    style={{ pointerEvents: 'auto', cursor: (tool === 'select' || tool === 'text') ? 'pointer' : (tool === 'eraser' && isTeacher) ? 'pointer' : 'default' }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        if (tool === 'eraser' && isTeacher) {
                                                            pushToHistory({
                                                                type: 'delete_stroke',
                                                                targetType: 'stroke',
                                                                targetId: stroke.id,
                                                                beforeState: stroke,
                                                                afterState: null
                                                            });
                                                            deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', stroke.id));
                                                            if (selectedStrokeId === stroke.id) {
                                                                setSelectedStrokeId(null);
                                                            }
                                                            return;
                                                        }

                                                        if (isAddingTextRef.current) {
                                                            handleSaveText();
                                                        }
                                                        if (editingTextId && editingTextId !== stroke.id) {
                                                            handleSaveEditedText();
                                                        }

                                                        // If clicking on an existing text block, force select and switch to select tool
                                                        if (tool === 'text') {
                                                            setTool('select');
                                                            handleSelectStroke(stroke.id, true);
                                                        } else {
                                                            handleSelectStroke(stroke.id);
                                                        }

                                                        if ((tool === 'select' || tool === 'text') && editingTextId !== stroke.id) {
                                                            e.preventDefault();
                                                            setActiveDragId(stroke.id);
                                                            setActiveDragType('stroke');
                                                            setDragOffset({
                                                                x: e.clientX - stroke.points[0].x,
                                                                y: e.clientY - stroke.points[0].y,
                                                                clientX: e.clientX,
                                                                clientY: e.clientY
                                                            });
                                                            setActionBeforeState({ points: [...stroke.points] });
                                                        }
                                                    }}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                        if (tool === 'eraser' && isTeacher) {
                                                            pushToHistory({
                                                                type: 'delete_stroke',
                                                                targetType: 'stroke',
                                                                targetId: stroke.id,
                                                                beforeState: stroke,
                                                                afterState: null
                                                            });
                                                            deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', stroke.id));
                                                            if (selectedStrokeId === stroke.id) {
                                                                setSelectedStrokeId(null);
                                                            }
                                                            return;
                                                        }

                                                        if (isAddingTextRef.current) {
                                                            handleSaveText();
                                                        }
                                                        if (editingTextId && editingTextId !== stroke.id) {
                                                            handleSaveEditedText();
                                                        }

                                                        // If touching an existing text block, force select and switch to select tool
                                                        if (tool === 'text') {
                                                            setTool('select');
                                                            handleSelectStroke(stroke.id, true);
                                                        } else {
                                                            handleSelectStroke(stroke.id);
                                                        }

                                                        if ((tool === 'select' || tool === 'text') && editingTextId !== stroke.id) {
                                                            if (e.cancelable) e.preventDefault();
                                                            setActiveDragId(stroke.id);
                                                            setActiveDragType('stroke');
                                                            const touch = e.touches[0];
                                                            setDragOffset({
                                                                x: touch.clientX - stroke.points[0].x,
                                                                y: touch.clientY - stroke.points[0].y,
                                                                clientX: touch.clientX,
                                                                clientY: touch.clientY
                                                             });
                                                            setActionBeforeState({ points: [...stroke.points] });
                                                        }
                                                    }}
                                                    onDoubleClick={(e) => {
                                                        if (!isTeacher || isLocked) return;
                                                        e.stopPropagation();
                                                        if (isAddingTextRef.current) {
                                                            handleSaveText();
                                                        }
                                                        setEditingTextId(stroke.id);
                                                        setEditingTextValue(stroke.textContent || '');
                                                        setSelectedStrokeId(stroke.id);
                                                     }}
                                                >
                                                    {editingTextId !== stroke.id && (
                                                        <>
                                                            {/* Invisible clickable backing to make selection effortless */}
                                                            <rect
                                                                x={stroke.points[0]?.x || 0}
                                                                y={stroke.points[0]?.y || 0}
                                                                width={estimatedWidth}
                                                                height={estimatedHeight} pointerEvents="all"
                                                                fill="transparent"
                                                            />
                                                            <text
                                                                dominantBaseline="hanging"
                                                                className="select-none font-sans font-medium"
                                                                x={stroke.points[0]?.x || 0}
                                                                y={stroke.points[0]?.y || 0}
                                                                fill={stroke.color}
                                                                fontSize={fontSize}
                                                            >
                                                                {lines.map((line, idx) => (
                                                                    <tspan
                                                                        key={idx}
                                                                        x={stroke.points[0]?.x || 0}
                                                                        dy={idx === 0 ? 0 : fontSize * 1.2}
                                                                    >
                                                                        {line || ' '}
                                                                    </tspan>
                                                                ))}
                                                            </text>
                                                        </>
                                                    )}
                                                </g>
                                            );
                                        }

                                        if (stroke.points.length < 2) return null;
                                        
                                        const points = stroke.points as { x: number; y: number; p?: number }[];
                                        const hasPressure = isPressureSensitive && points.some(pt => pt.p !== undefined && pt.p > 0 && pt.p !== 0.5);
                                        const isFreehand = ['pencil', 'pen', 'marker', 'eraser'].includes(stroke.type);
                                        const strokeOpacity = selectedStrokeId === stroke.id ? 1 : (stroke.type === 'marker' ? 0.45 : 1);
                                        const baseSize = selectedStrokeId === stroke.id ? stroke.size + 6 : stroke.size;

                                        if (hasPressure && isFreehand) {
                                            // Render variable-thickness connected segments
                                            return (
                                                <g
                                                    key={stroke.id}
                                                    className={tool === 'select' ? 'cursor-pointer hover:opacity-90 transition-opacity' : (tool === 'eraser' && isTeacher) ? 'cursor-pointer hover:opacity-60 transition-opacity' : ''}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        if (tool === 'eraser' && isTeacher) {
                                                            pushToHistory({
                                                                type: 'delete_stroke',
                                                                targetType: 'stroke',
                                                                targetId: stroke.id,
                                                                beforeState: stroke,
                                                                afterState: null
                                                            });
                                                            deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', stroke.id));
                                                            if (selectedStrokeId === stroke.id) {
                                                                setSelectedStrokeId(null);
                                                            }
                                                            return;
                                                        }

                                                        handleSelectStroke(stroke.id);
                                                        if (tool === 'select') {
                                                            setActiveDragId(stroke.id);
                                                            setActiveDragType('stroke');
                                                            setDragOffset({
                                                                x: e.clientX - stroke.points[0].x,
                                                                y: e.clientY - stroke.points[0].y,
                                                                clientX: e.clientX,
                                                                clientY: e.clientY
                                                            });
                                                            setActionBeforeState({ points: [...stroke.points] });
                                                        }
                                                    }}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                        if (tool === 'eraser' && isTeacher) {
                                                            pushToHistory({
                                                                type: 'delete_stroke',
                                                                targetType: 'stroke',
                                                                targetId: stroke.id,
                                                                beforeState: stroke,
                                                                afterState: null
                                                            });
                                                            deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', stroke.id));
                                                            if (selectedStrokeId === stroke.id) {
                                                                setSelectedStrokeId(null);
                                                            }
                                                            return;
                                                        }

                                                        handleSelectStroke(stroke.id);
                                                        if (tool === 'select') {
                                                            setActiveDragId(stroke.id);
                                                            setActiveDragType('stroke');
                                                            const touch = e.touches[0];
                                                            setDragOffset({
                                                                x: touch.clientX - stroke.points[0].x,
                                                                y: touch.clientY - stroke.points[0].y,
                                                                clientX: touch.clientX,
                                                                clientY: touch.clientY
                                                            });
                                                            setActionBeforeState({ points: [...stroke.points] });
                                                        }
                                                    }}
                                                >
                                                    {/* Invisible clickable backing target path for effortless selection */}
                                                    <path
                                                        d={getStrokePathDefinition(points, stroke.type, stroke.size)}
                                                        fill="none"
                                                        stroke="transparent"
                                                        strokeWidth={stroke.size + 14}
                                                        style={{ pointerEvents: (tool === 'select' || tool === 'eraser') ? 'auto' : 'none' }}
                                                    />
                                                    {/* Beautiful connected variable-thickness segments */}
                                                    {points.slice(1).map((pt, idx) => {
                                                        const prevPt = points[idx];
                                                        const p1 = prevPt.p ?? 0.5;
                                                        const p2 = pt.p ?? 0.5;
                                                        const avgPressure = (p1 + p2) / 2;
                                                        // Scale size based on pressure: min 35%, max 150% of the size
                                                        const strokeWidth = baseSize * (0.35 + avgPressure * 1.15);
                                                        return (
                                                            <line
                                                                key={idx}
                                                                x1={prevPt.x}
                                                                y1={prevPt.y}
                                                                x2={pt.x}
                                                                y2={pt.y}
                                                                stroke={stroke.color}
                                                                strokeWidth={strokeWidth}
                                                                strokeOpacity={strokeOpacity}
                                                                strokeLinecap="round"
                                                            />
                                                        );
                                                    })}
                                                </g>
                                            );
                                        }

                                        const pathDefinition = getStrokePathDefinition(stroke.points, stroke.type, stroke.size);
                                        return (
                                            <g
                                                key={stroke.id}
                                                className={tool === 'select' ? 'cursor-pointer' : (tool === 'eraser' && isTeacher) ? 'cursor-pointer hover:opacity-60 transition-opacity' : ''}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    if (tool === 'eraser' && isTeacher) {
                                                        pushToHistory({
                                                            type: 'delete_stroke',
                                                            targetType: 'stroke',
                                                            targetId: stroke.id,
                                                            beforeState: stroke,
                                                            afterState: null
                                                        });
                                                        deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', stroke.id));
                                                        if (selectedStrokeId === stroke.id) {
                                                            setSelectedStrokeId(null);
                                                        }
                                                        return;
                                                    }

                                                    handleSelectStroke(stroke.id);
                                                    if (tool === 'select') {
                                                        setActiveDragId(stroke.id);
                                                        setActiveDragType('stroke');
                                                        setDragOffset({
                                                            x: e.clientX - stroke.points[0].x,
                                                            y: e.clientY - stroke.points[0].y,
                                                            clientX: e.clientX,
                                                            clientY: e.clientY
                                                        });
                                                        setActionBeforeState({ points: [...stroke.points] });
                                                    }
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    if (tool === 'eraser' && isTeacher) {
                                                        pushToHistory({
                                                            type: 'delete_stroke',
                                                            targetType: 'stroke',
                                                            targetId: stroke.id,
                                                            beforeState: stroke,
                                                            afterState: null
                                                        });
                                                        deleteDoc(doc(db, 'whiteboards', courseId, 'strokes', stroke.id));
                                                        if (selectedStrokeId === stroke.id) {
                                                            setSelectedStrokeId(null);
                                                        }
                                                        return;
                                                    }

                                                    handleSelectStroke(stroke.id);
                                                    if (tool === 'select') {
                                                        setActiveDragId(stroke.id);
                                                        setActiveDragType('stroke');
                                                        const touch = e.touches[0];
                                                        setDragOffset({
                                                            x: touch.clientX - stroke.points[0].x,
                                                            y: touch.clientY - stroke.points[0].y,
                                                            clientX: touch.clientX,
                                                            clientY: touch.clientY
                                                        });
                                                        setActionBeforeState({ points: [...stroke.points] });
                                                    }
                                                }}
                                            >
                                                {/* Invisible clickable backing target path for effortless selection/erasing */}
                                                <path
                                                    d={pathDefinition}
                                                    fill="none"
                                                    stroke="transparent"
                                                    strokeWidth={stroke.size + 14}
                                                    style={{ pointerEvents: (tool === 'select' || tool === 'eraser') ? 'auto' : 'none' }}
                                                />
                                                <path
                                                    d={pathDefinition}
                                                    fill="none"
                                                    stroke={stroke.color}
                                                    strokeWidth={baseSize}
                                                    strokeOpacity={strokeOpacity}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className={tool === 'select' ? 'hover:stroke-indigo-600 transition-all' : ''}
                                                />
                                            </g>
                                        );
                                    })}

                                {/* Render active temporary drawing line */}
                                {isDrawing && currentPoints.length >= 2 && (() => {
                                    const points = currentPoints as { x: number; y: number; p?: number }[];
                                    const hasPressure = isPressureSensitive && points.some(pt => pt.p !== undefined && pt.p > 0 && pt.p !== 0.5);
                                    const isFreehand = ['pencil', 'pen', 'marker', 'eraser'].includes(tool);
                                    
                                    if (hasPressure && isFreehand) {
                                        return (
                                            <g stroke={tool === 'eraser' ? getBoardBgHexColor() : color} fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                {points.slice(1).map((pt, idx) => {
                                                    const prevPt = points[idx];
                                                    const p1 = prevPt.p ?? 0.5;
                                                    const p2 = pt.p ?? 0.5;
                                                    const avgPressure = (p1 + p2) / 2;
                                                    const strokeWidth = size * (0.35 + avgPressure * 1.15);
                                                    const opacity = tool === 'marker' ? 0.45 : 1;
                                                    return (
                                                        <line
                                                            key={idx}
                                                            x1={prevPt.x}
                                                            y1={prevPt.y}
                                                            x2={pt.x}
                                                            y2={pt.y}
                                                            strokeWidth={strokeWidth}
                                                            strokeOpacity={opacity}
                                                        />
                                                    );
                                                })}
                                            </g>
                                        );
                                    }
                                    
                                    return (
                                        <path
                                            d={getStrokePathDefinition(currentPoints, tool, size)}
                                            fill="none"
                                            stroke={tool === 'eraser' ? getBoardBgHexColor() : color}
                                            strokeWidth={size}
                                            strokeOpacity={tool === 'marker' ? 0.45 : 1}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    );
                                })()}

                                {/* Visual Selection Bounding Box with Resize Handles for the Selected Stroke */}
                                {isTeacher && tool === 'select' && selectedStrokeId && selectedStrokeBox && selectedStroke && activeDragId !== selectedStroke.id && (
                                    <g className="select-none pointer-events-auto">
                                        {/* Semi-transparent filled highlight overlay for the selection area */}
                                        <rect
                                            x={selectedStrokeBox.x}
                                            y={selectedStrokeBox.y}
                                            width={selectedStrokeBox.width}
                                            height={selectedStrokeBox.height}
                                            fill="rgba(99, 102, 241, 0.06)"
                                            rx="4"
                                            ry="4"
                                            className="pointer-events-none"
                                        />

                                        {/* Primary solid highlighted boundary border */}
                                        <rect
                                            x={selectedStrokeBox.x}
                                            y={selectedStrokeBox.y}
                                            width={selectedStrokeBox.width}
                                            height={selectedStrokeBox.height}
                                            fill="none"
                                            stroke="#4f46e5"
                                            strokeWidth="2"
                                            strokeLinejoin="round"
                                            rx="4"
                                            ry="4"
                                        />

                                        {/* Inner dashed high-contrast white border for high-contrast on all background grids */}
                                        <rect
                                            x={selectedStrokeBox.x + 0.5}
                                            y={selectedStrokeBox.y + 0.5}
                                            width={Math.max(1, selectedStrokeBox.width - 1)}
                                            height={Math.max(1, selectedStrokeBox.height - 1)}
                                            fill="none"
                                            stroke="#ffffff"
                                            strokeWidth="1"
                                            strokeDasharray="3 3"
                                            strokeLinejoin="round"
                                            rx="3.5"
                                            ry="3.5"
                                        />

                                        {/* Resize handles at 4 corners with drop shadows for elevated visual realism */}
                                        
                                        {/* Top-Left Handle */}
                                        <g>
                                            <circle
                                                cx={selectedStrokeBox.x}
                                                cy={selectedStrokeBox.y}
                                                r="9"
                                                fill="rgba(0, 0, 0, 0.14)"
                                                className="pointer-events-none"
                                            />
                                            <circle
                                                cx={selectedStrokeBox.x}
                                                cy={selectedStrokeBox.y}
                                                r="6.5"
                                                fill="#ffffff"
                                                stroke="#4f46e5"
                                                strokeWidth="2.5"
                                                style={{ cursor: 'nwse-resize' }}
                                                className="transition-transform duration-100 hover:scale-125"
                                                onMouseDown={(e) => handleStartResizeStroke(e, selectedStroke, 'top-left')}
                                                onTouchStart={(e) => handleStartResizeStroke(e, selectedStroke, 'top-left')}
                                            />
                                        </g>

                                        {/* Top-Right Handle */}
                                        <g>
                                            <circle
                                                cx={selectedStrokeBox.x + selectedStrokeBox.width}
                                                cy={selectedStrokeBox.y}
                                                r="9"
                                                fill="rgba(0, 0, 0, 0.14)"
                                                className="pointer-events-none"
                                            />
                                            <circle
                                                cx={selectedStrokeBox.x + selectedStrokeBox.width}
                                                cy={selectedStrokeBox.y}
                                                r="6.5"
                                                fill="#ffffff"
                                                stroke="#4f46e5"
                                                strokeWidth="2.5"
                                                style={{ cursor: 'nesw-resize' }}
                                                className="transition-transform duration-100 hover:scale-125"
                                                onMouseDown={(e) => handleStartResizeStroke(e, selectedStroke, 'top-right')}
                                                onTouchStart={(e) => handleStartResizeStroke(e, selectedStroke, 'top-right')}
                                            />
                                        </g>

                                        {/* Bottom-Left Handle */}
                                        <g>
                                            <circle
                                                cx={selectedStrokeBox.x}
                                                cy={selectedStrokeBox.y + selectedStrokeBox.height}
                                                r="9"
                                                fill="rgba(0, 0, 0, 0.14)"
                                                className="pointer-events-none"
                                            />
                                            <circle
                                                cx={selectedStrokeBox.x}
                                                cy={selectedStrokeBox.y + selectedStrokeBox.height}
                                                r="6.5"
                                                fill="#ffffff"
                                                stroke="#4f46e5"
                                                strokeWidth="2.5"
                                                style={{ cursor: 'nesw-resize' }}
                                                className="transition-transform duration-100 hover:scale-125"
                                                onMouseDown={(e) => handleStartResizeStroke(e, selectedStroke, 'bottom-left')}
                                                onTouchStart={(e) => handleStartResizeStroke(e, selectedStroke, 'bottom-left')}
                                            />
                                        </g>

                                        {/* Bottom-Right Handle */}
                                        <g>
                                            <circle
                                                cx={selectedStrokeBox.x + selectedStrokeBox.width}
                                                cy={selectedStrokeBox.y + selectedStrokeBox.height}
                                                r="9"
                                                fill="rgba(0, 0, 0, 0.14)"
                                                className="pointer-events-none"
                                            />
                                            <circle
                                                cx={selectedStrokeBox.x + selectedStrokeBox.width}
                                                cy={selectedStrokeBox.y + selectedStrokeBox.height}
                                                r="6.5"
                                                fill="#ffffff"
                                                stroke="#4f46e5"
                                                strokeWidth="2.5"
                                                style={{ cursor: 'nwse-resize' }}
                                                className="transition-transform duration-100 hover:scale-125"
                                                onMouseDown={(e) => handleStartResizeStroke(e, selectedStroke, 'bottom-right')}
                                                onTouchStart={(e) => handleStartResizeStroke(e, selectedStroke, 'bottom-right')}
                                            />
                                        </g>
                                    </g>
                                )}
                            </svg>
                                </div>
                            </div>

                            {/* Floating HTML Edit Toolbar Overlay for selected drawing / text stroke */}
                            {isTeacher && showFloatingMenu && tool === 'select' && selectedStrokeId && selectedStroke && selectedStrokeBox && activeDragId !== selectedStroke.id && !editingTextId && (
                                <div
                                    className="absolute z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 shadow-2xl flex flex-col gap-2.5 font-sans pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-2 duration-150 w-60"
                                    style={{
                                        left: `${(selectedStrokeBox.x + selectedStrokeBox.width / 2) * zoom + pan.x}px`,
                                        top: `${(selectedStrokeBox.y + selectedStrokeBox.height) * zoom + pan.y + 16}px`,
                                        transform: 'translateX(-50%)',
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/60">
                                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                                            {selectedStroke.type === 'text' ? 'Ajustar Texto' : 'Ajustar Trazo'}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={toggleFloatingMenu}
                                                className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition cursor-pointer"
                                                title="Ocultar este menú flotante"
                                            >
                                                <EyeOff className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setSelectedStrokeId(null)}
                                                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition cursor-pointer"
                                                title="Cerrar panel"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={deleteSelectedStroke}
                                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
                                                title="Eliminar objeto"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Color selection */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-semibold text-slate-400 block">Color del objeto:</span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {COLORS.map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => updateSelectedStroke({ color: c })}
                                                    className={`w-5 h-5 rounded-full border border-slate-200 shadow-xs transition transform hover:scale-110 flex-shrink-0 cursor-pointer ${selectedStroke.color === c ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Size/grosor selection slider */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                                            <span>{selectedStroke.type === 'text' ? 'Tamaño de fuente' : 'Grosor de línea'}</span>
                                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{selectedStroke.size}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={selectedStroke.type === 'text' ? "8" : "1"}
                                            max={selectedStroke.type === 'text' ? "96" : "24"}
                                            value={selectedStroke.size || (selectedStroke.type === 'text' ? 16 : 4)}
                                            onChange={(e) => updateSelectedStroke({ size: Number(e.target.value) })}
                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>

                                    {/* Text content editing */}
                                    {selectedStroke.type === 'text' && (
                                        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                                            <span className="text-[10px] font-semibold text-slate-400 block">Contenido del texto:</span>
                                            <button
                                                onClick={() => {
                                                    setEditingTextId(selectedStroke.id);
                                                    setEditingTextValue(selectedStroke.textContent || '');
                                                }}
                                                className="w-full text-xs py-2 px-3 bg-indigo-50 dark:bg-indigo-950/45 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                                Editar en pizarra
                                            </button>
                                        </div>
                                    )}

                                    {/* Action button to hide the menu completely */}
                                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                                        <button
                                            onClick={toggleFloatingMenu}
                                            className="w-full text-[10px] py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-750/50 dark:hover:bg-slate-750 border border-slate-150 dark:border-slate-700/80 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <EyeOff className="w-3.5 h-3.5" />
                                            Ocultar menú de edición
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Floating HTML Edit Toolbar Overlay for selected document / image */}
                            {isTeacher && showFloatingMenu && tool === 'select' && selectedDocId && selectedDoc && (
                                <div
                                    className="absolute z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 shadow-2xl flex flex-col gap-2.5 font-sans pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-2 duration-150 w-60"
                                    style={{
                                        left: `${(selectedDoc.x + selectedDoc.width / 2) * zoom + pan.x}px`,
                                        top: `${(selectedDoc.y + selectedDoc.height) * zoom + pan.y + 16}px`,
                                        transform: 'translateX(-50%)',
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/60">
                                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                                            Ajustar Imagen
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={toggleFloatingMenu}
                                                className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition cursor-pointer"
                                                title="Ocultar este menú flotante"
                                            >
                                                <EyeOff className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setSelectedDocId(null)}
                                                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition cursor-pointer"
                                                title="Cerrar panel"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        pushToHistory({
                                                            type: 'delete_doc',
                                                            targetType: 'doc',
                                                            targetId: selectedDoc.id,
                                                            beforeState: selectedDoc,
                                                            afterState: null
                                                        });
                                                        await deleteDoc(doc(db, 'whiteboards', courseId, 'documents', selectedDoc.id));
                                                        setSelectedDocId(null);
                                                    } catch (err) {
                                                        console.error(err);
                                                    }
                                                }}
                                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
                                                title="Eliminar imagen"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Sizing Presets */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-semibold text-slate-400 block">Tamaño rápido:</span>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <button
                                                onClick={() => {
                                                    const aspect = selectedDoc.width / selectedDoc.height;
                                                    const targetWidth = 180;
                                                    const targetHeight = Math.round(targetWidth / aspect);
                                                    pushToHistory({
                                                        type: 'resize',
                                                        targetType: 'doc',
                                                        targetId: selectedDoc.id,
                                                        beforeState: { width: selectedDoc.width, height: selectedDoc.height },
                                                        afterState: { width: targetWidth, height: targetHeight }
                                                    });
                                                    updateDocPosition(selectedDoc.id, { width: targetWidth, height: targetHeight });
                                                }}
                                                className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition cursor-pointer"
                                            >
                                                Pequeño
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const aspect = selectedDoc.width / selectedDoc.height;
                                                    const targetWidth = 350;
                                                    const targetHeight = Math.round(targetWidth / aspect);
                                                    pushToHistory({
                                                        type: 'resize',
                                                        targetType: 'doc',
                                                        targetId: selectedDoc.id,
                                                        beforeState: { width: selectedDoc.width, height: selectedDoc.height },
                                                        afterState: { width: targetWidth, height: targetHeight }
                                                    });
                                                    updateDocPosition(selectedDoc.id, { width: targetWidth, height: targetHeight });
                                                }}
                                                className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition cursor-pointer"
                                            >
                                                Mediano
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const aspect = selectedDoc.width / selectedDoc.height;
                                                    const targetWidth = 600;
                                                    const targetHeight = Math.round(targetWidth / aspect);
                                                    pushToHistory({
                                                        type: 'resize',
                                                        targetType: 'doc',
                                                        targetId: selectedDoc.id,
                                                        beforeState: { width: selectedDoc.width, height: selectedDoc.height },
                                                        afterState: { width: targetWidth, height: targetHeight }
                                                    });
                                                    updateDocPosition(selectedDoc.id, { width: targetWidth, height: targetHeight });
                                                }}
                                                className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition cursor-pointer"
                                            >
                                                Grande
                                            </button>
                                        </div>
                                    </div>

                                    {/* Fine Tuning Width Slider */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                                            <span>Ancho de la imagen</span>
                                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{selectedDoc.width}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="100"
                                            max="1200"
                                            value={selectedDoc.width}
                                            onMouseDown={() => {
                                                setActionBeforeState({ width: selectedDoc.width, height: selectedDoc.height });
                                            }}
                                            onTouchStart={() => {
                                                setActionBeforeState({ width: selectedDoc.width, height: selectedDoc.height });
                                            }}
                                            onChange={(e) => {
                                                const w = Number(e.target.value);
                                                const aspect = selectedDoc.width / selectedDoc.height;
                                                updateDocPosition(selectedDoc.id, { width: w, height: Math.round(w / aspect) });
                                            }}
                                            onMouseUp={(e) => {
                                                const w = Number((e.target as HTMLInputElement).value);
                                                const aspect = selectedDoc.width / selectedDoc.height;
                                                const targetHeight = Math.round(w / aspect);
                                                if (actionBeforeState && actionBeforeState.width !== w) {
                                                    pushToHistory({
                                                        type: 'resize',
                                                        targetType: 'doc',
                                                        targetId: selectedDoc.id,
                                                        beforeState: { width: actionBeforeState.width, height: actionBeforeState.height },
                                                        afterState: { width: w, height: targetHeight }
                                                    });
                                                }
                                                setActionBeforeState(null);
                                            }}
                                            onTouchEnd={(e) => {
                                                const w = Number((e.target as HTMLInputElement).value);
                                                const aspect = selectedDoc.width / selectedDoc.height;
                                                const targetHeight = Math.round(w / aspect);
                                                if (actionBeforeState && actionBeforeState.width !== w) {
                                                    pushToHistory({
                                                        type: 'resize',
                                                        targetType: 'doc',
                                                        targetId: selectedDoc.id,
                                                        beforeState: { width: actionBeforeState.width, height: actionBeforeState.height },
                                                        afterState: { width: w, height: targetHeight }
                                                    });
                                                }
                                                setActionBeforeState(null);
                                            }}
                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>

                                    {/* Action button to hide the menu completely */}
                                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                                        <button
                                            onClick={toggleFloatingMenu}
                                            className="w-full text-[10px] py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-750/50 dark:hover:bg-slate-750 border border-slate-150 dark:border-slate-700/80 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <EyeOff className="w-3.5 h-3.5" />
                                            Ocultar menú de edición
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Floating Draggable Formatting Toolbar (Teachers only) */}
                            {isTeacher && showFloatingMenu && !isPresentationMode && (() => {
                                const currentType = selectedStroke ? selectedStroke.type : tool;
                                const sizeMin = currentType === 'text' ? 8 : currentType === 'marker' ? 5 : 1;
                                const sizeMax = currentType === 'text' ? 72 : currentType === 'marker' ? 64 : 24;
                                return (
                                    <div
                                        style={{
                                            left: `${formatToolbarPos.x}px`,
                                            top: `${formatToolbarPos.y}px`,
                                        }}
                                        className="absolute z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl flex flex-col p-3 gap-2.5 w-[310px] sm:w-[335px] max-w-[calc(100vw-16px)] font-sans pointer-events-auto select-none animate-in fade-in zoom-in-95 duration-150"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                    >
                                        {/* Header with Drag Handle */}
                                        <div 
                                            className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2 cursor-grab active:cursor-grabbing"
                                            onMouseDown={handleToolbarDragStart}
                                            onTouchStart={handleToolbarDragStart}
                                        >
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <span>Formato {selectedStroke ? '(Selección)' : `(${currentType === 'pencil' ? 'Lápiz' : currentType === 'marker' ? 'Marcador' : currentType === 'text' ? 'Texto' : 'Forma'})`}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {selectedStroke && (
                                                    <button 
                                                        onClick={() => setSelectedStrokeId(null)}
                                                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                                                    >
                                                        Deseleccionar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={toggleFloatingMenu}
                                                    className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg transition cursor-pointer"
                                                    title="Ocultar menú flotante"
                                                >
                                                    <EyeOff className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Color Options */}
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Color:</span>
                                            <div className="flex items-center gap-1.5">
                                                {COLORS.map((c) => {
                                                    const isActiveColor = selectedStroke ? selectedStroke.color === c : color === c;
                                                    return (
                                                        <button
                                                            key={c}
                                                            onClick={() => handleUpdateColor(c)}
                                                            className={`w-5 h-5 rounded-full border shadow-xs transition transform hover:scale-110 flex-shrink-0 cursor-pointer ${
                                                                isActiveColor 
                                                                    ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800 scale-105' 
                                                                    : 'border-slate-300 dark:border-slate-600/50'
                                                            }`}
                                                            style={{ backgroundColor: c }}
                                                            title={`Color: ${c}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Size Slider and Presets */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                                <span className="uppercase tracking-wider">Tamaño: {selectedStroke ? selectedStroke.size : size}px</span>
                                                <div className="flex items-center gap-1">
                                                    {(() => {
                                                        let presets = [2, 4, 8, 12];
                                                        if (currentType === 'marker') presets = [10, 20, 32, 48];
                                                        else if (currentType === 'text') presets = [14, 20, 28, 42];
                                                        return presets.map((presetVal, idx) => {
                                                            const presetLabels = ['S', 'M', 'L', 'XL'];
                                                            const currentSize = selectedStroke ? selectedStroke.size : size;
                                                            const isSelected = currentSize === presetVal;
                                                            return (
                                                                <button
                                                                    key={presetVal}
                                                                    onClick={() => handleUpdateSize(presetVal)}
                                                                    className={`w-5 h-5 text-[9px] font-bold rounded flex items-center justify-center transition cursor-pointer ${
                                                                        isSelected 
                                                                            ? 'bg-indigo-600 text-white' 
                                                                            : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300'
                                                                    }`}
                                                                    title={`Tamaño ${presetLabels[idx]}: ${presetVal}px`}
                                                                >
                                                                    {presetLabels[idx]}
                                                                </button>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                min={sizeMin}
                                                max={sizeMax}
                                                value={selectedStroke ? (selectedStroke.size || 4) : size}
                                                onChange={(e) => handleUpdateSize(Number(e.target.value))}
                                                className="w-full h-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                                            />
                                        </div>

                                        {/* Styles/Tools Quick Switch */}
                                        <div className="flex items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-700/50 pt-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Estilo:</span>
                                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/40 p-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                {([
                                                    { type: 'pencil', icon: PenTool, title: 'Lápiz' },
                                                    { type: 'marker', icon: Highlighter, title: 'Resaltador' },
                                                    { type: 'text', icon: FileText, title: 'Texto' },
                                                    { type: 'rectangle', icon: Square, title: 'Rectángulo' },
                                                    { type: 'circle', icon: Circle, title: 'Círculo' },
                                                    { type: 'line', icon: Minus, title: 'Línea' },
                                                    { type: 'arrow', icon: ArrowUpRight, title: 'Flecha' }
                                                ] as const).map(({ type: t, icon: Icon, title }) => {
                                                    const isActiveType = currentType === t;
                                                    return (
                                                        <button
                                                            key={t}
                                                            onClick={() => handleUpdateType(t)}
                                                            className={`p-1.5 rounded-md transition cursor-pointer ${
                                                                isActiveType 
                                                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold border border-slate-250/60 dark:border-slate-700/60' 
                                                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent'
                                                            }`}
                                                            title={title}
                                                        >
                                                            <Icon className="w-3.5 h-3.5" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                        </div>
                    </div>
                )}

                {/* Always-visible Zoom, Pan, and Grid Settings controls (rendered outside flex active-screen to keep them in stable position) */}
                {isActive && (
                    <>
                        {/* Student Mobile View Banner */}
                        {!isTeacher && (
                            <div className="absolute bottom-3 left-3 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 select-none pointer-events-auto max-w-[calc(100vw-180px)] sm:max-w-md">
                                <span className="flex h-2 w-2 relative">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${allowStudentDrawing ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${allowStudentDrawing ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                </span>
                                <span className="font-bold text-[11px] whitespace-nowrap">Pizarra del Profesor</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${allowStudentDrawing ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                                    {allowStudentDrawing ? 'Escritura Permitida' : 'Solo Lectura'}
                                </span>
                                <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                                <button
                                    onClick={handleFitToContent}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer px-1 py-0.5 rounded"
                                    title="Ajustar pantalla para ver todo el contenido"
                                >
                                    <Target className="w-3.5 h-3.5" />
                                    <span className="whitespace-nowrap">Centrar Vista</span>
                                </button>
                                <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5 hidden xs:block" />
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline whitespace-nowrap">
                                    Desliza para mover
                                </span>
                            </div>
                        )}

                        {/* Floating Zoom & Pan Control Pane */}
                        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1 font-sans text-xs select-none pointer-events-auto max-w-[calc(100vw-24px)]">
                            <button
                                onClick={handleFitToContent}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
                                title="Centrar vista y encuadrar todo el contenido"
                            >
                                <Target className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => setShowGridSettings(!showGridSettings)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition cursor-pointer ${
                                    showGridSettings 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-805/30 font-bold' 
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                                title="Personalizar cuadriculación, grosor y oscuridad del fondo"
                            >
                                <Grid className="w-4 h-4" />
                            </button>

                            <button
                                onClick={toggleCanvasMovementLock}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition cursor-pointer ${
                                    isCanvasMovementLocked 
                                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-805/30 font-bold' 
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                                title={isCanvasMovementLocked ? "Desbloquear movimiento del lienzo" : "Bloquear movimiento del lienzo (Fijar pantalla)"}
                            >
                                {isCanvasMovementLocked ? (
                                    <Pin className="w-4 h-4 text-amber-600 dark:text-amber-400 transform rotate-45" />
                                ) : (
                                    <Unlock className="w-4 h-4" />
                                )}
                            </button>
                            
                            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                            <span className="text-[10px] text-slate-400 dark:text-slate-500 px-0.5 font-sans font-semibold hidden xs:inline">ZOOM:</span>
                            
                            <button
                                onClick={() => setZoom(prev => Math.max(0.15, Number((prev <= 0.5 ? prev - 0.10 : prev - 0.25).toFixed(2))))}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer font-extrabold text-sm"
                                title="Disminuir Zoom (Zoom Out)"
                            >
                                -
                            </button>
                            
                            <button
                                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                                className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 cursor-pointer min-w-[48px] text-center"
                                title="Restablecer original (100%)"
                            >
                                {Math.round(zoom * 100)}%
                            </button>
                            
                            <button
                                onClick={() => setZoom(prev => Math.min(5.0, Number((prev < 0.5 ? prev + 0.10 : prev + 0.25).toFixed(2))))}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-355 transition cursor-pointer font-extrabold text-sm"
                                title="Aumentar Zoom (Zoom In)"
                            >
                                +
                            </button>
                            
                            <div className="w-px h-5 bg-slate-250 dark:bg-slate-700 mx-1" />
                            
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[130px] leading-tight font-sans pl-1 hidden sm:block">
                                {isCanvasMovementLocked 
                                    ? 'Pantalla fijada' 
                                    : (!canUserDraw 
                                        ? 'Desliza con 1 dedo | Pellizca para zoom' 
                                        : (tool === 'select' ? 'Arrastra pizarra para mover' : 'Usa selección para mover'))
                                }
                            </div>
                        </div>

                        {/* Inner Popover Settings Card */}
                        {showGridSettings && (
                            <div className="absolute bottom-16 right-4 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/80 w-72 max-h-[75vh] overflow-y-auto custom-scrollbar space-y-3.5 text-xs font-sans select-none pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/80">
                                    <h5 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                        <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                                        Ajustes de Cuadrícula
                                    </h5>
                                    <button 
                                        onClick={() => setShowGridSettings(false)}
                                        className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* System Theme Switcher */}
                                <div className="space-y-1.5 pb-0.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tema de la Aplicación</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border dark:border-slate-755 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => { if (isDark) toggleTheme(); }}
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                                !isDark 
                                                    ? 'bg-white text-indigo-650 shadow-xs border border-slate-200/40' 
                                                    : 'text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <Sun className="w-3 h-3 text-amber-500" />
                                            Claro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { if (!isDark) toggleTheme(); }}
                                            className={`flex-1 py-1 text-[10px] font-bold rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                                isDark 
                                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                                    : 'text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            <Moon className="w-3 h-3 text-indigo-300" />
                                            Oscuro
                                        </button>
                                    </div>
                                </div>

                                {/* Local view toggle for custom templates */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plantilla de fondo</label>
                                    <div className="grid grid-cols-5 gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border dark:border-slate-750">
                                        {[
                                            { type: 'blank', label: 'Blanco', title: 'Blanco' },
                                            { type: 'grid', label: 'Cuad', title: 'Cuadriculado' },
                                            { type: 'dots', label: 'Punt', title: 'Puntos' },
                                            { type: 'simple-line', label: 'Lín', title: 'Línea Simple' },
                                            { type: 'double-line', label: 'Cali', title: 'Doble Línea' }
                                        ].map((bp) => (
                                            <button
                                                key={bp.type}
                                                onClick={() => {
                                                    setBgPattern(bp.type);
                                                    if (isTeacher) changeBgPattern(bp.type);
                                                }}
                                                className={`py-1 text-[9px] font-bold rounded-md text-center transition cursor-pointer ${
                                                    bgPattern === bp.type
                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                        : 'text-slate-550 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-slate-200'
                                                }`}
                                                title={bp.title}
                                            >
                                                {bp.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Board Theme / Color Selector */}
                                <div className="space-y-1.5 pb-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estilo de Pizarra</label>
                                    <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border dark:border-slate-755">
                                        {[
                                            { type: 'default', label: 'Estándar', color: 'bg-slate-200 dark:bg-slate-700' },
                                            { type: 'cream', label: 'Crema', color: 'bg-[#fbfaf5]' },
                                            { type: 'chalkboard', label: 'Pizarra', color: 'bg-[#1b3a2a]' },
                                            { type: 'blueprint', label: 'Plano', color: 'bg-[#0f2b5c]' },
                                            { type: 'charcoal', label: 'Carbón', color: 'bg-[#1a1c23]' }
                                        ].map((bt) => (
                                            <button
                                                key={bt.type}
                                                onClick={() => setBoardColorTheme(bt.type)}
                                                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md flex items-center gap-1 cursor-pointer border transition ${
                                                    boardColorTheme === bt.type
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                                                        : 'border-transparent text-slate-550 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-850'
                                                }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full border border-slate-300 ${bt.color}`} />
                                                {bt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Grid Line Color Selector */}
                                <div className="space-y-1.5 pb-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Color de Cuadrícula</label>
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border dark:border-slate-750">
                                        <button
                                            onClick={() => setGridColor('default')}
                                            className={`px-1.5 py-0.5 text-[8.5px] font-bold rounded-md cursor-pointer border transition ${
                                                gridColor === 'default'
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                                                    : 'border-transparent text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                                            }`}
                                        >
                                            Auto
                                        </button>
                                        <div className="flex items-center gap-1 pr-1">
                                            {[
                                                { value: '#94a3b8', label: 'Gris' },
                                                { value: '#d97706', label: 'Ámbar' },
                                                { value: '#10b981', label: 'Verde' },
                                                { value: '#3b82f6', label: 'Azul' },
                                                { value: '#ef4444', label: 'Rojo' },
                                                { value: '#8b5cf6', label: 'Morado' }
                                            ].map((c) => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => setGridColor(c.value)}
                                                    className={`w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer transition transform hover:scale-110 flex items-center justify-center ${
                                                        gridColor === c.value ? 'ring-1 ring-indigo-500 scale-105' : ''
                                                    }`}
                                                    style={{ backgroundColor: c.value }}
                                                    title={c.label}
                                                >
                                                    {gridColor === c.value && <span className="w-1 h-1 bg-white rounded-full" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Slider 1: Intensity / Opacity */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intensidad (Oscuridad)</label>
                                        <span className="font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                            {Math.round(gridOpacity * 100)}%
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.05" 
                                        max="0.85" 
                                        step="0.05"
                                        value={gridOpacity} 
                                        onChange={(e) => setGridOpacity(Number(e.target.value))}
                                        className="w-full h-1 bg-slate-205 dark:bg-slate-705 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                                    />
                                    <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                                        <span>Claro (5%)</span>
                                        <span>Medio (35%)</span>
                                        <span>Oscuro (85%)</span>
                                    </div>
                                </div>

                                {/* Slider 2: Thickness / Stroke Width */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grosor de Líneas</label>
                                        <span className="font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                            {gridStrokeWidth.toFixed(1)}px
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.3" 
                                        max="2.5" 
                                        step="0.1"
                                        value={gridStrokeWidth} 
                                        onChange={(e) => setGridStrokeWidth(Number(e.target.value))}
                                        className="w-full h-1 bg-slate-205 dark:bg-slate-705 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                                    />
                                    <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                                        <span>Fino (0.3px)</span>
                                        <span>Medio (1.0px)</span>
                                        <span>Grueso (2.5px)</span>
                                    </div>
                                </div>

                                {/* Stylus / Active Pen Optimization */}
                                <div className="space-y-2 pt-2.5 border-t border-slate-100 dark:border-slate-700/85">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Optimización de Lápiz (Pencil/Stylus)</label>
                                    
                                    {/* Pressure Sensitivity Toggle */}
                                    <div className="flex items-center justify-between py-1 bg-slate-50 dark:bg-slate-900/30 px-2 rounded-lg border dark:border-slate-750">
                                        <span className="text-slate-600 dark:text-slate-355 font-medium">Sensibilidad a Presión</span>
                                        <button
                                            type="button"
                                            onClick={togglePressureSensitive}
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                                isPressureSensitive 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                                                    : 'border-slate-300 dark:border-slate-650 text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            {isPressureSensitive ? 'Activa' : 'Inactiva'}
                                        </button>
                                    </div>

                                    {/* Palm Rejection / Pen Only Mode Toggle */}
                                    <div className="flex items-center justify-between py-1.5 bg-slate-50 dark:bg-slate-900/30 px-2 rounded-lg border dark:border-slate-750">
                                        <div className="flex flex-col">
                                            <span className="text-slate-600 dark:text-slate-355 font-medium">Rechazo de Palma</span>
                                            <span className="text-[8px] text-slate-400">Dedos desplazan, Lápiz dibuja</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={togglePenOnlyDrawing}
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                                                isPenOnlyDrawing 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                                                    : 'border-slate-300 dark:border-slate-650 text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            {isPenOnlyDrawing ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </div>

                                    {/* Stabilizer Strength Slider */}
                                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg border dark:border-slate-750">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-600 dark:text-slate-355 font-medium">Estabilizador de Trazo</span>
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {stabilizerStrength === 0 ? 'Off' : `Nivel ${stabilizerStrength}`}
                                            </span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="5" 
                                            step="1"
                                            value={stabilizerStrength} 
                                            onChange={(e) => updateStabilizerStrength(parseInt(e.target.value, 10))}
                                            className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-[7.5px] text-slate-400 font-bold">
                                            <span>Directo (0)</span>
                                            <span>Suave (3)</span>
                                            <span>Filtro Max (5)</span>
                                        </div>
                                    </div>

                                    {/* Pen Status Indicator */}
                                    <div className="text-[8px] text-slate-400/80 flex items-center justify-between px-1">
                                        <span>Estado del Lápiz:</span>
                                        <span className={`font-bold uppercase ${isPenDetected ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {isPenDetected ? '● Detectado' : '○ No detectado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showHelp && (
                <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
            )}

            {/* Custom Iframe-Safe Confirmation Modal for Clearing the Whiteboard */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full mx-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl">
                                <Trash className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">¿Borrar toda la pizarra?</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                    Esta acción eliminará todos los trazos, textos y documentos actuales de forma permanente. No se puede deshacer.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-750 rounded-xl transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    setShowClearConfirm(false);
                                    await executeClearCanvasStrokes();
                                }}
                                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition cursor-pointer"
                            >
                                Sí, borrar todo
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Modal for Closing & Deleting Whiteboard */}
            {confirmCloseBoardModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[99999] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-3 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl flex-shrink-0">
                                <Trash className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">¿Cerrar y borrar la pizarra?</h4>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                                    ¿Estás seguro de salir y borrar por completo la pizarra? Toda la información, trazos y documentos compartidos se eliminarán de forma definitiva y no podrás recuperarla.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                            <button
                                type="button"
                                onClick={() => setConfirmCloseBoardModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleConfirmCloseAndClearBoard();
                                }}
                                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition cursor-pointer"
                            >
                                Sí, cerrar y borrar todo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return whiteboardRender;
};
