import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { ChevronLeft, Heart, Smile, Frown, Meh, Zap } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MOODS = [
    { key: 'great', emoji: '💪', label: 'Energizado', color: '#16a34a' },
    { key: 'good', emoji: '🙂', label: 'Bem', color: colors.primary },
    { key: 'tired', emoji: '😴', label: 'Cansado', color: '#d97706' },
    { key: 'overwhelmed', emoji: '💔', label: 'Sobrecarregado', color: '#dc2626' },
];

const TIPS = [
    "Cuidar de si mesmo é tão importante quanto cuidar de quem você ama. Você merece descanso. 🤍",
    "Você carrega uma carga enorme com tanto amor. Isso faz de você uma pessoa extraordinária. ⭐",
    "Não existe cuidador perfeito. Existem cuidadores que tentam todo dia — você é um deles. 💚",
    "Peça ajuda quando precisar. Isso é sabedoria, não fraqueza. 🌟",
    "Lembre-se: avião pede para você colocar sua máscara primeiro. Cuide de você. ✈️",
];

export const WellbeingScreen = ({ navigation }) => {
    const { user } = useUser();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [mood, setMood] = useState('good');
    const [notes, setNotes] = useState('');
    const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);

    const today = new Date().toISOString().split('T')[0];

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('caregiver_wellbeing')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(14);
            setEntries(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const todayEntry = entries.find(e => e.date === today);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (todayEntry) {
                await supabase.from('caregiver_wellbeing').update({ mood, notes }).eq('id', todayEntry.id);
            } else {
                await supabase.from('caregiver_wellbeing').insert([{ user_id: user.id, date: today, mood, notes }]);
            }
            setNotes('');
            await fetchData();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const getMoodCfg = (key) => MOODS.find(m => m.key === key) || MOODS[1];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meu Bem-Estar</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[colors.primary]} />}>

                <View style={styles.tipCard}>
                    <Heart color="#dc2626" size={20} fill="#dc262640" />
                    <Text style={styles.tipText}>{tip}</Text>
                </View>

                <View style={styles.checkInCard}>
                    <Text style={styles.checkInTitle}>Como você está hoje?</Text>
                    <Text style={styles.checkInDate}>
                        {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR }).charAt(0).toUpperCase() +
                         format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR }).slice(1)}
                    </Text>

                    <View style={styles.moodGrid}>
                        {MOODS.map(m => (
                            <TouchableOpacity key={m.key} style={[styles.moodBtn, mood === m.key && { borderColor: m.color, backgroundColor: `${m.color}10` }]}
                                onPress={() => setMood(m.key)}>
                                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                                <Text style={[styles.moodLabel, mood === m.key && { color: m.color, fontWeight: '700' }]}>{m.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={styles.textInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Quer desabafar? Escreva o que quiser... Tudo fica seguro aqui. 🤍"
                        multiline
                        numberOfLines={4}
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Button title={saving ? 'Salvando...' : `${todayEntry ? 'Atualizar' : 'Registrar'} Bem-Estar`}
                        onPress={handleSave} loading={saving} style={{ marginTop: spacing.m }} />
                </View>

                {entries.length > 1 && (
                    <>
                        <Text style={styles.section}>Últimas 2 semanas</Text>
                        <View style={styles.moodHistory}>
                            {entries.map(e => {
                                const cfg = getMoodCfg(e.mood);
                                return (
                                    <View key={e.id} style={[styles.historyDot, { backgroundColor: cfg.color }]}>
                                        <Text style={styles.historyEmoji}>{cfg.emoji}</Text>
                                        <Text style={styles.historyDay}>
                                            {format(new Date(e.date + 'T12:00:00'), "dd/MM")}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}
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
    tipCard: {
        flexDirection: 'row', gap: spacing.m, alignItems: 'flex-start',
        backgroundColor: '#fff1f2', borderRadius: 16, padding: spacing.m,
        marginBottom: spacing.l, borderWidth: 1, borderColor: '#fecdd3',
    },
    tipText: { ...typography.body2, color: '#be123c', flex: 1, lineHeight: 22, fontStyle: 'italic' },
    checkInCard: {
        backgroundColor: colors.surface, borderRadius: 20, padding: spacing.l,
        marginBottom: spacing.xl, borderWidth: 1, borderColor: `${colors.primary}20`,
    },
    checkInTitle: { ...typography.h3, color: colors.primaryDark, marginBottom: 4 },
    checkInDate: { ...typography.body2, color: colors.textSecondary, marginBottom: spacing.l },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.l },
    moodBtn: {
        width: '47%', alignItems: 'center', paddingVertical: spacing.m,
        borderRadius: 12, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
    },
    moodEmoji: { fontSize: 28, marginBottom: 6 },
    moodLabel: { ...typography.body2, color: colors.textSecondary },
    textInput: {
        backgroundColor: colors.background, borderRadius: 12, padding: spacing.m,
        borderWidth: 1, borderColor: colors.border, minHeight: 100,
        ...typography.body1, color: colors.text, textAlignVertical: 'top',
    },
    section: { ...typography.h3, marginBottom: spacing.m, fontSize: 18 },
    moodHistory: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
    historyDot: {
        alignItems: 'center', padding: spacing.s, borderRadius: 10,
        minWidth: 50, opacity: 0.85,
    },
    historyEmoji: { fontSize: 18 },
    historyDay: { ...typography.caption, color: colors.surface, marginTop: 2, fontWeight: '600' },
});
