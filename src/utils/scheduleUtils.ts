export interface DaySchedule {
  dayName: string;
  dayNum: number; // 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 0 = Sunday
  times: string[];
}

export const DAYS_OF_WEEK: { name: string; num: number }[] = [
  { name: 'Lunes', num: 1 },
  { name: 'Martes', num: 2 },
  { name: 'Miércoles', num: 3 },
  { name: 'Jueves', num: 4 },
  { name: 'Viernes', num: 5 },
  { name: 'Sábado', num: 6 },
  { name: 'Domingo', num: 0 },
];

export const PRESET_TIME_SLOTS = [
  '09:00', '10:00', '11:00', '11:30', '12:00', '13:00',
  '16:00', '16:30', '17:00', '18:00', '19:00', '20:00'
];

const DAY_MAP: Record<string, number> = {
  'domingo': 0,
  'lunes': 1,
  'martes': 2,
  'miércoles': 3,
  'miercoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sábado': 6,
  'sabado': 6,
};

/**
 * Parses raw schedules array from teacher profile into structured Record<dayNum, string[]>
 */
export function parseTeacherSchedules(schedules?: string[]): Record<number, string[]> {
  const result: Record<number, string[]> = {};

  if (!schedules || schedules.length === 0) {
    // Default fallback if teacher hasn't configured specific slots yet
    return {
      1: ['11:00', '16:30'], // Lunes
      2: ['10:00', '17:00'], // Martes
      3: ['09:30', '11:30', '17:00'], // Miércoles
      4: ['12:00', '16:00'], // Jueves
      5: ['10:30', '15:30'], // Viernes
    };
  }

  for (const rawItem of schedules) {
    if (!rawItem || typeof rawItem !== 'string') continue;
    const item = rawItem.trim();

    // Check format like "Lunes: 11:00, 16:30" or "Lunes - 11:00, 16:30"
    if (item.includes(':') || item.includes('-')) {
      const parts = item.split(/[:|-]/);
      const dayName = parts[0].trim().toLowerCase();
      const timesStr = parts.slice(1).join(':').trim();
      
      const dayNum = DAY_MAP[dayName];
      if (dayNum !== undefined) {
        const extractedTimes = timesStr.match(/\b\d{1,2}:\d{2}\b/g) || [];
        if (extractedTimes.length > 0) {
          if (!result[dayNum]) result[dayNum] = [];
          extractedTimes.forEach(t => {
            if (!result[dayNum].includes(t)) result[dayNum].push(t);
          });
        }
      }
    } 
    // Check format like "Lunes 11:00" or single day entry
    else {
      const lower = item.toLowerCase();
      let matchedDay = false;
      for (const [dName, dNum] of Object.entries(DAY_MAP)) {
        if (lower.includes(dName)) {
          matchedDay = true;
          const extractedTimes = item.match(/\b\d{1,2}:\d{2}\b/g) || [];
          if (!result[dNum]) result[dNum] = [];
          if (extractedTimes.length > 0) {
            extractedTimes.forEach(t => {
              if (!result[dNum].includes(t)) result[dNum].push(t);
            });
          } else {
            ['11:00', '16:30'].forEach(t => {
              if (!result[dNum].includes(t)) result[dNum].push(t);
            });
          }
        }
      }

      if (!matchedDay && lower.includes('lunes a viernes')) {
        const extractedTimes = item.match(/\b\d{1,2}:\d{2}\b/g) || ['11:00', '16:30'];
        [1, 2, 3, 4, 5].forEach(dNum => {
          if (!result[dNum]) result[dNum] = [];
          extractedTimes.forEach(t => {
            if (!result[dNum].includes(t)) result[dNum].push(t);
          });
        });
      }
    }
  }

  // If parsing produced no keys, fallback to standard defaults
  if (Object.keys(result).length === 0) {
    return {
      1: ['11:00', '16:30'],
      2: ['10:00', '17:00'],
      3: ['09:30', '11:30', '17:00'],
      4: ['12:00', '16:00'],
      5: ['10:30', '15:30'],
    };
  }

  return result;
}

/**
 * Formats structured schedule map back to array of formatted strings for database persistence
 */
export function formatSchedulesForDb(scheduleMap: Record<number, string[]>): string[] {
  const result: string[] = [];
  const nameMap: Record<number, string> = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    0: 'Domingo',
  };

  [1, 2, 3, 4, 5, 6, 0].forEach(dNum => {
    if (scheduleMap[dNum] && scheduleMap[dNum].length > 0) {
      // Sort times numerically by HH:MM
      const sortedTimes = [...scheduleMap[dNum]].sort((a, b) => {
        const [ha, ma] = a.split(':').map(Number);
        const [hb, mb] = b.split(':').map(Number);
        return (ha * 60 + ma) - (hb * 60 + mb);
      });
      result.push(`${nameMap[dNum]}: ${sortedTimes.join(', ')}`);
    }
  });

  return result;
}
