import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'onboardingCompleted';

export const useOnboarding = (isStudent: boolean) => {
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        // Only trigger for students and if the key is not in localStorage
        if (isStudent) {
            const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
            if (!hasCompleted) {
                // Use a small delay to ensure the UI has rendered before starting the tour
                const timer = setTimeout(() => {
                    setShowTour(true);
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [isStudent]);

    const completeOnboarding = useCallback(() => {
        try {
            localStorage.setItem(ONBOARDING_KEY, 'true');
            setShowTour(false);
        } catch (error) {
            console.error("Could not save onboarding status to localStorage", error);
            // Still hide the tour even if localStorage fails
            setShowTour(false);
        }
    }, []);

    return { showTour, completeOnboarding };
};