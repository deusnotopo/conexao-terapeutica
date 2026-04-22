import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication, Vaccine, Consultation } from '../lib/schemas';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Notification Service (Akita Mode — TypeScript)
 * Centralizes all local notification scheduling logic.
 * 
 * Bug fixed: syncConsultationReminders was declared TWICE — the second
 * definition silently overwrote the first in JS. Removed the duplicate.
 */
export const notificationService = {
  /**
   * Request permissions for notifications.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  /**
   * Cancel all notifications matching a given category.
   */
  async cancelByCategory(category: string): Promise<void> {
    if (Platform.OS === 'web') return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.category === category) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  },

  /**
   * Sync Medication Reminders.
   * Schedules recurring daily notifications for each reminder_time.
   */
  async syncMedicationReminders(medications: Medication[]): Promise<void> {
    if (Platform.OS === 'web') return;
    
    await this.cancelByCategory('medication');
    if (!medications?.length) return;

    for (const med of medications) {
      if (!med.is_active || !med.reminder_times?.length) continue;

      for (const timeStr of med.reminder_times) {
        const [hour, minute] = timeStr.split(':').map(Number);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💊 Hora do Medicamento',
            body: `Está na hora de tomar: ${med.name}${med.dosage ? ` (${med.dosage})` : ''}`,
            data: { category: 'medication', medicationId: med.id },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour,
            minute,
            repeats: true,
          },
        });
      }
    }
  },

  /**
   * Sync Vaccine Reminders.
   * Schedules a one-off notification for the next dose date.
   */
  async syncVaccineReminders(vaccines: Vaccine[]): Promise<void> {
    if (Platform.OS === 'web') return;
    
    await this.cancelByCategory('vaccine');
    if (!vaccines?.length) return;

    for (const vax of vaccines) {
      if (!vax.next_dose_date) continue;

      const date = new Date(vax.next_dose_date + 'T08:00:00');
      if (date < new Date()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💉 Lembrete de Vacina',
          body: `A vacina ${vax.name} está agendada para hoje.`,
          data: { category: 'vaccine', vaccineId: vax.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
    }
  },

  /**
   * Sync Consultation Reminders.
   * Schedules a notification 1 hour before the consultation.
   */
  async syncConsultationReminders(consultations: Consultation[]): Promise<void> {
    if (Platform.OS === 'web') return;
    
    await this.cancelByCategory('agenda');
    if (!consultations?.length) return;

    for (const c of consultations) {
      if (!c.date) continue;

      const startTime = new Date(c.date);
      const triggerTime = new Date(startTime.getTime() - 60 * 60 * 1000);

      if (triggerTime < new Date()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🗓️ Lembrete de Consulta',
          body: `Consulta de ${c.specialty} em 1 hora.`,
          data: { category: 'agenda', itemId: c.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
        },
      });
    }
  },

  /**
   * Alias for syncConsultationReminders (legacy support)
   */
  async syncAgenda(_events: unknown[], consultations: Consultation[]): Promise<void> {
    await this.syncConsultationReminders(consultations);
  },

  /**
   * Schedules a generic one-time notification.
   */
  async scheduleOneTimeNotification(
    title: string,
    body: string,
    delaySeconds: number = 0
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: delaySeconds > 0
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds }
        : null,
    });
  },

  /**
   * Generic success/failure notification for Sync Queue.
   */
  async notifySyncResult(success: boolean, count: number): Promise<void> {
    if (Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: success ? '✅ Sincronização Concluída' : '⚠️ Falha na Sincronização',
        body: success 
          ? `Sucesso ao sincronizar ${count} alteração(ões).`
          : 'Houve um erro ao sincronizar seus dados offline. Tentaremos novamente em breve.',
      },
      trigger: null,
    });
  },
};
