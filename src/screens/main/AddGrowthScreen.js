import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ChevronLeft, Calendar } from 'lucide-react-native';

export const AddGrowthScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [date, setDate] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [head, setHead] = useState('');
    const [notes, setNotes] = useState('');

    const maskDate = (text) => {
        let raw = text.replace(/\D/g, '').substring(0, 8);
        if (raw.length > 4) raw = raw.substring(0, 2) + '/' + raw.substring(2, 4) + '/' + raw.substring(4);
        else if (raw.length > 2) raw = raw.substring(0, 2) + '/' + raw.substring(2);
        return raw;
    };
    const toISO = (d) => { const p = d.split('/'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : null; };

    const handleSave = async () => {
        if (!date) { setErrorMsg('Data é obrigatória.'); return; }
        if (!weight && !height && !head) { setErrorMsg('Preencha pelo menos um campo de medição.'); return; }
        setErrorMsg('');
        setLoading(true);
        try {
            const { error } = await supabase.from('growth_measurements').insert([{
                dependent_id: activeDependent.id,
                date: toISO(date),
                weight_kg: weight ? parseFloat(weight.replace(',', '.')) : null,
                height_cm: height ? parseFloat(height.replace(',', '.')) : null,
                head_cm: head ? parseFloat(head.replace(',', '.')) : null,
                notes,
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
                <Text style={styles.headerTitle}>Nova Medição</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>💡 Preencha os campos disponíveis. Todos são opcionais exceto a data.</Text>
                </View>
                <Input label="Data da Medição (DD/MM/AAAA)" value={date} onChangeText={t => setDate(maskDate(t))}
                    placeholder="Ex: 18/03/2026" keyboardType="numeric" icon={<Calendar size={18} color={colors.textSecondary} />} />
                <Input label="⚖️ Peso (kg)" value={weight} onChangeText={setWeight}
                    placeholder="Ex: 22.5" keyboardType="decimal-pad" />
                <Input label="📏 Altura (cm)" value={height} onChangeText={setHeight}
                    placeholder="Ex: 110.5" keyboardType="decimal-pad" />
                <Input label="🧠 Perímetro Cefálico (cm)" value={head} onChangeText={setHead}
                    placeholder="Ex: 52.3" keyboardType="decimal-pad" />
                <Input label="Observações" value={notes} onChangeText={setNotes}
                    placeholder="Ex: Medido na consulta com Dr. Silva, sem sapatos." multiline numberOfLines={3} />
                {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
                <Button title={loading ? 'Salvando...' : 'Registrar Medição'} onPress={handleSave} loading={loading} style={{ marginTop: spacing.m }} />
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
    infoBox: {
        backgroundColor: `${colors.primary}10`, borderRadius: 12, padding: spacing.m,
        marginBottom: spacing.l, borderWidth: 1, borderColor: `${colors.primary}25`,
    },
    infoText: { ...typography.body2, color: colors.primaryDark },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 10, padding: spacing.m, marginVertical: spacing.m, borderLeftWidth: 4, borderLeftColor: colors.error },
    errorText: { color: colors.error, fontWeight: '500' },
});
