import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft, Stethoscope, User, Calendar } from 'lucide-react-native';

const SPECIALTIES = ['Equoterapia', 'Neuropediatria', 'Fisioterapia', 'Fonoaudiologia', 'Terapia Ocupacional', 'Pediatria', 'Psicologia', 'Ortopedia', 'Outro'];

export const AddConsultationScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [date, setDate] = useState('');
    const [physicianName, setPhysicianName] = useState('');
    const [cidCode, setCidCode] = useState('');
    const [notes, setNotes] = useState('');
    const [nextAppointment, setNextAppointment] = useState('');

    const handleDateChange = (text, setter) => {
        let raw = text.replace(/\D/g, '');
        if (raw.length > 8) raw = raw.substring(0, 8);
        let masked = raw;
        if (raw.length > 2) masked = raw.substring(0, 2) + '/' + raw.substring(2);
        if (raw.length > 4) masked = masked.substring(0, 5) + '/' + raw.substring(4);
        setter(masked);
    };

    const toISO = (masked) => {
        const p = masked.split('/');
        return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : null;
    };

    const handleSave = async () => {
        if (!specialty.trim() || !date.trim()) {
            setErrorMsg('Especialidade e Data são obrigatórias.');
            return;
        }
        const isoDate = toISO(date);
        if (!isoDate) { setErrorMsg('Data inválida. Use DD/MM/AAAA.'); return; }
        setErrorMsg('');
        setLoading(true);
        try {
            const payload = {
                dependent_id: activeDependent.id,
                specialty,
                date: isoDate,
                physician_name: physicianName,
                cid_code: cidCode,
                notes,
                next_appointment: nextAppointment ? toISO(nextAppointment) : null,
            };
            const { error } = await supabase.from('consultations').insert([payload]);
            if (error) throw error;
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
                <Text style={styles.headerTitle}>Nova Consulta</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                <Text style={styles.label}>Especialidade</Text>
                <View style={styles.chips}>
                    {SPECIALTIES.map(s => (
                        <TouchableOpacity key={s} style={[styles.chip, specialty === s && styles.chipActive]} onPress={() => setSpecialty(s)}>
                            <Text style={[styles.chipText, specialty === s && styles.chipTextActive]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Input label="Data da Consulta (DD/MM/AAAA)" value={date} onChangeText={t => handleDateChange(t, setDate)}
                    placeholder="Ex: 18/03/2026" keyboardType="numeric" icon={<Calendar size={20} color={colors.textSecondary} />} />
                <Input label="Nome do Médico (Opcional)" value={physicianName} onChangeText={setPhysicianName}
                    placeholder="Dr(a). ..." icon={<User size={20} color={colors.textSecondary} />} />
                <Input label="Código CID (Opcional)" value={cidCode} onChangeText={setCidCode}
                    placeholder="Ex: F84.0" icon={<Stethoscope size={20} color={colors.textSecondary} />} />
                <Input label="Observações / Orientações" value={notes} onChangeText={setNotes}
                    placeholder="O que o médico recomendou..." multiline numberOfLines={4} />
                <Input label="Data do Próximo Retorno (DD/MM/AAAA)" value={nextAppointment}
                    onChangeText={t => handleDateChange(t, setNextAppointment)} placeholder="Ex: 18/06/2026" keyboardType="numeric"
                    icon={<Calendar size={20} color={colors.textSecondary} />} />
                {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
                <Button title={loading ? 'Salvando...' : 'Salvar Consulta'} onPress={handleSave} loading={loading} style={styles.btn} />
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
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: spacing.m, marginVertical: spacing.m, borderLeftWidth: 4, borderLeftColor: colors.error },
    errorText: { color: colors.error, fontWeight: '500' },
    btn: { marginTop: spacing.m },
});
