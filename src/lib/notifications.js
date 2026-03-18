// Web Notifications Helper
// Requests permission and schedules browser notifications for medication reminders

export const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const scheduleNotificationsForToday = async (medications) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    medications.forEach(med => {
        if (!med.is_active) return;
        const times = med.reminder_times || [];
        times.forEach(timeStr => {
            const [h, m] = timeStr.split(':').map(Number);
            const scheduleTime = new Date();
            scheduleTime.setHours(h, m, 0, 0);
            const delay = scheduleTime - now;
            if (delay > 0) {
                setTimeout(() => {
                    new Notification(`💊 Hora do Medicamento!`, {
                        body: `${med.name}${med.dosage ? ` — ${med.dosage}` : ''}`,
                        icon: '/favicon.ico',
                        tag: `med-${med.id}-${timeStr}`,
                    });
                }, delay);
            }
        });
    });
};
