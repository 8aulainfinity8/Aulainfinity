import { useState } from 'react';

export const useCalendar = (initialDate: Date = new Date()) => {
    const [currentDate, setCurrentDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(initialDate);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const selectDate = (date: Date) => {
        setSelectedDate(date);
    };

    return {
        currentDate,
        selectedDate,
        changeMonth,
        selectDate,
    };
};