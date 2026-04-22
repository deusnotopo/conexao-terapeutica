declare const window: any;
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { showToast } from '../../components/Toast';
import { useAgenda } from '../../hooks/useAgenda';
import { useUser } from '../../context/UserContext';
import { EventSchema } from '../../lib/schemas';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Type,
  Trash2,
} from 'lucide-react-native';
import { scheduleEventReminder } from '../../lib/notifications';

const EVENT_TYPES = [
  'Equoterapia',
  'Fisioterapia',
  'Fonoaudiologia',
  'T. Ocupacional',
  'Médico',
  'Retorno',
  'Exame',
  'Outro',
];

const toDisplayDate = (iso: any) => {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const toDisplayTime = (iso: any) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
};

export const EventFormScreen = ({ navigation, route }: any) => {
  const { activeDependent } = useUser();
  const { addEvent, updateEvent, deleteEvent } = useAgenda(activeDependent?.id ?? "", "upcoming");
  const event = route.params?.event || null;
  const isEditing = !!event;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [title, setTitle] = useState(event?.title || '');
  const [eventType, setEventType] = useState(event?.event_type || 'Equoterapia');
  
  const getTodayFormatted = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const [date, setDate] = useState(isEditing ? toDisplayDate(event.start_time) : getTodayFormatted());
  const [time, setTime] = useState(isEditing ? toDisplayTime(event.start_time) : '10:00');
  const [location, setLocation] = useState(event?.location || 'Clínica Unicórnio');
  const [description, setDescription] = useState(event?.description || '');
  const [preNotes, setPreNotes] = useState(event?.pre_notes || '');

  const handleDateChange = (text: any) => {
    let raw = text.replace(/\D/g, '').substring(0, 8);
    if (raw.length > 4)
      raw = raw.substring(0, 2) + '/' + raw.substring(2, 4) + '/' + raw.substring(4);
    else if (raw.length > 2) raw = raw.substring(0, 2) + '/' + raw.substring(2);
    setDate(raw);
    setErrorMsg('');
  };

  const handleTimeChange = (text: any) => {
    let raw = text.replace(/\D/g, '').substring(0, 4);
    if (raw.length > 2) raw = raw.substring(0, 2) + ':' + raw.substring(2);
    setTime(raw);
    setErrorMsg('');
  };

  const handleSave = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      const dateParts = date.split('/');
      const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      const startTime = new Date(`${isoDate}T${time}:00`).toISOString();
      
      const payload = {
        title: title.trim(),
        event_type: eventType,
        description: description.trim() || null,
        pre_notes: preNotes.trim() || null,
        start_time: startTime,
        location: location.trim() || null,
        dependent_id: activeDependent?.id,
      };

      // Client-side validation with Zod
      const validation = EventSchema.omit({ id: true, created_at: true }).safeParse(payload);
      if (!validation.success) {
        const firstError = validation.error.issues[0]?.message || 'Dados inválidos';
        setErrorMsg(firstError);
        return;
      }

      let result;
      if (isEditing) {
        result = await updateEvent(event.id, validation.data);
      } else {
        result = await addEvent(validation.data);
      }

      if (result.success) {
        if (!isEditing) {
          // Schedule reminder for new events
          scheduleEventReminder({ 
            id: String(Date.now()), 
            title, 
            date: isoDate, 
            time 
          }, 30).catch(() => {});
        }
        navigation.goBack();
      } else {
        setErrorMsg(result.error ?? "");
      }
    } catch (e: any) {
      setErrorMsg('Não foi possível salvar o compromisso.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    // We can still use native confirm or a custom modal, but here we'll stick to a simple flow
    // or just assume the user confirmed (in a real app, use a proper Modal)
    // For now, I'll keep the logic but use the service.
    // The webAlert was imported. Wait, I removed the import.
    // Let's use a simple confirm for now if available, or just the service logic.
    const confirmed = window.confirm(`Excluir "${event.title}" permanentemente?`);
    if (!confirmed) return;

    (async () => {
      setLoading(true);
      const result = await deleteEvent(event.id);
      setLoading(false);
      
      if (result.success) {
        navigation.goBack();
      } else {
        setErrorMsg(result.error ?? "");
      }
    })();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Compromisso' : 'Novo Compromisso'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Input
          label="Título"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Sessão de Equoterapia"
          icon={<Type size={20} color={colors.textSecondary} />}
        />

        <Text style={styles.label}>Tipo de Atividade</Text>
        <View style={styles.chips}>
          {EVENT_TYPES.map((t: any) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, eventType === t && styles.chipActive]}
              onPress={() => setEventType(t)}
            >
              <Text
                style={[
                  styles.chipText,
                  eventType === t && styles.chipTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: spacing.s }}>
            <Input
              label="Data (DD/MM/AAAA)"
              value={date}
              onChangeText={handleDateChange}
              placeholder="20/03/2026"
              keyboardType="numeric"
              icon={<Calendar size={20} color={colors.textSecondary} />}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.s }}>
            <Input
              label="Horário (HH:MM)"
              value={time}
              onChangeText={handleTimeChange}
              placeholder="14:00"
              keyboardType="numeric"
              icon={<Clock size={20} color={colors.textSecondary} />}
            />
          </View>
        </View>

        <Input
          label="Local"
          value={location}
          onChangeText={setLocation}
          placeholder="Clínica, Hospital, etc."
          icon={<MapPin size={20} color={colors.textSecondary} />}
        />

        <Input
          label="Observações"
          value={description}
          onChangeText={setDescription}
          placeholder="Detalhes extras sobre o compromisso..."
          multiline
          numberOfLines={3}
        />

        <Input
          label="📝 Anotações Pré-Atividade"
          value={preNotes}
          onChangeText={setPreNotes}
          placeholder="Perguntas ou observações para este dia..."
          multiline
          numberOfLines={4}
        />

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Agendar Compromisso'}
            onPress={handleSave}
            loading={loading}
          />

          {isEditing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Trash2 color={colors.error} size={20} />
              <Text style={styles.deleteText}>Excluir Compromisso</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    height: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 4 },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
  },
  label: {
    ...(typography.body2 as object),
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.s,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    ...(typography.caption as object),
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  chipTextActive: { color: colors.surface },
  row: { flexDirection: 'row' },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: spacing.m,
    marginVertical: spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontWeight: '500' as const },
  actions: { marginTop: spacing.xl, gap: spacing.m },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.m,
    borderRadius: 12,
    backgroundColor: '#fee2e220',
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    gap: spacing.s,
  },
  deleteText: { ...(typography.body2 as object), color: colors.error, fontWeight: '600' as const },
});
