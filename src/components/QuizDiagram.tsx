import React from 'react';

interface QuizDiagramProps {
    diagram?: {
        type: 'geometry' | 'plot' | 'circuit' | 'forces' | 'atoms';
        data?: any;
    };
}

export const QuizDiagram: React.FC<QuizDiagramProps> = ({ diagram }) => {
    if (!diagram) return null;

    const { type, data } = diagram;

    return (
        <div className="my-6 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center">
            {type === 'geometry' && (
                <div className="w-full max-w-xs flex flex-col items-center">
                    <svg viewBox="0 0 200 150" className="w-48 h-36">
                        {/* Right Triangle */}
                        <path
                            d="M 40 120 L 160 120 L 40 30 Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-primary dark:text-indigo-400"
                        />
                        {/* Right angle marker */}
                        <path
                            d="M 40 110 L 50 110 L 50 120"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-slate-400"
                        />
                        {/* Labels */}
                        <text x="30" y="75" className="fill-slate-700 dark:fill-slate-350 font-bold font-sans text-sm">{data?.labelA || 'a = 3'}</text>
                        <text x="100" y="135" className="fill-slate-700 dark:fill-slate-350 font-bold font-sans text-sm">{data?.labelB || 'b = 4'}</text>
                        <text x="110" y="70" className="fill-slate-900 dark:fill-slate-100 font-bold font-sans text-sm">{data?.labelC || 'c = ?'}</text>
                    </svg>
                    <span className="text-xs text-slate-500 mt-2 font-mono">Fig 1. Triángulo Rectángulo</span>
                </div>
            )}

            {type === 'plot' && (
                <div className="w-full max-w-xs flex flex-col items-center">
                    <svg viewBox="0 0 200 200" className="w-48 h-48">
                        {/* Grid lines */}
                        <path d="M 0 40 L 200 40 M 0 80 L 200 80 M 0 120 L 200 120 M 0 160 L 200 160" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-800" />
                        <path d="M 40 0 L 40 200 M 80 0 L 80 200 M 120 0 L 120 200 M 160 0 L 160 200" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-800" />
                        
                        {/* Axes */}
                        <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="2" className="text-slate-500" />
                        <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="2" className="text-slate-500" />
                        
                        {/* Plot line: y = 2x + 3 -> represented on canvas */}
                        {/* If y = 2x + 3, points: (-50, -100) -> on canvas: (0, 200), (100, 100) origin, (150, 0) */}
                        <line x1="40" y1="180" x2="160" y2="20" stroke="currentColor" strokeWidth="3" className="text-primary dark:text-indigo-400" />
                        
                        {/* Axis Labels */}
                        <text x="185" y="95" className="fill-slate-500 font-bold font-mono text-xs">X</text>
                        <text x="105" y="15" className="fill-slate-500 font-bold font-mono text-xs">Y</text>
                        {/* Equation label */}
                        <rect x="115" y="125" width="70" height="22" rx="4" className="fill-white dark:fill-slate-800 stroke-slate-250 dark:stroke-slate-750" />
                        <text x="120" y="140" className="fill-primary dark:fill-indigo-400 font-bold font-mono text-[9px]">{data?.equation || 'y = 2x + 3'}</text>
                    </svg>
                    <span className="text-xs text-slate-500 mt-2 font-mono">Fig 2. Función Lineal en el Plano Coordenado</span>
                </div>
            )}

            {type === 'circuit' && (
                <div className="w-full max-w-xs flex flex-col items-center">
                    <svg viewBox="0 0 200 150" className="w-48 h-36">
                        {/* Main loop */}
                        <path d="M 30 75 L 30 30 L 170 30 L 170 120 L 30 120 L 30 75" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500" />
                        
                        {/* Resistor zig-zag (at the top) */}
                        <rect x="80" y="22" width="40" height="16" fill="currentColor" stroke="currentColor" strokeWidth="2" className="fill-slate-100 dark:fill-slate-800 text-primary dark:text-indigo-400" />
                        <text x="92" y="32" className="fill-slate-700 dark:fill-slate-300 font-bold text-[9px] font-mono">R</text>

                        {/* Battery details (on the bottom or left side) */}
                        <line x1="90" y1="110" x2="90" y2="130" stroke="currentColor" strokeWidth="4" className="text-slate-800 dark:text-slate-200" />
                        <line x1="110" y1="115" x2="110" y2="125" stroke="currentColor" strokeWidth="2" className="text-slate-800 dark:text-slate-200" />
                        
                        {/* Voltage markers */}
                        <text x="82" y="105" className="fill-slate-600 dark:fill-slate-400 font-bold text-xs">+</text>
                        <text x="112" y="105" className="fill-slate-600 dark:fill-slate-400 font-bold text-xs">-</text>
                        <text x="95" y="142" className="fill-slate-800 dark:fill-slate-200 font-bold font-sans text-xs">V = 12V</text>
                        
                        {/* Resistor value */}
                        <text x="85" y="18" className="fill-primary dark:fill-indigo-300 font-bold font-mono text-xs">{data?.resistance || 'R = 6 Ω'}</text>
                    </svg>
                    <span className="text-xs text-slate-500 mt-2 font-mono">Fig 3. Circuito Eléctrico de Corriente Continua</span>
                </div>
            )}

            {type === 'forces' && (
                <div className="w-full max-w-xs flex flex-col items-center">
                    <svg viewBox="0 0 220 180" className="w-52 h-44">
                        {/* Inclined hill */}
                        <path d="M 20 140 L 180 140 L 180 50 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400" />
                        {/* Angle marker theta */}
                        <path d="M 60 140 A 40 40 0 0 1 50 123" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500" />
                        <text x="65" y="135" className="fill-slate-600 dark:fill-slate-400 font-bold text-xs">α</text>
                        
                        {/* Block */}
                        {/* Centered around (100, 95) tilted ~30 deg */}
                        <g transform="translate(100, 95) rotate(-30)">
                            <rect x="-20" y="-15" width="40" height="30" fill="currentColor" stroke="currentColor" strokeWidth="2" className="fill-slate-200 dark:fill-slate-800 border-slate-600 text-slate-700 dark:text-slate-350" />
                            {/* Force Normal */}
                            <line x1="0" y1="0" x2="0" y2="-45" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
                            <text x="10" y="-35" className="fill-red-500 font-bold font-mono text-xs">N</text>

                            {/* Force Friction */}
                            <line x1="0" y1="0" x2="-35" y2="0" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
                            <text x="-40" y="-8" className="fill-amber-500 font-bold font-mono text-xs">Fr</text>
                        </g>

                        {/* Force Weight (goes straight down) */}
                        <line x1="113" y1="103" x2="113" y2="155" stroke="#3b82f6" strokeWidth="2" />
                        <text x="122" y="145" className="fill-blue-500 font-bold font-mono text-xs">P</text>

                        {/* Arrows markers definition */}
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-red-500 dark:text-red-400" />
                            </marker>
                        </defs>
                    </svg>
                    <span className="text-xs text-slate-500 mt-2 font-mono">Fig 4. Diagrama de Fuerzas en Plano Inclinado</span>
                </div>
            )}

            {type === 'atoms' && (
                <div className="w-full max-w-xs flex flex-col items-center">
                    <svg viewBox="0 0 200 200" className="w-48 h-48">
                        {/* Nucleus */}
                        <circle cx="100" cy="100" r="14" fill="currentColor" className="text-primary dark:text-indigo-400" />
                        <text x="94" y="104" className="fill-white font-bold text-[10px] font-sans">N</text>
                        
                        {/* Orbit 1 */}
                        <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" className="text-slate-400" />
                        {/* Electron 1 on Orbit 1 */}
                        <circle cx="68" cy="76" r="6" fill="#10b981" />
                        <circle cx="132" cy="124" r="6" fill="#10b981" />
                        
                        {/* Orbit 2 */}
                        <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" className="text-slate-400" />
                        {/* Electrons on Orbit 2 */}
                        <circle cx="100" cy="25" r="6" fill="#10b981" />
                        <circle cx="100" cy="175" r="6" fill="#10b981" />
                        <circle cx="25" cy="100" r="6" fill="#10b981" />
                        <circle cx="175" cy="100" r="6" fill="#10b981" />
                    </svg>
                    <span className="text-xs text-slate-500 mt-2 font-mono">Fig 5. Modelo Atómico de Bohr</span>
                </div>
            )}
        </div>
    );
};
