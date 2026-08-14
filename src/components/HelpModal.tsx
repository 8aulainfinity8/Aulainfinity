import React from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-rose-500 transition"
                >
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Guía de la Pizarra</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
                    <li><strong>Dibujar:</strong> Selecciona el lápiz o marcador. Arrastra sobre la zona de dibujo.</li>
                    <li><strong>Selección:</strong> Cambia a la herramienta de selección (flecha) para mover, cambiar color o borrar trazos ya existentes.</li>
                    <li><strong>Documentos:</strong> Haz clic en el botón de imagen para adjuntar tus archivos.</li>
                    <li><strong>Pantalla completa:</strong> Maximiza tu espacio de trabajo con el botón de flechas en la esquina superior.</li>
                </ul>
                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};
