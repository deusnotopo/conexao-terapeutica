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
import { useUser } from '../../context/UserContext';
import { useGrowth } from '../../hooks/useGrowth';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft, Calendar } from 'lucide-react-native';

const toDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const GrowthFormScreen = ({ navigation, route }: any) => {
  const { activeDependent } = useUser();
  const { addMeasurement, updateMeasurement } = useGrowth(activeDependent?.id);
  const growth = route.params?.growth || null;
  const isEditing = !!growth;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [date, setDate] = useState(toDisplay(growth?.date) || '');
  const [weight, setWeight] = useState(growth?.weight_kg ? String(growth.weight_kg) : '');
  const [height, setHeight] = useState(growth?.height_cm ? String(growth.height_cm) : '');
  const [head, setHead] = useState(growth?.head_cm ? String(growth.head_cm) : '');
  const [notes, setNotes] = useState(growth?.notes || '');

  const maskDate = (text) => {
    let raw = text.replace(/\D/g, '').substring(0, 8);
    if (raw.length > 4)
      raw =
        raw.substring(0, 2) +
        '/' +
        raw.substring(2, 4) +
        '/' +
        raw.substring(4);
    else if (raw.length > 2) raw = raw.substring(0, 2) + '/' + raw.substring(2);
    return raw;
  };
  
  const toISO = (d) => {
    const p = d.split('/');
    return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : null;
  };

  const handleSave = async () => {
    if (!date) {
      setErrorMsg('Data é obrigatória.');
      return;
    }
    if (!weight && !height && !head) {
      setErrorMsg('Preencha pelo menos um campo de medição.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    
    try {
      const payload = {
        date: toISO(date),
        weight_kg: weight ? parseFloat(weight.replace(',', '.')) : null,
        height_cm: height ? parseFloat(height.replace(',', '.')) : null,
        head_cm: head ? parseFloat(head.replace(',', '.')) : null,
        notes,
      };

      let success = false;
      if (isEditing) {
        success = await updateMeasurement(growth.id, payload);
      } else {
        (payload as any).dependent_id = activeDependent.id;
        success = await addMeasurement(payload);
      }

      if (success) {
        navigation.goBack();
      }
    } catch (e) {
      setErrorMsg((e as Error)?.message || 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Medição' : 'Nova Medição'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Preencha os campos disponíveis. Todos são opcionais exceto a
            data.
          </Text>
        </View>
        <Input
          label="Data da Medição (DD/MM/AAAA)"
          value={date}
          onChangeText={(t) => setDate(maskDate(t))}
          placeholder="Ex: 18/03/2026"
          keyboardType="numeric"
          icon={<Calendar size={18} color={colors.textSecondary} />}
        />
        <Input
          label="⚖️ Peso (kg)"
          value={weight}
          onChangeText={setWeight}
          placeholder="Ex: 22.5"
          keyboardType="decimal-pad"
        />
        <Input
          label="📏 Altura (cm)"
          value={height}
          onChangeText={setHeight}
          placeholder="Ex: 110.5"
          keyboardType="decimal-pad"
        />
        <Input
          label="🧠 Perímetro Cefálico (cm)"
          value={head}
          onChangeText={setHead}
          placeholder="Ex: 52.3"
          keyboardType="decimal-pad"
        />
        <Input
          label="Observações"
          value={notes}
          onChangeText={setNotes}
          placeholder="Ex: Medido na consulta com Dr. Silva, sem sapatos."
          multiline
          numberOfLines={3}
        />
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Registrar Medição'}
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
  infoBox: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
  },
  infoText: { ...(typography.body2 as object), color: colors.primaryDark },
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
  }
});
