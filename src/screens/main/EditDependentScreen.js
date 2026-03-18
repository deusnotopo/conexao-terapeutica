import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Baby, Calendar, Stethoscope, ChevronLeft, Trash2 } from 'lucide-react-native';

export const EditDependentScreen = ({ navigation, route }) => {
    const { dependent } = route.params;
    const { refreshContext, setActiveDependent } = useUser();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Extrair YYYY-MM-DD para DD/MM/AAAA para exibir no input
    const initialDateParts = dependent.birth_date ? dependent.birth_date.split('-') : [];
    const initialFormattedDate = initialDateParts.length === 3 ? `${initialDateParts[2]}/${initialDateParts[1]}/${initialDateParts[0]}` : dependent.birth_date;

    const [firstName, setFirstName] = useState(dependent.first_name);
    const [lastName, setLastName] = useState(dependent.last_name);
    const [birthDate, setBirthDate] = useState(initialFormattedDate);
    const [diagnosis, setDiagnosis] = useState(dependent.diagnosis || '');

    const handleDateChange = (text) => {
        let raw = text.replace(/\D/g, '');
        if (raw.length > 8) raw = raw.substring(0, 8);
        let masked = raw;
        if (raw.length > 2) masked = raw.substring(0, 2) + '/' + raw.substring(2);
        if (raw.length > 4) masked = masked.substring(0, 5) + '/' + raw.substring(4);
        setBirthDate(masked);
        setErrorMsg('');
    };

    const handleUpdate = async () => {
        if (!firstName.trim() || !lastName.trim() || !birthDate.trim()) {
            setErrorMsg('Por favor, preencha o nome e a data de nascimento.');
            return;
        }
        const dateParts = birthDate.split('/');
        if (dateParts.length !== 3 || dateParts[2].length !== 4) {
            setErrorMsg('A data de nascimento deve estar no formato DD/MM/AAAA.');
            return;
        }
        const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

        setErrorMsg('');
        setLoading(true);
        try {
            const { error } = await supabase
                .from('dependents')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    birth_date: isoDate,
                    diagnosis: diagnosis,
                })
                .eq('id', dependent.id);
            if (error) throw error;
            await refreshContext();
            navigation.goBack();
        } catch (error) {
            console.error('Error updating dependent:', error);
            setErrorMsg(error?.message || 'Não foi possível salvar as alterações.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        webAlert(
            'Excluir Perfil',
            `Deseja realmente excluir o perfil de "${dependent.first_name}"? Esta ação é permanente.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Excluir', 
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const { error } = await supabase
                                .from('dependents')
                                .delete()
                                .eq('id', dependent.id);
                            if (error) throw error;
                            await refreshContext();
                            navigation.popToTop();
                        } catch (error) {
                            console.error('Error deleting dependent:', error);
                            setErrorMsg('Não foi possível excluir o perfil.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                    <Trash2 color={colors.error} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.form}>
                    <Input
                        label="Nome"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Ex: João"
                        icon={<Baby size={20} color={colors.textSecondary} />}
                    />
                    <Input
                        label="Sobrenome"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Ex: Silva"
                    />
                    <Input
                        label="Data de Nascimento (DD/MM/AAAA)"
                        value={birthDate}
                        onChangeText={handleDateChange}
                        placeholder="Ex: 25/11/2020"
                        keyboardType="numeric"
                        icon={<Calendar size={20} color={colors.textSecondary} />}
                    />
                    <Input
                        label="Diagnóstico"
                        value={diagnosis}
                        onChangeText={setDiagnosis}
                        placeholder="Ex: TEA, TDAH, etc."
                        icon={<Stethoscope size={20} color={colors.textSecondary} />}
                    />
                </View>

                {errorMsg ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                    </View>
                ) : null}
                <Button
                    title={loading ? "Salvando..." : "Salvar Alterações"}
                    onPress={handleUpdate}
                    loading={loading}
                    style={styles.button}
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
    deleteButton: { padding: 4 },
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l, paddingBottom: spacing.xxl },
    form: { width: '100%', marginBottom: spacing.l },
    button: { width: '100%', marginTop: spacing.m },
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
