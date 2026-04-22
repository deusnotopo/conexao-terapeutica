import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { showToast } from '../../components/Toast';
import { useUser } from '../../context/UserContext';
import { useExpenses } from '../../hooks/useExpenses';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  Trash2,
  FileText,
} from 'lucide-react-native';
import { webAlert } from '../../lib/webAlert';

const CATEGORIES = [
  'Consulta',
  'Terapia',
  'Remédio',
  'Exame',
  'Transporte',
  'Equipamento',
  'Outro',
];

export const ExpenseFormScreen = ({ navigation, route }: any) => {
  const { activeDependent } = useUser();
  const { addExpense, updateExpense, removeExpense } = useExpenses(activeDependent?.id);
  const expense = route.params?.expense || null;
  const isEditing = !!expense;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [category, setCategory] = useState(expense?.category || '');
  const [description, setDescription] = useState(expense?.description || '');
  const [reimbursable, setReimbursable] = useState(!!expense?.reimbursable);
  const [reimbursed, setReimbursed] = useState(!!expense?.reimbursed);

  const getTodayFormatted = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const toDisplayDate = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const toDisplayAmount = (cents) => {
    if (cents === undefined || cents === null) return '';
    return (cents / 100).toFixed(2).replace('.', ',');
  };

  const [date, setDate] = useState(
    isEditing ? toDisplayDate(expense.date) : getTodayFormatted()
  );
  const [amountStr, setAmountStr] = useState(
    isEditing ? toDisplayAmount(expense.amount_cents) : ''
  );

  const handleDateChange = (text) => {
    let raw = text.replace(/\D/g, '').substring(0, 8);
    if (raw.length > 4)
      raw =
        raw.substring(0, 2) + '/' + raw.substring(2, 4) + '/' + raw.substring(4);
    else if (raw.length > 2)
      raw = raw.substring(0, 2) + '/' + raw.substring(2);
    setDate(raw);
    setErrorMsg('');
  };

  const handleAmountChange = (text) => {
    const clean = text.replace(/[^\d,]/g, '').replace(',', '.');
    setAmountStr(clean);
    setErrorMsg('');
  };

  const handleSave = async () => {
    if (!category || !date || !amountStr) {
      setErrorMsg('Categoria, Data e Valor são obrigatórios.');
      return;
    }

    const dateParts = date.split('/');
    if (dateParts.length !== 3 || dateParts[2].length !== 4) {
      setErrorMsg('Data inválida. Use DD/MM/AAAA.');
      return;
    }

    const amountCents = Math.round(
      parseFloat(amountStr.replace(',', '.')) * 100
    );
    if (isNaN(amountCents) || amountCents <= 0) {
      setErrorMsg('Valor inválido. Use o formato: 150,00');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      const payload = {
        dependent_id: activeDependent?.id,
        category,
        date: isoDate,
        description: description || null,
        amount_cents: amountCents,
        reimbursable,
        reimbursed: reimbursable ? reimbursed : false,
      };

      let success = false;
      if (isEditing) {
        success = await updateExpense(expense.id, payload);
      } else {
        success = await addExpense(payload);
      }

      if (success) {
        navigation.goBack();
      }
    } catch (e) {
      setErrorMsg((e as Error)?.message || 'Não foi possível salvar o gasto.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    webAlert('Excluir Gasto', 'Deseja excluir este registro permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const success = await removeExpense(expense.id);
          if (success) {
            navigation.goBack();
          }
        },
      },
    ]);
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
          {isEditing ? 'Editar Gasto' : 'Novo Gasto'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c: any) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text
                style={[
                  styles.chipText,
                  category === c && styles.chipTextActive,
                ]}
              >
                {c}
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
              placeholder="Ex: 18/03/2026"
              keyboardType="numeric"
              icon={<Calendar size={20} color={colors.textSecondary} />}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.s }}>
            <Input
              label="Valor (R$)"
              value={amountStr}
              onChangeText={handleAmountChange}
              placeholder="150,00"
              keyboardType="decimal-pad"
              icon={<DollarSign size={20} color={colors.textSecondary} />}
            />
          </View>
        </View>

        <Input
          label="Descrição (Opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Sessão de Equoterapia - Dr. Silva"
          icon={<FileText size={20} color={colors.textSecondary} />}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Reembolsável pelo Plano?</Text>
            <Text style={styles.switchSub}>
              Marque se este gasto permite reembolso.
            </Text>
          </View>
          <Switch
            value={reimbursable}
            onValueChange={(val) => {
              setReimbursable(val);
              if (!val) setReimbursed(false);
            }}
            trackColor={{ true: colors.primary }}
          />
        </View>

        {reimbursable && (
          <View style={[styles.switchRow, { marginTop: -spacing.m }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Status: Já Reembolsado?</Text>
              <Text style={styles.switchSub}>
                O valor já caiu na sua conta?
              </Text>
            </View>
            <Switch
              value={reimbursed}
              onValueChange={setReimbursed}
              trackColor={{ true: colors.success || '#10b981' }}
            />
          </View>
        )}

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Registrar Gasto'}
            onPress={handleSave}
            loading={loading}
          />

          {isEditing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Trash2 color={colors.error} size={20} />
              <Text style={styles.deleteText}>Excluir Registro</Text>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchTitle: { ...(typography.body2 as object), fontWeight: '600' as const, color: colors.text },
  switchSub: { ...(typography.caption as object), color: colors.textSecondary },
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
