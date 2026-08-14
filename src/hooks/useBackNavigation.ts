import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

/**
 * Custom hook to handle "back" navigation logic.
 * It checks if there is a page in the browser history to go back to.
 * If not, it navigates to a specified fallback route (defaults to the dashboard).
 * @param fallbackRoute - The route to navigate to if there's no history.
 * @returns A memoized function to trigger the back navigation.
 */
export const useBackNavigation = (fallbackRoute: string = ROUTES.DASHBOARD) => {
    const navigate = useNavigate();

    const handleBack = useCallback(() => {
        // Check if there is a history stack to go back to.
        // window.history.state.idx > 0 indicates it's not the first page in the session history.
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            // If no history, navigate to the fallback route without adding a new entry to the history stack.
            navigate(fallbackRoute, { replace: true });
        }
    }, [navigate, fallbackRoute]);

    return handleBack;
};