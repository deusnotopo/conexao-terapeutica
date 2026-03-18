import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft, Clock, Pill } from 'lucide-react-native';

const CRISIS_TYPES = [
    'Convulsão Tônico-Clônica', 'Convulsão Focal', 'Ausência (Petit Mal)',
    'Espasmo Infantil', 'Crise de Choro', 'Crise de Pânico',
    'Episódio de Autolesão', 'Comportamento Agressivo', 'Não classificado'
];

const SEVERITY_OPTS = [
    { value: 1, label: '1 — Leve', color: '#16a34a' },
    { value: 2, label: '2 — Moderada', color: '#65a30d' },
    { value: 3, label: '3 — Intensa', color: '#d97706' },
    { value: 4, label: '4 — Severa', color: '#ea580c' },
    { value: 5, label: '5 — Emergência', color: '#dc2626' },
];

const TRIGGER_OPTS = ['Febre', 'Sono mal dormido', 'Estresse', 'Falta de medicamento', 'Estímulo visual', 'Esforço físico', 'Sem causa aparente'];

export const AddCrisisScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [type, setType] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('');
    const [severity, setSeverity] = useState(3);
    const [triggers, setTriggers] = useState([]);
    const [symptoms, setSymptoms] = useState('');
    const [postEpisode, setPostEpisode] = useState('');
    const [medicationGiven, setMedicationGiven] = useState('');
    const [notes, setNotes] = useState('');

    const maskDate = (text) => {
        let raw = text.replace(/\D/g, '').substring(0, 8);
        if (raw.length > 4) raw = raw.substring(0, 2) + '/' + raw.substring(2, 4) + '/' + raw.substring(4);
        else if (raw.length > 2) raw = raw.substring(0, 2) + '/' + raw.substring(2);
        return raw;
    };
    const maskTime = (text) => {
        let raw = text.replace(/\D/g, '').substring(0, 4);
        if (raw.length > 2) raw = raw.substring(0, 2) + ':' + raw.substring(2);
        return raw;
    };
    const toISO = (d) => { const p = d.split('/'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : null; };

    const toggleTrigger = (t) => setTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

    const handleSave = async () => {
        if (!type) { setErrorMsg('Selecione o tipo de episódio.'); return; }
        if (!date) { setErrorMsg('Data é obrigatória.'); return; }
        setErrorMsg('');
        setLoading(true);
        try {
            const { error } = await supabase.from('crisis_events').insert([{
                dependent_id: activeDependent.id,
                type,
                date: toISO(date),
                time: time ? `${time}:00` : null,
                duration_minutes: duration ? parseInt(duration) : null,
                severity,
                triggers: triggers.join(', ') || null,
                symptoms: symptoms || null,
                post_episode: postEpisode || null,
                medication_given: medicationGiven || null,
                notes: notes || null,
            }]);
            if (error) throw error;
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
                <Text style={styles.headerTitle}>Registrar Episódio</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                <Text style={styles.label}>Tipo de Episódio *</Text>
                <View style={styles.chips}>
                    {CRISIS_TYPES.map(t => (
                        <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
                            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Gravidade</Text>
                <View style={styles.severityRow}>
                    {SEVERITY_OPTS.map(s => (
                        <TouchableOpacity key={s.value} style={[styles.severityBtn, severity === s.value && { backgroundColor: s.color, borderColor: s.color }]}
                            onPress={() => setSeverity(s.value)}>
                            <Text style={[styles.severityNum, severity === s.value && { color: colors.surface }]}>{s.value}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.severityLabel}>{SEVERITY_OPTS[severity - 1].label}</Text>

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Input label="Data (DD/MM/AAAA)" value={date} onChangeText={t => setDate(maskDate(t))} placeholder="18/03/2026" keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.s }}>
                        <Input label="Horário (HH:MM)" value={time} onChangeText={t => setTime(maskTime(t))} placeholder="14:30" keyboardType="numeric" />
                    </View>
                </View>

                <Input label="Duração (minutos)" value={duration} onChangeText={setDuration}
                    placeholder="Ex: 3" keyboardType="numeric" icon={<Clock size={18} color={colors.textSecondary} />} />

                <Text style={styles.label}>Possíveis Gatilhos</Text>
                <View style={styles.chips}>
                    {TRIGGER_OPTS.map(t => (
                        <TouchableOpacity key={t} style={[styles.chip, triggers.includes(t) && styles.chipActive]} onPress={() => toggleTrigger(t)}>
                            <Text style={[styles.chipText, triggers.includes(t) && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Input label="Sintomas observados" value={symptoms} onChangeText={setSymptoms}
                    placeholder="Ex: olhos revirados, espasmos nos braços, perda de consciência..." multiline numberOfLines={3} />
                <Input label="Comportamento Pós-Episódio" value={postEpisode} onChangeText={setPostEpisode}
                    placeholder="Ex: sonolência, confusão, choro..." multiline numberOfLines={2} />
                <Input label="Medicamento de Resgate Utilizado" value={medicationGiven} onChangeText={setMedicationGiven}
                    placeholder="Ex: Diazepam 5mg retal" icon={<Pill size={18} color={colors.textSecondary} />} />
                <Input label="Observações Adicionais" value={notes} onChangeText={setNotes}
                    placeholder="Contexto do episódio, presença de outras pessoas..." multiline numberOfLines={3} />

                {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
                <Button title={loading ? 'Salvando...' : 'Registrar Episódio'} onPress={handleSave} loading={loading} style={{ marginTop: spacing.m }} />
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
    severityRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.s },
    severityBtn: {
        flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
    },
    severityNum: { fontSize: 18, fontWeight: '800', color: colors.text },
    severityLabel: { ...typography.body2, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.l },
    row: { flexDirection: 'row' },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: spacing.m, marginVertical: spacing.m, borderLeftWidth: 4, borderLeftColor: colors.error },
    errorText: { color: colors.error, fontWeight: '500' },
});
