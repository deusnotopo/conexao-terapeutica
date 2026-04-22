import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useWellbeing } from '../../hooks/useWellbeing';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import {
  ChevronLeft,
  Heart,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MOODS = [
  { key: 'great', emoji: '💪', label: 'Energizado', color: colors.success },
  { key: 'good', emoji: '🙂', label: 'Bem', color: colors.primary },
  { key: 'tired', emoji: '😴', label: 'Cansado', color: colors.warning },
  {
    key: 'overwhelmed',
    emoji: '💔',
    label: 'Sobrecarregado',
    color: colors.error,
  },
];

// TIPS moved to hook for logic decoupling

export const WellbeingScreen = ({ navigation }: any) => {
  const { user } = useUser();
  const { 
    wellbeing, 
    loading, 
    saveWellbeing, 
    refresh, 
    tip, 
    todayEntry, 
    today 
  } = useWellbeing(user?.id ?? "");
  
  const [saving, setSaving] = useState(false);
  const [mood, setMood] = useState('good');
  const [notes, setNotes] = useState('');

  // Update local state when todayEntry changes (e.g. after sync)
  useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.mood);
      setNotes(todayEntry.notes ?? "");
    }
  }, [todayEntry]);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveWellbeing({
      date: today,
      mood,
      notes,
    });

    if (result.success) {
      if (!todayEntry) setNotes('');
    }
    setSaving(false);
  };

  const getMoodCfg = (key: any) => MOODS.find((m: any) => m.key === key) || MOODS[1];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Bem-Estar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.tipCard}>
          <Heart color="#dc2626" size={20} fill="#dc262640" />
          <Text style={styles.tipText}>{tip}</Text>
        </View>

        <View style={styles.checkInCard}>
          <Text style={styles.checkInTitle}>Como você está hoje?</Text>
          <Text style={styles.checkInDate}>
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })
              .charAt(0)
              .toUpperCase() +
              format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR }).slice(
                1
              )}
          </Text>

          <View style={styles.moodGrid}>
            {MOODS.map((m: any) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.moodBtn,
                  mood === m.key && {
                    borderColor: m.color,
                    backgroundColor: `${m.color}10`,
                  },
                ]}
                onPress={() => setMood(m.key)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    mood === m.key && { color: m.color, fontWeight: '700' as const },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Quer desabafar? Escreva o que quiser... Tudo fica seguro aqui. 🤍"
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textSecondary}
          />

          <Button
            title={
              saving
                ? 'Salvando...'
                : `${todayEntry ? 'Atualizar' : 'Registrar'} Bem-Estar`
            }
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: spacing.m }}
          />
        </View>

        {wellbeing.length > 1 && (
          <>
            <Text style={styles.section}>Últimas 2 semanas</Text>
            <View style={styles.moodHistory}>
              {wellbeing.map((e: any) => {
                const cfg = getMoodCfg(e.mood);
                return (
                  <View
                    key={e.id}
                    style={[styles.historyDot, { backgroundColor: cfg.color }]}
                  >
                    <Text style={styles.historyEmoji}>{cfg.emoji}</Text>
                    <Text style={styles.historyDay}>
                      {format(new Date(e.date + 'T12:00:00'), 'dd/MM')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
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
  backBtn: { padding: 4 },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
  },
  tipCard: {
    flexDirection: 'row',
    gap: spacing.m,
    alignItems: 'flex-start',
    backgroundColor: `${colors.error}10`,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: `${colors.error}20`,
  },
  tipText: {
    ...(typography.body2 as object),
    color: colors.error,
    flex: 1,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  checkInCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.l,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  checkInTitle: {
    ...(typography.h3 as object),
    color: colors.primaryDark,
    marginBottom: 4,
  },
  checkInDate: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    marginBottom: spacing.l,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  moodBtn: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  moodEmoji: { fontSize: 28, marginBottom: 6 },
  moodLabel: { ...(typography.body2 as object), color: colors.textSecondary },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    ...(typography.body1 as object),
    color: colors.text,
    textAlignVertical: 'top',
  },
  section: { ...(typography.h3 as object), marginBottom: spacing.m, fontSize: 18 },
  moodHistory: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
  historyDot: {
    alignItems: 'center',
    padding: spacing.s,
    borderRadius: 10,
    minWidth: 50,
    opacity: 0.85,
  },
  historyEmoji: { fontSize: 18 },
  historyDay: {
    ...(typography.caption as object),
    color: colors.surface,
    marginTop: 2,
    fontWeight: '600' as const,
  },
});
