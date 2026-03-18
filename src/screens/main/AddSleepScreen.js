import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft } from 'lucide-react-native';

const QUALITY_OPTS = [
    { value: 1, label: '😣 Péssimo', color: '#dc2626' },
    { value: 2, label: '😕 Ruim', color: '#ea580c' },
    { value: 3, label: '😐 Regular', color: '#d97706' },
    { value: 4, label: '😊 Bom', color: '#65a30d' },
    { value: 5, label: '😴 Ótimo', color: '#16a34a' },
];

export const AddSleepScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [date, setDate] = useState('');
    const [sleepTime, setSleepTime] = useState('');
    const [wakeTime, setWakeTime] = useState('');
    const [quality, setQuality] = useState(3);
    const [awakenings, setAwakenings] = useState('0');
    const [notes, setNotes] = useState('');

    const maskDate = (t) => {
        let r = t.replace(/\D/g, '').substring(0, 8);
        if (r.length > 4) r = r.substring(0, 2) + '/' + r.substring(2, 4) + '/' + r.substring(4);
        else if (r.length > 2) r = r.substring(0, 2) + '/' + r.substring(2);
        return r;
    };
    const maskTime = (t) => {
        let r = t.replace(/\D/g, '').substring(0, 4);
        if (r.length > 2) r = r.substring(0, 2) + ':' + r.substring(2);
        return r;
    };
    const toISO = (d) => { const p = d.split('/'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : null; };

    const calcDuration = () => {
        if (!sleepTime || sleepTime.length !== 5 || !wakeTime || wakeTime.length !== 5) return null;
        const [sh, sm] = sleepTime.split(':').map(Number);
        const [wh, wm] = wakeTime.split(':').map(Number);
        let sleepMins = sh * 60 + sm;
        let wakeMins = wh * 60 + wm;
        if (wakeMins < sleepMins) wakeMins += 24 * 60; // past midnight
        return ((wakeMins - sleepMins) / 60).toFixed(2);
    };

    const handleSave = async () => {
        if (!date) { setErrorMsg('Data é obrigatória.'); return; }
        setErrorMsg('');
        setLoading(true);
        try {
            const duration = calcDuration();
            const { error } = await supabase.from('sleep_logs').insert([{
                dependent_id: activeDependent.id,
                date: toISO(date),
                sleep_time: sleepTime ? `${sleepTime}:00` : null,
                wake_time: wakeTime ? `${wakeTime}:00` : null,
                duration_hours: duration ? parseFloat(duration) : null,
                quality,
                awakenings: awakenings ? parseInt(awakenings) : 0,
                notes: notes || null,
            }]);
            if (error) throw error;
            navigation.goBack();
        } catch (e) { setErrorMsg(e?.message || 'Não foi possível salvar.'); }
        finally { setLoading(false); }
    };

    const duration = calcDuration();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ChevronLeft color={colors.primaryDark} size={28} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Registrar Noite de Sono</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                <Input label="Data (DD/MM/AAAA)" value={date} onChangeText={t => setDate(maskDate(t))} placeholder="18/03/2026" keyboardType="numeric" />

                <View style={styles.timeRow}>
                    <View style={{ flex: 1 }}>
                        <Input label="🌙 Dormiu às" value={sleepTime} onChangeText={t => setSleepTime(maskTime(t))} placeholder="21:30" keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.s }}>
                        <Input label="☀️ Acordou às" value={wakeTime} onChangeText={t => setWakeTime(maskTime(t))} placeholder="07:00" keyboardType="numeric" />
                    </View>
                </View>

                {duration && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>⏱ Duração calculada: {parseFloat(duration).toFixed(1)} horas</Text>
                    </View>
                )}

                <Text style={styles.label}>Qualidade do Sono</Text>
                <View style={styles.qualityRow}>
                    {QUALITY_OPTS.map(q => (
                        <TouchableOpacity key={q.value}
                            style={[styles.qualityBtn, quality === q.value && { backgroundColor: q.color, borderColor: q.color }]}
                            onPress={() => setQuality(q.value)}>
                            <Text style={styles.qualityEmoji}>{q.label.split(' ')[0]}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={[styles.qualityLabel, { color: QUALITY_OPTS[quality - 1].color }]}>{QUALITY_OPTS[quality - 1].label}</Text>

                <Input label="Vezes que acordou à noite" value={awakenings} onChangeText={setAwakenings} placeholder="0" keyboardType="numeric" />
                <Input label="Observações" value={notes} onChangeText={setNotes} placeholder="Ex: teve pesadelos, tossia, rangers os dentes..." multiline numberOfLines={3} />

                {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
                <Button title={loading ? 'Salvando...' : 'Registrar Noite'} onPress={handleSave} loading={loading} style={{ marginTop: spacing.m }} />
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
    timeRow: { flexDirection: 'row' },
    durationBadge: {
        backgroundColor: `${colors.primary}10`, borderRadius: 12, padding: spacing.m,
        marginBottom: spacing.m, borderWidth: 1, borderColor: `${colors.primary}30`,
    },
    durationText: { ...typography.body2, color: colors.primaryDark, fontWeight: '700', textAlign: 'center' },
    label: { ...typography.body2, fontWeight: '600', color: colors.text, marginBottom: spacing.s },
    qualityRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.s },
    qualityBtn: {
        flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
    },
    qualityEmoji: { fontSize: 22 },
    qualityLabel: { ...typography.body2, fontWeight: '700', textAlign: 'center', marginBottom: spacing.l },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: spacing.m, marginVertical: spacing.m, borderLeftWidth: 4, borderLeftColor: colors.error },
    errorText: { color: colors.error, fontWeight: '500' },
});
