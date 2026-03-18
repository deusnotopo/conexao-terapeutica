import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { showToast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft, Syringe, Calendar } from 'lucide-react-native';

const COMMON_VACCINES = [
    'BCG', 'Hepatite B', 'Rotavírus', 'Pentavalente', 'Pneumocócica 10V',
    'Meningocócica C', 'Poliomielite (VIP/VOP)', 'Febre Amarela',
    'Tríplice Viral (SCR)', 'Varicela', 'Hepatite A', 'HPV', 'Influenza', 'Outra'
];

export const AddVaccineScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [name, setName] = useState('');
    const [appliedDate, setAppliedDate] = useState('');
    const [nextDoseDate, setNextDoseDate] = useState('');
    const [doseNumber, setDoseNumber] = useState('1');
    const [notes, setNotes] = useState('');

    const maskDate = (text, setter) => {
        let raw = text.replace(/\D/g, '').substring(0, 8);
        if (raw.length > 4) raw = raw.substring(0, 2) + '/' + raw.substring(2, 4) + '/' + raw.substring(4);
        else if (raw.length > 2) raw = raw.substring(0, 2) + '/' + raw.substring(2);
        setter(raw);
    };

    const toISO = (d) => { const p = d.split('/'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : null; };

    const handleSave = async () => {
        if (!name.trim()) { setErrorMsg('Nome da vacina é obrigatório.'); return; }
        setErrorMsg('');
        setLoading(true);
        try {
            const { error } = await supabase.from('vaccines').insert([{
                dependent_id: activeDependent.id,
                name,
                applied_date: appliedDate ? toISO(appliedDate) : null,
                next_dose_date: nextDoseDate ? toISO(nextDoseDate) : null,
                dose_number: parseInt(doseNumber) || 1,
                notes,
            }]);
            if (error) throw error;
            showToast('Vacina registrada!');
            navigation.goBack();
        } catch (e) { setErrorMsg(e?.message || 'Não foi possível salvar.'); }
        finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registrar Vacina</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                <Text style={styles.label}>Vacina</Text>
                <View style={styles.chips}>
                    {COMMON_VACCINES.map(v => (
                        <TouchableOpacity key={v} style={[styles.chip, name === v && styles.chipActive]} onPress={() => setName(v)}>
                            <Text style={[styles.chipText, name === v && styles.chipTextActive]}>{v}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Input label="Nº da Dose" value={doseNumber} onChangeText={setDoseNumber} placeholder="1" keyboardType="numeric" />
                <Input label="Data de Aplicação (DD/MM/AAAA)" value={appliedDate} onChangeText={t => maskDate(t, setAppliedDate)} placeholder="Ex: 15/01/2024" keyboardType="numeric" icon={<Calendar size={18} color={colors.textSecondary} />} />
                <Input label="Data da Próxima Dose (DD/MM/AAAA) — Opcional" value={nextDoseDate} onChangeText={t => maskDate(t, setNextDoseDate)} placeholder="Ex: 15/07/2024" keyboardType="numeric" icon={<Calendar size={18} color={colors.textSecondary} />} />
                <Input label="Observações" value={notes} onChangeText={setNotes} placeholder="Lote, reações, clínica..." multiline numberOfLines={3} />
                {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
                <Button title={loading ? 'Salvando...' : 'Registrar Vacina'} onPress={handleSave} loading={loading} style={{ marginTop: spacing.m }} />
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
    backBtn: { padding: 4 },
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l, paddingBottom: 100 },
    label: { ...typography.body2, fontWeight: '600', color: colors.text, marginBottom: spacing.s },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.l },
    chip: { paddingHorizontal: spacing.m, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
    chipTextActive: { color: colors.surface },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: spacing.m, marginVertical: spacing.m, borderLeftWidth: 4, borderLeftColor: colors.error },
    errorText: { color: colors.error, fontWeight: '500' },
});

