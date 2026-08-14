import React, { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './icons';

export interface TourStep {
    target: string; // CSS selector
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    steps: TourStep[];
    onComplete: () => void;
}

const getElementRect = (selector: string): DOMRect | null => {
    try {
        const element = document.querySelector(selector);
        return element ? element.getBoundingClientRect() : null;
    } catch (e) {
        console.error(`OnboardingTour: Invalid selector "${selector}"`);
        return null;
    }
};

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [highlightStyle, setHighlightStyle] = useState({});
    const [popoverStyle, setPopoverStyle] = useState({});

    const currentStep = steps[currentStepIndex];
    const isLastStep = currentStepIndex === steps.length - 1;

    useLayoutEffect(() => {
        const updatePosition = () => {
            const elementRect = getElementRect(currentStep.target);
            if (elementRect && elementRect.width > 0) {
                setHighlightStyle({
                    width: `${elementRect.width + 16}px`,
                    height: `${elementRect.height + 16}px`,
                    top: `${elementRect.top - 8}px`,
                    left: `${elementRect.left - 8}px`,
                    transition: 'all 0.3s ease-in-out',
                });

                // Simple popover placement logic
                let popoverTop = elementRect.bottom + 10;
                let popoverLeft = elementRect.left;
                // Adjust if it goes off-screen
                if (popoverTop + 150 > window.innerHeight) { // 150 is an estimated popover height
                    popoverTop = elementRect.top - 160;
                }
                if (popoverLeft + 300 > window.innerWidth) { // 300 is estimated width
                    popoverLeft = window.innerWidth - 310;
                }
                 if (popoverLeft < 10) {
                    popoverLeft = 10;
                }

                setPopoverStyle({
                    top: `${popoverTop}px`,
                    left: `${popoverLeft}px`,
                    transition: 'all 0.3s ease-in-out',
                });

            } else {
                // If element not found, center the highlight and popover
                setHighlightStyle({
                    width: '100px',
                    height: '50px',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                });
                 setPopoverStyle({
                    top: '60%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                });
            }
        };
        
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [currentStep.target]);

    const handleNext = () => {
        if (!isLastStep) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/70 animate-fade-in" />
            
            {/* Highlight Box */}
            <div
                className="absolute bg-transparent rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
                style={highlightStyle}
            />

            {/* Popover */}
            <div
                className="absolute w-80 bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-5 animate-pop-in"
                style={popoverStyle}
            >
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">{currentStep.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{currentStep.content}</p>
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm font-semibold text-slate-500">{currentStepIndex + 1} / {steps.length}</span>
                    <div className="flex gap-2">
                         <button onClick={onComplete} className="text-sm text-slate-500 hover:text-primary">
                            Saltar
                        </button>
                        {currentStepIndex > 0 && (
                            <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={handleNext} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm">
                            {isLastStep ? '¡Entendido!' : 'Siguiente'}
                        </button>
                    </div>
                </div>
                 <button onClick={onComplete} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                    <CloseIcon className="w-5 h-5 text-slate-500" />
                 </button>
            </div>
        </div>,
        document.body
    );
};
