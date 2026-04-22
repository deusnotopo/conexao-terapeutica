import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useGoals } from '../../hooks/useGoals';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Plus,
  Target,
  CheckCircle,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Pencil,
} from 'lucide-react-native';
import { webAlert } from '../../lib/webAlert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: colors.textSecondary, icon: Circle },
  in_progress: { label: 'Em Progresso', color: colors.secondary, icon: Clock },
  achieved: { label: 'Conquistado! 🎉', color: '#16a34a', icon: CheckCircle },
};

const PAGE_SIZE = 20;

export const GoalsScreen = ({ navigation }: any) => {
  const { activeDependent } = useUser();
  const {
    goals,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    total,
    refresh,
    loadMore,
    updateGoal,
    getGoalNotes,
    addGoalNote,
  } = useGoals(activeDependent?.id);

  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState({});
  const [newNote, setNewNote] = useState({});
  const [addingNote, setAddingNote] = useState(null);

  const fetchNotes = async (goalId) => {
    const result = await getGoalNotes(goalId);
    if (result.success) {
      setNotes((prev) => ({ ...prev, [goalId]: result.data }));
    }
  };

  const handleExpand = (goalId) => {
    if (expanded === goalId) {
      setExpanded(null);
      return;
    }
    setExpanded(goalId);
    fetchNotes(goalId);
  };

  const handleAddNote = async (goalId) => {
    const text = (newNote[goalId] || '').trim();
    if (!text) return;
    
    const result = await addGoalNote(goalId, text);
    if (result.success) {
      setNewNote((prev) => ({ ...prev, [goalId]: '' }));
      setAddingNote(null);
      fetchNotes(goalId);
    }
  };

  const handleStatusChange = async (goal) => {
    const nextStatus = {
      pending: 'in_progress',
      in_progress: 'achieved',
      achieved: 'pending',
    };
    const next = nextStatus[goal.status];
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      achieved: 'Conquistado 🎉',
    };
    webAlert('Atualizar Meta', `Marcar como: "${labels[next]}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          const updates = { status: next };
          if (next === 'achieved')
            (updates as any).achieved_at = new Date().toISOString().split('T')[0];
          
          await updateGoal(goal.id, updates);
        },
      },
    ]);
  };

  const achieved = goals.filter((g: any) => g.status === 'achieved');
  const active = goals.filter((g: any) => g.status !== 'achieved');

  const renderGoalCard = (goal) => {
    const cfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    const isOpen = expanded === goal.id;
    const goalNotes = notes[goal.id] || [];
    return (
      <View
        key={goal.id}
        style={[styles.card, goal.status === 'achieved' && styles.achievedCard]}
      >
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() => handleStatusChange(goal)}
        >
          <Icon color={cfg.color} size={22} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{goal.title}</Text>
            {goal.description ? (
              <Text style={styles.cardDesc}>{goal.description}</Text>
            ) : null}
            {goal.target_date ? (
              <Text style={styles.cardDate}>
                📅 Prazo: {goal.target_date.split('-').reverse().join('/')}
              </Text>
            ) : null}
            <Text style={[styles.statusBadge, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('GoalForm', { goal })}
          >
            <Pencil color={colors.primary} size={14} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.expandBtn}
            onPress={() => handleExpand(goal.id)}
          >
            <MessageSquare
              color={isOpen ? colors.primary : colors.textSecondary}
              size={16}
            />
            {goalNotes.length > 0 && !isOpen && (
              <Text style={styles.noteCount}>{goalNotes.length}</Text>
            )}
            {isOpen ? (
              <ChevronUp color={colors.primary} size={16} />
            ) : (
              <ChevronDown color={colors.textSecondary} size={16} />
            )}
          </TouchableOpacity>
        </View>
        {isOpen && (
          <View style={styles.notesSection}>
            {goalNotes.map((n: any) => (
              <View key={n.id} style={styles.noteItem}>
                <Text style={styles.noteDate}>
                  {format(new Date(n.created_at), "dd/MM/yy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </Text>
                <Text style={styles.noteText}>{n.note}</Text>
              </View>
            ))}
            {goalNotes.length === 0 && (
              <Text style={styles.noNotes}>Nenhuma nota ainda.</Text>
            )}
            {addingNote === goal.id ? (
              <View style={styles.noteInputRow}>
                <TextInput
                  style={styles.noteInput}
                  value={newNote[goal.id] || ''}
                  onChangeText={(t) =>
                    setNewNote((prev) => ({ ...prev, [goal.id]: t }))
                  }
                  placeholder="Descreva o progresso..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  autoFocus
                />
                <View style={styles.noteInputBtns}>
                  <TouchableOpacity
                    style={styles.cancelNoteBtn}
                    onPress={() => setAddingNote(null)}
                  >
                    <Text style={styles.cancelNoteText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveNoteBtn}
                    onPress={() => handleAddNote(goal.id)}
                  >
                    <Text style={styles.saveNoteText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addNoteBtn}
                onPress={() => setAddingNote(goal.id)}
              >
                <Plus color={colors.primary} size={14} />
                <Text style={styles.addNoteText}>Registrar Progresso</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metas Terapêuticas</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('GoalForm')}
          style={styles.addBtn}
        >
          <Plus color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
          />
        }
      >
        {goals.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Target color={colors.border} size={48} />
            <Text style={styles.emptyTitle}>Nenhuma meta cadastrada</Text>
            <Text style={styles.emptyText}>
              Toque no + para registrar a primeira meta terapêutica.
            </Text>
          </View>
        ) : null}

        {active.length > 0 && (
          <>
            <Text style={styles.section}>Metas Ativas</Text>
            {active.map(renderGoalCard)}
          </>
        )}
        {achieved.length > 0 && (
          <>
            <Text style={[styles.section, { color: '#16a34a' }]}>
              ✅ Conquistas
            </Text>
            {achieved.map(renderGoalCard)}
          </>
        )}

        {goals.length > 0 && (
          <Text style={styles.counter}>
            Exibindo {goals.length} de {total} meta{total !== 1 ? 's' : ''}
          </Text>
        )}
        {hasMore && (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={loadMore}
            disabled={loadingMore}
          >
            <Text style={styles.loadMoreText}>
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </Text>
          </TouchableOpacity>
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
  backButton: { padding: 4 },
  addBtn: {
    padding: 8,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 10,
  },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
  },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.textSecondary },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: { ...(typography.h3 as object), marginBottom: spacing.m, marginTop: spacing.m },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  achievedCard: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.m },
  cardInfo: { flex: 1 },
  cardTitle: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  cardDesc: { ...(typography.body2 as object), color: colors.textSecondary, marginTop: 4 },
  cardDate: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 6,
  },
  statusBadge: { ...(typography.caption as object), fontWeight: '700' as const, marginTop: 4 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.s,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editBtn: {
    padding: 6,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteCount: {
    ...(typography.caption as object),
    color: colors.primary,
    fontWeight: '700' as const,
  },
  notesSection: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noteItem: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.m,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteDate: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginBottom: 4,
  },
  noteText: { ...(typography.body2 as object), color: colors.text },
  noNotes: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  noteInputRow: { marginTop: spacing.s },
  noteInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.primary,
    ...(typography.body2 as object),
    color: colors.text,
    minHeight: 72,
  },
  noteInputBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  cancelNoteBtn: { padding: spacing.s },
  cancelNoteText: { ...(typography.body2 as object), color: colors.textSecondary },
  saveNoteBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  saveNoteText: {
    ...(typography.body2 as object),
    color: colors.surface,
    fontWeight: '700' as const,
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.s,
  },
  addNoteText: {
    ...(typography.caption as object),
    color: colors.primary,
    fontWeight: '700' as const,
  },
  counter: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.m,
  },
  loadMoreBtn: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  loadMoreText: {
    ...(typography.body2 as object),
    color: colors.primary,
    fontWeight: '700' as const,
  },
});
