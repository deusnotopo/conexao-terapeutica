import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DateInput = string | Date | null | undefined;

/**
 * Safely parse a date value that may be a string, Date, or date-only string.
 * Appends 'T12:00:00' to date-only strings to avoid timezone shift.
 */
const safeParse = (value: DateInput): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(str + 'T12:00:00');
  }
  return parseISO(str);
};

/** "18/03/2024" */
export const formatShort = (value: DateInput): string => {
  try { return format(safeParse(value), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return '—'; }
};

/** "18/03/24" */
export const formatShortYear2 = (value: DateInput): string => {
  try { return format(safeParse(value), 'dd/MM/yy', { locale: ptBR }); }
  catch { return '—'; }
};

/** "18 de março de 2024" */
export const formatLong = (value: DateInput): string => {
  try { return format(safeParse(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); }
  catch { return '—'; }
};

/** "18 mar, 2024" */
export const formatMedium = (value: DateInput): string => {
  try { return format(safeParse(value), 'dd MMM, yyyy', { locale: ptBR }); }
  catch { return '—'; }
};

/** "Hoje", "Ontem", or "18/03/2024" */
export const formatRelative = (value: DateInput): string => {
  try {
    const d = safeParse(value);
    if (isToday(d)) return 'Hoje';
    if (isYesterday(d)) return 'Ontem';
    return format(d, 'dd/MM/yyyy', { locale: ptBR });
  } catch { return '—'; }
};

/** "segunda, 18 de mar" */
export const formatWeekday = (value: DateInput): string => {
  try { return format(safeParse(value), "EEEE, dd 'de' MMM", { locale: ptBR }); }
  catch { return '—'; }
};
