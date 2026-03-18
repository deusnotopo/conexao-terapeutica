import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft, Target, Calendar, AlignLeft } from 'lucide-react-native';

export const AddGoalScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetDate, setTargetDate] = useState('');

    const handleDateChange = (text) => {
        let raw = text.replace(/\D/g, '');
        if (raw.length > 8) raw = raw.substring(0, 8);
        let masked = raw;
        if (raw.length > 2) masked = raw.substring(0, 2) + '/' + raw.substring(2);
        if (raw.length > 4) masked = masked.substring(0, 5) + '/' + raw.substring(4);
        setTargetDate(masked);
    };

    const EXAMPLES = [
        'Ficar em pé sem apoio por 10 segundos',
        'Dizer 5 palavras novas',
        'Montar um quebra-cabeça de 10 peças',
        'Usar a colher sozinho',
        'Completar uma terapia sem choro',
    ];

    const handleSave = async () => {
        if (!title.trim()) {
            setErrorMsg('O título da meta é obrigatório.');
            return;
        }
        let isoDate = null;
        if (targetDate) {
            const p = targetDate.split('/');
            if (p.length !== 3 || p[2].length !== 4) {
                setErrorMsg('Data inválida. Use DD/MM/AAAA.');
                return;
            }
            isoDate = `${p[2]}-${p[1]}-${p[0]}`;
        }
        setErrorMsg('');
        setLoading(true);
        try {
            const { error } = await supabase.from('therapeutic_goals').insert([{
                dependent_id: activeDependent.id,
                title,
                description,
                target_date: isoDate,
                status: 'pending',
            }]);
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
                <Text style={styles.headerTitle}>Nova Meta</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                <Input label="Título da Meta" value={title} onChangeText={setTitle}
                    placeholder="Ex: Andar sozinho pelo corredor..."
                    icon={<Target size={20} color={colors.textSecondary} />} />

                <Text style={styles.label}>Sugestões de metas</Text>
                <View style={styles.examples}>
                    {EXAMPLES.map(e => (
                        <TouchableOpacity key={e} style={styles.example} onPress={() => setTitle(e)}>
                            <Text style={styles.exampleText}>{e}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Input label="Descrição / Como medir o progresso (Opcional)" value={description} onChangeText={setDescription}
                    placeholder="Como saberemos que a meta foi atingida?" multiline numberOfLines={3}
                    icon={<AlignLeft size={20} color={colors.textSecondary} />} />
                <Input label="Prazo (DD/MM/AAAA) — Opcional" value={targetDate} onChangeText={handleDateChange}
                    placeholder="Ex: 30/06/2026" keyboardType="numeric"
                    icon={<Calendar size={20} color={colors.textSecondary} />} />
                {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
                <Button title={loading ? 'Salvando...' : 'Criar Meta'} onPress={handleSave} loading={loading} style={{ marginTop: spacing.m }} />
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
    examples: { marginBottom: spacing.l, gap: spacing.s },
    example: {
        backgroundColor: `${colors.secondary}10`, borderRadius: 10, padding: spacing.m,
        borderWidth: 1, borderColor: `${colors.secondary}30`,
    },
    exampleText: { ...typography.body2, color: colors.text },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: spacing.m, marginVertical: spacing.m, borderLeftWidth: 4, borderLeftColor: colors.error },
    errorText: { color: colors.error, fontWeight: '500' },
});
