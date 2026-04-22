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
import { useDiary } from '../../hooks/useDiary';
import { webAlert } from '../../lib/webAlert';
import { showToast } from '../../components/Toast';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { ChevronLeft, BookOpen, Send, Trash2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MOODS = [
  { key: 'great', emoji: '😄', label: 'Ótimo dia' },
  { key: 'good', emoji: '🙂', label: 'Dia normal' },
  { key: 'hard', emoji: '😔', label: 'Dia difícil' },
  { key: 'very_hard', emoji: '😢', label: 'Muito difícil' },
];

export const ParentDiaryScreen = ({ navigation }: any) => {
  const { activeDependent } = useUser();
  const { entries: diary, loading, addEntry, deleteEntry, refresh } = useDiary(activeDependent?.id);
  const [saving, setSaving] = useState(false);
  const [mood, setMood] = useState('good');
  const [content, setContent] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = diary.find((e: any) => e.date === today);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const result = await addEntry({ date: today, mood, content });
    if (result.success) {
      setContent('');
    } else {
      showToast(result.error || 'Erro ao salvar entrada.', 'error');
    }
    setSaving(false);
  };

  const getMoodConfig = (key) => MOODS.find((m: any) => m.key === key) || MOODS[1];

  const handleDelete = (entry) => {
    webAlert(
      'Excluir Entrada',
      'Deseja excluir esta entrada do diário? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteEntry(entry.id);
            if (!result.success) showToast(result.error || 'Erro ao excluir.', 'error');
          },
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Diário dos Pais</Text>
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
        {/* New Entry Card */}
        <View style={styles.newEntryCard}>
          <Text style={styles.newEntryTitle}>Como foi hoje?</Text>
          <Text style={styles.newEntrySubtitle}>
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })
              .charAt(0)
              .toUpperCase() +
              format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR }).slice(
                1
              )}
          </Text>

          <View style={styles.moodRow}>
            {MOODS.map((m: any) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.moodBtn, mood === m.key && styles.moodBtnActive]}
                onPress={() => setMood(m.key)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    mood === m.key && styles.moodLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textInput}
            value={content}
            onChangeText={setContent}
            placeholder={
              todayEntry
                ? `Já registrou hoje. Escreva para sobrescrever...\n"${todayEntry.content.substring(0, 60)}..."`
                : 'Como foi o dia? O que aconteceu de especial? Algo que você quer lembrar...'
            }
            multiline
            numberOfLines={5}
            placeholderTextColor={colors.textSecondary}
          />

          <Button
            title={
              saving
                ? 'Salvando...'
                : `${todayEntry ? 'Atualizar' : 'Registrar'} no Diário`
            }
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: spacing.m }}
          />
        </View>

        {/* Past Entries */}
        {diary.length > 0 && (
          <Text style={styles.section}>Entradas Anteriores</Text>
        )}
        {diary.map((entry: any) => {
          const moodCfg = getMoodConfig(entry.mood);
          const isPast = entry.date !== today;
          return (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryEmoji}>{moodCfg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryDate}>
                    {format(
                      new Date(entry.date + 'T12:00:00'),
                      'EEEE, dd/MM/yyyy',
                      { locale: ptBR }
                    )
                      .charAt(0)
                      .toUpperCase() +
                      format(
                        new Date(entry.date + 'T12:00:00'),
                        'EEEE, dd/MM/yyyy',
                        { locale: ptBR }
                      ).slice(1)}
                  </Text>
                  <Text style={styles.entryMoodLabel}>{moodCfg.label}</Text>
                </View>
                {isPast && (
                  <TouchableOpacity
                    onPress={() => handleDelete(entry)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 color={colors.error} size={16} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.entryContent}>{entry.content}</Text>
            </View>
          );
        })}
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
  newEntryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.l,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  newEntryTitle: {
    ...(typography.h3 as object),
    color: colors.primaryDark,
    marginBottom: 4,
  },
  newEntrySubtitle: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  moodRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.m },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodBtnActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontSize: 10,
  },
  moodLabelActive: { color: colors.primary, fontWeight: '600' as const },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    ...(typography.body1 as object),
    color: colors.text,
    textAlignVertical: 'top',
  },
  section: { ...(typography.h3 as object), marginBottom: spacing.m, fontSize: 18 },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.s,
  },
  entryEmoji: { fontSize: 30 },
  entryDate: { ...(typography.body2 as object), fontWeight: '600' as const, color: colors.text },
  entryMoodLabel: { ...(typography.caption as object), color: colors.textSecondary },
  entryContent: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: `${colors.error}10`,
    borderRadius: 8,
  },
});
