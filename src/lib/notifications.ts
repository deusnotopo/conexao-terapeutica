import { Medication, Event } from './schemas';

// These APIs are web-only — guarded at runtime with typeof window checks.
// Declared here to avoid TS errors in a React Native (non-DOM) tsconfig.
declare const window: Record<string, unknown> | undefined;
declare class Notification {
  static readonly permission: 'default' | 'granted' | 'denied';
  static requestPermission(): Promise<'default' | 'granted' | 'denied'>;
  constructor(title: string, options?: { body?: string; icon?: string; tag?: string });
}

// ─── Permission ───────────────────────────────────────────────────────────────

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in (window ?? {}))) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// ─── Medication Reminders ─────────────────────────────────────────────────────

export const scheduleNotificationsForToday = async (medications: Medication[]): Promise<void> => {
  if (typeof window === 'undefined' || !('Notification' in (window ?? {}))) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();

  medications.forEach((med) => {
    if (!med.is_active) return;
    const times = med.reminder_times || [];
    times.forEach((timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      const scheduleTime = new Date();
      scheduleTime.setHours(h, m, 0, 0);
      const delay = scheduleTime.getTime() - now.getTime();
      if (delay > 0) {
        setTimeout(() => {
          new Notification('💊 Hora do Medicamento!', {
            body: `${med.name}${med.dosage ? ` — ${med.dosage}` : ''}`,
            icon: '/favicon.ico',
            tag: `med-${med.id}-${timeStr}`,
          });
        }, delay);
      }
    });
  });
};

// ─── Agenda / Event Reminders ─────────────────────────────────────────────────

type EventWithTime = Pick<Event, 'id' | 'title'> & { date: string; time?: string };

export const scheduleEventReminder = async (
  event: EventWithTime,
  minutesBefore: number = 30
): Promise<void> => {
  if (typeof window === 'undefined' || !('Notification' in (window ?? {}))) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;
  if (!event.date || !event.time) return;

  const [year, month, day] = event.date.split('-').map(Number);
  const [hour, minute] = event.time.split(':').map(Number);
  const eventDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  const reminderDate = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);

  const delay = reminderDate.getTime() - Date.now();
  if (delay <= 0) return;

  setTimeout(() => {
    new Notification(`📅 Lembrete: ${event.title}`, {
      body: minutesBefore > 0
        ? `Em ${minutesBefore} minutos — ${formatTime(hour, minute)}`
        : `Agora! ${formatTime(hour, minute)}`,
      icon: '/favicon.ico',
      tag: `event-${event.id}`,
    });
  }, delay);
};

export const scheduleRemindersForEvents = async (
  events: EventWithTime[],
  minutesBefore: number = 30
): Promise<void> => {
  if (!Array.isArray(events)) return;
  for (const event of events) {
    await scheduleEventReminder(event, minutesBefore);
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (h: number, m: number): string =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
