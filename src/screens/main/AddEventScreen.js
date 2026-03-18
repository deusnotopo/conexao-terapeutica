import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { showToast } from '../../components/Toast';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Calendar, Clock, MapPin, Type, ChevronLeft, NotebookPen } from 'lucide-react-native';

export const AddEventScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    const [title, setTitle] = useState('');
    const [eventType, setEventType] = useState('Equoterapia');
    const [description, setDescription] = useState('');
    const [preNotes, setPreNotes] = useState('');
    const getTodayFormatted = () => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const [date, setDate] = useState(getTodayFormatted());
    const [time, setTime] = useState('10:00');

    const handleDateChange = (text) => {
        let raw = text.replace(/\D/g, '');
        if (raw.length > 8) raw = raw.substring(0, 8);
        let masked = raw;
        if (raw.length > 2) masked = raw.substring(0, 2) + '/' + raw.substring(2);
        if (raw.length > 4) masked = masked.substring(0, 5) + '/' + raw.substring(4);
        setDate(masked);
        setErrorMsg('');
    };

    const handleTimeChange = (text) => {
        let raw = text.replace(/\D/g, '');
        if (raw.length > 4) raw = raw.substring(0, 4);
        let masked = raw;
        if (raw.length > 2) masked = raw.substring(0, 2) + ':' + raw.substring(2);
        setTime(masked);
        setErrorMsg('');
    };
    const [location, setLocation] = useState('Clínica Unicórnio');

    const handleSave = async () => {
        if (!title.trim()) {
            setErrorMsg('Por favor, insira um título para o evento.');
            return;
        }
        if (!activeDependent) {
            setErrorMsg('Nenhum dependente selecionado.');
            return;
        }
        const dateParts = date.split('/');
        if (dateParts.length !== 3 || dateParts[2].length !== 4) {
            setErrorMsg('A data deve estar no formato DD/MM/AAAA.');
            return;
        }
        if (time.length !== 5) {
            setErrorMsg('O horário deve estar no formato HH:MM.');
            return;
        }

        setErrorMsg('');
        setLoading(true);
        try {
            const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            const startTime = new Date(`${isoDate}T${time}:00`).toISOString();
            const { error } = await supabase
                .from('events')
                .insert([{
                    dependent_id: activeDependent.id,
                    title,
                    event_type: eventType,
                    description,
                    pre_notes: preNotes || null,
                    start_time: startTime,
                    location,
                }]);
            if (error) throw error;
            showToast('Evento adicionado!');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving event:', error);
            setErrorMsg(error?.message || 'Não foi possível salvar o evento. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Novo Compromisso</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <Input
                    label="Título do Compromisso"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Ex: Sessão de Equoterapia"
                    icon={<Type size={20} color={colors.textSecondary} />}
                />

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tipo de Atividade</Text>
                    <View style={styles.typeSelector}>
                        {['Equoterapia', 'Fisioterapia', 'Médico', 'Outro'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeChip,
                                    eventType === type && styles.typeChipActive
                                ]}
                                onPress={() => setEventType(type)}
                            >
                                <Text style={[
                                    styles.typeChipText,
                                    eventType === type && styles.typeChipTextActive
                                ]}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <Input
                    label="Data (DD/MM/AAAA)"
                    value={date}
                    onChangeText={handleDateChange}
                    placeholder="Ex: 20/03/2026"
                    keyboardType="numeric"
                    icon={<Calendar size={20} color={colors.textSecondary} />}
                />

                <Input
                    label="Horário (HH:MM)"
                    value={time}
                    onChangeText={handleTimeChange}
                    placeholder="Ex: 14:00"
                    keyboardType="numeric"
                    icon={<Clock size={20} color={colors.textSecondary} />}
                />

                <Input
                    label="Local"
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Clínica Unicórnio"
                    icon={<MapPin size={20} color={colors.textSecondary} />}
                />

                <Input
                    label="Observações"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Adicione detalhes extras..."
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                />

                <Input
                    label="📝 Anotações Pré-Consulta"
                    value={preNotes}
                    onChangeText={setPreNotes}
                    placeholder="Perguntas para o médico, observações recentes..."
                    multiline
                    numberOfLines={4}
                    style={styles.textArea}
                />

                {errorMsg ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                    </View>
                ) : null}

                <Button
                    title={loading ? "Salvando..." : "Salvar Compromisso"}
                    onPress={handleSave}
                    disabled={loading}
                    style={styles.saveButton}
                />
            </ScrollView>
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
    backButton: { padding: 4 },
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l },
    inputGroup: { marginBottom: spacing.l },
    label: {
        ...typography.body2,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.s,
    },
    typeSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    typeChip: {
        paddingHorizontal: spacing.m,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    typeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeChipText: {
        ...typography.caption,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    typeChipTextActive: {
        color: colors.surface,
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    saveButton: { marginTop: spacing.l },
    errorBox: {
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        padding: spacing.s,
        marginTop: spacing.s,
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
    },
    errorText: { color: colors.error, fontSize: 14, fontWeight: '500' },
});

