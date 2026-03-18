import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { showToast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft, Calendar, DollarSign } from 'lucide-react-native';

const CATEGORIES = ['Consulta', 'Terapia', 'Remédio', 'Exame', 'Transporte', 'Equipamento', 'Outro'];

export const AddExpenseScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [amountStr, setAmountStr] = useState('');
    const [reimbursable, setReimbursable] = useState(false);

    const handleDateChange = (text) => {
        let raw = text.replace(/\D/g, '');
        if (raw.length > 8) raw = raw.substring(0, 8);
        let masked = raw;
        if (raw.length > 2) masked = raw.substring(0, 2) + '/' + raw.substring(2);
        if (raw.length > 4) masked = masked.substring(0, 5) + '/' + raw.substring(4);
        setDate(masked);
    };

    const handleAmountChange = (text) => {
        // Allow numbers and a single comma or dot
        const clean = text.replace(/[^\d,]/g, '').replace(',', '.');
        setAmountStr(clean);
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
        const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        const amountCents = Math.round(parseFloat(amountStr.replace(',', '.')) * 100);
        if (isNaN(amountCents) || amountCents <= 0) {
            setErrorMsg('Valor inválido. Use o formato: 150,00');
            return;
        }
        setErrorMsg('');
        setLoading(true);
        try {
            const { error } = await supabase.from('expenses').insert([{
                dependent_id: activeDependent.id,
                category,
                date: isoDate,
                description,
                amount_cents: amountCents,
                reimbursable,
            }]);
            if (error) throw error;
            showToast('Gasto registrado!');
            navigation.goBack();
        } catch (e) {
            setErrorMsg(e?.message || 'Não foi possível salvar.');
        } finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Novo Gasto</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.chips}>
                    {CATEGORIES.map(c => (
                        <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Input label="Data (DD/MM/AAAA)" value={date} onChangeText={handleDateChange}
                    placeholder="Ex: 18/03/2026" keyboardType="numeric" icon={<Calendar size={20} color={colors.textSecondary} />} />
                <Input label="Valor (R$)" value={amountStr} onChangeText={handleAmountChange}
                    placeholder="150,00" keyboardType="decimal-pad" icon={<DollarSign size={20} color={colors.textSecondary} />} />
                <Input label="Descrição (Opcional)" value={description} onChangeText={setDescription} placeholder="Ex: Sessão de Equoterapia - Dr. Silva" />
                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Reembolsável pelo Plano de Saúde?</Text>
                    <Switch value={reimbursable} onValueChange={setReimbursable} trackColor={{ true: colors.primary }} />
                </View>
                {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
                <Button title={loading ? 'Salvando...' : 'Registrar Gasto'} onPress={handleSave} loading={loading} style={{ marginTop: spacing.m }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.m, height: 60,
        backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backButton: { padding: 4 },
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l, paddingBottom: 100 },
    label: { ...typography.body2, fontWeight: '600', color: colors.text, marginBottom: spacing.s },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.l },
    chip: { paddingHorizontal: spacing.m, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
    chipTextActive: { color: colors.surface },
    switchRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: 12, padding: spacing.m,
        marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border,
    },
    switchLabel: { ...typography.body2, color: colors.text, flex: 1, marginRight: spacing.m },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: spacing.m, marginVertical: spacing.m, borderLeftWidth: 4, borderLeftColor: colors.error },
    errorText: { color: colors.error, fontWeight: '500' },
});

