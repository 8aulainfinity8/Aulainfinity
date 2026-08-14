import React, { useState, useEffect } from 'react';
import { TeacherUser } from '../types';
import { DAYS_OF_WEEK, PRESET_TIME_SLOTS, parseTeacherSchedules, formatSchedulesForDb } from '../utils/scheduleUtils';
import { Calendar, Clock, Plus, Trash2, CheckCircle, Sparkles, BookOpen, Layers, Save } from 'lucide-react';

interface TeacherScheduleManagerProps {
  teacher: TeacherUser;
  onSave: (updatedSchedules: string[]) => Promise<void> | void;
  isSaving?: boolean;
  compact?: boolean;
  title?: string;
}

export const TeacherScheduleManager: React.FC<TeacherScheduleManagerProps> = ({
  teacher,
  onSave,
  isSaving = false,
  compact = false,
  title = "Agenda de Disponibilidad para Tutorías"
}) => {
  // State for day schedules: Record<dayNum, string[]>
  const [scheduleMap, setScheduleMap] = useState<Record<number, string[]>>(() => {
    return parseTeacherSchedules(teacher.schedules);
  });

  // Custom time inputs per day
  const [customTimeInput, setCustomTimeInput] = useState<Record<number, string>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if teacher prop changes externally
  useEffect(() => {
    setScheduleMap(parseTeacherSchedules(teacher.schedules));
  }, [teacher.schedules]);

  const handleToggleTimeSlot = (dayNum: number, time: string) => {
    setSavedSuccess(false);
    setScheduleMap(prev => {
      const currentTimes = prev[dayNum] || [];
      let nextTimes: string[];
      if (currentTimes.includes(time)) {
        nextTimes = currentTimes.filter(t => t !== time);
      } else {
        nextTimes = [...currentTimes, time];
      }
      return {
        ...prev,
        [dayNum]: nextTimes
      };
    });
  };

  const handleAddCustomTime = (dayNum: number) => {
    const raw = (customTimeInput[dayNum] || '').trim();
    if (!raw) return;

    // Validate HH:MM or H:MM format
    const match = raw.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
    if (!match) {
      alert('Por favor introduce la hora en formato HH:MM (ejemplo: 15:30 o 09:15)');
      return;
    }

    // Format strictly as HH:MM
    const [h, m] = raw.split(':');
    const formatted = `${h.padStart(2, '0')}:${m}`;

    setSavedSuccess(false);
    setScheduleMap(prev => {
      const currentTimes = prev[dayNum] || [];
      if (currentTimes.includes(formatted)) return prev;
      return {
        ...prev,
        [dayNum]: [...currentTimes, formatted]
      };
    });

    setCustomTimeInput(prev => ({ ...prev, [dayNum]: '' }));
  };

  const handleRemoveTime = (dayNum: number, timeToRemove: string) => {
    setSavedSuccess(false);
    setScheduleMap(prev => {
      const currentTimes = prev[dayNum] || [];
      return {
        ...prev,
        [dayNum]: currentTimes.filter(t => t !== timeToRemove)
      };
    });
  };

  const handleApplyPreset = (type: 'mornings' | 'afternoons' | 'full' | 'clear') => {
    setSavedSuccess(false);
    if (type === 'clear') {
      setScheduleMap({});
      return;
    }

    const next: Record<number, string[]> = {};
    const weekDays = [1, 2, 3, 4, 5]; // Lunes a Viernes

    weekDays.forEach(dNum => {
      if (type === 'mornings') {
        next[dNum] = ['10:00', '11:30'];
      } else if (type === 'afternoons') {
        next[dNum] = ['16:30', '18:00'];
      } else if (type === 'full') {
        next[dNum] = ['11:00', '16:30', '18:00'];
      }
    });

    setScheduleMap(next);
  };

  const handleSave = async () => {
    const formatted = formatSchedulesForDb(scheduleMap);
    await onSave(formatted);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const teacherSubjectsText = (teacher.subjects && teacher.subjects.length > 0)
    ? teacher.subjects.join(', ')
    : (teacher.category || 'Asignaturas asignadas');

  const teacherLevelsText = (teacher.levels && teacher.levels.length > 0)
    ? teacher.levels.join(', ')
    : 'Todos los niveles asignados';

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden ${compact ? 'p-4' : 'p-6'}`}>
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150 dark:border-slate-700">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {title}
          </h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Selecciona tus días libres y horas disponibles al mes. Tus alumnos podrán reservar sus tutorías en estos huecos en su sección de Tutorías.
          </p>
        </div>

        {/* Action Save Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-300 animate-bounce" />
                ¡Guardado con éxito!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Agenda
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Banner showing Course / Subjects mapping */}
      <div className="mt-4 p-3.5 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Sincronización de Tutorías y Asignaturas</p>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
              Tus huecos de disponibilidad se publicarán automáticamente en la agenda de los alumnos para:
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px]">
          <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300">
            <BookOpen className="w-3 h-3" /> {teacherSubjectsText}
          </span>
          <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300">
            <Layers className="w-3 h-3" /> {teacherLevelsText}
          </span>
        </div>
      </div>

      {/* Presets Toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Rellenado Rápido:</span>
        <button
          type="button"
          onClick={() => handleApplyPreset('mornings')}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors"
        >
          ☀️ Mañanas (10:00 - 11:30)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('afternoons')}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors"
        >
          🌆 Tardes (16:30 - 18:00)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('full')}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors"
        >
          ⚡ Lunes a Viernes
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('clear')}
          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 font-semibold text-xs rounded-lg transition-colors ml-auto"
        >
          <Trash2 className="w-3 h-3 inline mr-1" /> Limpiar Todo
        </button>
      </div>

      {/* Days of Week Schedule Grid */}
      <div className="mt-6 space-y-4">
        {DAYS_OF_WEEK.map(({ name, num }) => {
          const activeTimes = scheduleMap[num] || [];
          const hasTimes = activeTimes.length > 0;

          return (
            <div
              key={num}
              className={`p-4 rounded-xl border transition-all ${
                hasTimes
                  ? 'bg-slate-50/80 dark:bg-slate-900/40 border-indigo-200 dark:border-indigo-900/50 shadow-2xs'
                  : 'bg-slate-50/30 dark:bg-slate-900/20 border-slate-200/60 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Day Name & Count Badge */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider ${
                    hasTimes
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {hasTimes ? `${activeTimes.length} hora(s) disponible(s)` : 'Sin disponibilidad para este día'}
                  </span>
                </div>

                {/* Preset Hours Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESET_TIME_SLOTS.map(time => {
                    const isSelected = activeTimes.includes(time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleToggleTimeSlot(num, time)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400 dark:ring-indigo-500'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Selected Times & Custom Time Adder */}
              {hasTimes && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mr-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Horas fijadas:
                  </span>
                  {activeTimes.map(time => (
                    <span
                      key={time}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold"
                    >
                      {time}
                      <button
                        type="button"
                        onClick={() => handleRemoveTime(num, time)}
                        className="text-indigo-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Eliminar esta hora"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Custom Time Slot Input */}
              <div className="mt-2.5 flex items-center gap-2 max-w-xs">
                <input
                  type="text"
                  placeholder="Añadir hora p.ej. 15:30"
                  value={customTimeInput[num] || ''}
                  onChange={(e) => setCustomTimeInput({ ...customTimeInput, [num]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTime(num);
                    }
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono focus:ring-2 focus:ring-indigo-500 outline-none w-36"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustomTime(num)}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary Bar */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Total de días activos: <strong className="text-slate-900 dark:text-white">{Object.values(scheduleMap).filter(t => t.length > 0).length} días</strong> |
          Total de huecos mensuales/semanales: <strong className="text-slate-900 dark:text-white">{Object.values(scheduleMap).reduce((acc, curr) => acc + curr.length, 0)} slots</strong>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSaving ? 'Guardando...' : 'Guardar y Sincronizar Agenda'}
        </button>
      </div>
    </div>
  );
};
