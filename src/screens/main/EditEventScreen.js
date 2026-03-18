import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Calendar, Clock, MapPin, Type, ChevronLeft } from 'lucide-react-native';
import { format } from 'date-fns';

const EVENT_TYPES = ['Equoterapia', 'Fisioterapia', 'Fonoaudiologia', 'T. Ocupacional', 'Médico', 'Retorno', 'Exame', 'Outro'];

export const EditEventScreen = ({ navigation, route }) => {
    const { event } = route.params;
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const toLocal = (iso) => {
        const d = new Date(iso);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${min}` };
    };

    const existing = toLocal(event.start_time);

    const [title, setTitle] = useState(event.title || '');
    const [eventType, setEventType] = useState(event.event_type || 'Equoterapia');
    const [date, setDate] = useState(existing.date);
    const [time, setTime] = useState(existing.time);
    const [location, setLocation] = useState(event.location || '');
    const [description, setDescription] = useState(event.description || '');

    const handleDateChange = (text) => {
        let raw = text.replace(/\D/g, '').substring(0, 8);
        if (raw.length > 4) raw = raw.substring(0, 2) + '/' + raw.substring(2, 4) + '/' + raw.substring(4);
        else if (raw.length > 2) raw = raw.substring(0, 2) + '/' + raw.substring(2);
        setDate(raw);
    };

    const handleTimeChange = (text) => {
        let raw = text.replace(/\D/g, '').substring(0, 4);
        if (raw.length > 2) raw = raw.substring(0, 2) + ':' + raw.substring(2);
        setTime(raw);
    };

    const handleSave = async () => {
        if (!title.trim()) { setErrorMsg('Título é obrigatório.'); return; }
        const dateParts = date.split('/');
        if (dateParts.length !== 3 || dateParts[2].length !== 4) { setErrorMsg('Data inválida. Use DD/MM/AAAA.'); return; }
        if (time.length !== 5) { setErrorMsg('Horário inválido. Use HH:MM.'); return; }

        setErrorMsg('');
        setLoading(true);
        try {
            const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            const startTime = new Date(`${isoDate}T${time}:00`).toISOString();
            const { error } = await supabase.from('events').update({
                title, event_type: eventType, description, start_time: startTime, location,
            }).eq('id', event.id);
            if (error) throw error;
            navigation.goBack();
        } catch (e) {
            setErrorMsg(e?.message || 'Não foi possível salvar.');
        } finally { setLoading(false); }
    };

    const handleDelete = () => {
        webAlert('Excluir', `Excluir "${event.title}" permanentemente?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive', onPress: async () => {
                    await supabase.from('events').delete().eq('id', event.id);
                    navigation.goBack();
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Compromisso</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                <Input label="Título" value={title} onChangeText={setTitle}
                    placeholder="Ex: Sessão de Equoterapia" icon={<Type size={20} color={colors.textSecondary} />} />

                <Text style={styles.label}>Tipo de Atividade</Text>
                <View style={styles.chips}>
                    {EVENT_TYPES.map(t => (
                        <TouchableOpacity key={t} style={[styles.chip, eventType === t && styles.chipActive]} onPress={() => setEventType(t)}>
                            <Text style={[styles.chipText, eventType === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Input label="Data (DD/MM/AAAA)" value={date} onChangeText={handleDateChange}
                    placeholder="Ex: 20/03/2026" keyboardType="numeric" icon={<Calendar size={20} color={colors.textSecondary} />} />
                <Input label="Horário (HH:MM)" value={time} onChangeText={handleTimeChange}
                    placeholder="Ex: 14:00" keyboardType="numeric" icon={<Clock size={20} color={colors.textSecondary} />} />
                <Input label="Local" value={location} onChangeText={setLocation}
                    placeholder="Clínica Unicórnio" icon={<MapPin size={20} color={colors.textSecondary} />} />
                <Input label="Observações" value={description} onChangeText={setDescription}
                    placeholder="Detalhes adicionais..." multiline numberOfLines={3} />

                {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}

                <Button title={loading ? 'Salvando...' : 'Salvar Alterações'} onPress={handleSave} loading={loading} style={{ marginTop: spacing.l }} />

                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Text style={styles.deleteText}>🗑️ Excluir este compromisso</Text>
                </TouchableOpacity>
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
    chipText: { ...typography.caption, fontWeight: '500', color: colors.textSecondary },
    chipTextActive: { color: colors.surface },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: spacing.s, marginTop: spacing.s, borderLeftWidth: 4, borderLeftColor: colors.error },
    errorText: { color: colors.error, fontSize: 14, fontWeight: '500' },
    deleteBtn: {
        alignItems: 'center', marginTop: spacing.xl, padding: spacing.m,
        borderRadius: 12, backgroundColor: '#fee2e220', borderWidth: 1, borderColor: `${colors.error}30`,
    },
    deleteText: { ...typography.body2, color: colors.error, fontWeight: '600' },
});
