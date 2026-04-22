import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { showToast } from '../../components/Toast';
import { useGoals } from '../../hooks/useGoals';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft, Target, Calendar, AlignLeft, Trash2 } from 'lucide-react-native';
import { webAlert } from '../../lib/webAlert';

const STATUS_OPTS = [
  { value: 'pending', label: '⏳ Pendente', color: '#d97706' },
  { value: 'in_progress', label: '🔄 Em Progresso', color: '#3b82f6' },
  { value: 'achieved', label: '✅ Concluída', color: '#16a34a' },
  { value: 'abandoned', label: '❌ Cancelada', color: '#6b7280' },
];

const EXAMPLES = [
  'Ficar em pé sem apoio por 10 segundos',
  'Dizer 5 palavras novas',
  'Montar um quebra-cabeça de 10 peças',
  'Usar a colher sozinho',
  'Completar uma terapia sem choro',
];

export const GoalFormScreen = ({ navigation, route }: any) => {
  const { activeDependent } = useUser();
  const goal = route.params?.goal;
  const isEdit = !!goal;

  const { createGoal, updateGoal, deleteGoal } = useGoals(activeDependent?.id);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [status, setStatus] = useState(goal?.status || 'pending');
  const [targetDate, setTargetDate] = useState('');

  // Date handlers
  const toDisplay = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const toISO = (masked) => {
    const p = masked.split('/');
    return p.length === 3 && p[2].length === 4 ? `${p[2]}-${p[1]}-${p[0]}` : null;
  };

  useEffect(() => {
    if (goal?.target_date) {
      setTargetDate(toDisplay(goal.target_date));
    }
  }, [goal]);

  const handleDateChange = (text) => {
    let raw = text.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.substring(0, 8);
    let masked = raw;
    if (raw.length > 2) masked = raw.substring(0, 2) + '/' + raw.substring(2);
    if (raw.length > 4)
      masked = masked.substring(0, 5) + '/' + raw.substring(4);
    setTargetDate(masked);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('O título da meta é obrigatório.');
      return;
    }

    let isoDate = null;
    if (targetDate) {
      isoDate = toISO(targetDate);
      if (!isoDate) {
        setErrorMsg('Data inválida. Use DD/MM/AAAA.');
        return;
      }
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const payload = {
        title,
        description: description || null,
        target_date: isoDate,
        status,
        dependent_id: activeDependent.id,
      };

      let success;
      if (isEdit) {
        success = await updateGoal(goal.id, payload);
      } else {
        success = await createGoal(payload);
      }

      if (success) {
        showToast(isEdit ? 'Meta atualizada! ✅' : 'Meta criada com sucesso! 🎯');
        navigation.goBack();
      }
    } catch (e) {
      setErrorMsg((e as Error)?.message || 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    webAlert(
      'Excluir Meta',
      'Tem certeza que deseja remover esta meta permanentemente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteGoal(goal.id);
            if (success) {
              showToast('Meta removida.');
              navigation.goBack();
            }
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
          style={styles.backButton}
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Editar Meta' : 'Nova Meta'}</Text>
        {isEdit ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Trash2 color={colors.error} size={22} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Input
          label="Título da Meta"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Andar sozinho pelo corredor..."
          icon={<Target size={20} color={colors.textSecondary} />}
        />

        {!isEdit && (
          <>
            <Text style={styles.label}>Sugestões de metas</Text>
            <View style={styles.examples}>
              {EXAMPLES.map((e: any) => (
                <TouchableOpacity
                  key={e}
                  style={styles.example}
                  onPress={() => setTitle(e)}
                >
                  <Text style={styles.exampleText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {isEdit && (
          <>
            <Text style={styles.label}>Status da Meta</Text>
            <View style={styles.statusGrid}>
              {STATUS_OPTS.map((s: any) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.statusBtn,
                    status === s.value && {
                      borderColor: s.color,
                      backgroundColor: `${s.color}15`,
                    },
                  ]}
                  onPress={() => setStatus(s.value)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      status === s.value && { color: s.color, fontWeight: '700' as const },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Input
          label="Descrição / Como medir o progresso (Opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Como saberemos que a meta foi atingida?"
          multiline
          numberOfLines={3}
          icon={<AlignLeft size={20} color={colors.textSecondary} />}
        />

        <Input
          label="Prazo (DD/MM/AAAA) — Opcional"
          value={targetDate}
          onChangeText={handleDateChange}
          placeholder="Ex: 30/06/2026"
          keyboardType="numeric"
          icon={<Calendar size={20} color={colors.textSecondary} />}
        />

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Meta'}
          onPress={handleSave}
          loading={loading}
        />
      </View>
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
  deleteBtn: { padding: 8 },
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
  examples: { marginBottom: spacing.l, gap: spacing.s },
  example: {
    backgroundColor: `${colors.secondary}10`,
    borderRadius: 10,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: `${colors.secondary}30`,
  },
  exampleText: { ...(typography.body2 as object), color: colors.text },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  statusBtn: {
    width: '48%',
    padding: spacing.m,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  statusText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: spacing.m,
    marginVertical: spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontWeight: '500' as const },
  footer: {
    padding: spacing.l,
    paddingBottom: 40,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
