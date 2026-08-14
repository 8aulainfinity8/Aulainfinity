import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

interface StreakData {
    count: number;
    lastActiveDate: string; // YYYY-MM-DD
}

export function useStudyStreak() {
    const { user } = useContext(AuthContext);
    const [streakCount, setStreakCount] = useState<number>(0);

    useEffect(() => {
        if (!user || user.role !== 'student') {
            setStreakCount(0);
            return;
        }

        const streakKey = `aula_streak_${user.id}`;
        const stored = localStorage.getItem(streakKey);
        
        // Get today's local date as "YYYY-MM-DD"
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        let currentStreak = 1;

        if (stored) {
            try {
                const data: StreakData = JSON.parse(stored);
                const lastActive = data.lastActiveDate;
                
                if (lastActive === todayStr) {
                    // Visited today already, keep same count
                    currentStreak = data.count || 1;
                } else {
                    const lastDate = new Date(lastActive + 'T00:00:00');
                    const todayDate = new Date(todayStr + 'T00:00:00');
                    
                    // Difference in days
                    const diffTime = todayDate.getTime() - lastDate.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        // Visited yesterday, streak continues! Increment by 1
                        currentStreak = (data.count || 0) + 1;
                        localStorage.setItem(streakKey, JSON.stringify({
                            count: currentStreak,
                            lastActiveDate: todayStr
                        }));
                    } else if (diffDays > 1) {
                        // Broke streak, reset to 1
                        currentStreak = 1;
                        localStorage.setItem(streakKey, JSON.stringify({
                            count: currentStreak,
                            lastActiveDate: todayStr
                        }));
                    } else {
                        // Negative difference (time traveler), keep current
                        currentStreak = data.count || 1;
                    }
                }
            } catch (error) {
                console.error("Error parsing study streak:", error);
                currentStreak = 1;
            }
        } else {
            // Initiate new study streak
            localStorage.setItem(streakKey, JSON.stringify({
                count: 1,
                lastActiveDate: todayStr
            }));
            currentStreak = 1;
        }

        setStreakCount(currentStreak);
    }, [user]);

    return streakCount;
}
