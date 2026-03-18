import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import { ChevronLeft, Plus, Phone, Mail, MapPin, User, Stethoscope, Star, Edit2, Trash2 } from 'lucide-react-native';

const SPECIALTIES = [
    'Equoterapia', 'Neuropediatria', 'Neurologia', 'Pediatria',
    'Fisioterapia', 'Fonoaudiologia', 'T. Ocupacional', 'Psicologia',
    'Ortopedia', 'Oftalmologia', 'Nutrição', 'Outro'
];

const COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#db2777', '#6b7280'];

const getColor = (specialty) => {
    const idx = SPECIALTIES.indexOf(specialty) % COLORS.length;
    return COLORS[Math.max(0, idx)];
};

export const ProfessionalsScreen = ({ navigation }) => {
    const { activeDependent } = useUser();
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        if (!activeDependent) return;
        try {
            const { data } = await supabase
                .from('professionals')
                .select('*')
                .eq('dependent_id', activeDependent.id)
                .order('is_primary', { ascending: false })
                .order('name', { ascending: true });
            setProfessionals(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [activeDependent]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = (p) => {
        webAlert('Excluir', `Remover ${p.name} do diretório?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive', onPress: async () => {
                    await supabase.from('professionals').delete().eq('id', p.id);
                    fetchData();
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profissionais</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddProfessional')} style={styles.addBtn}>
                    <Plus color={colors.primary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[colors.primary]} />}>

                {professionals.length === 0 && !loading && (
                    <View style={styles.empty}>
                        <Stethoscope color={colors.border} size={48} />
                        <Text style={styles.emptyTitle}>Nenhum profissional cadastrado</Text>
                        <Text style={styles.emptyText}>Adicione médicos, terapeutas e especialistas para ter tudo em um só lugar.</Text>
                    </View>
                )}

                {professionals.map(p => {
                    const color = getColor(p.specialty);
                    return (
                        <View key={p.id} style={[styles.card, p.is_primary && styles.primaryCard]}>
                            {p.is_primary && <Text style={styles.primaryBadge}>⭐ Principal</Text>}
                            <View style={styles.cardTop}>
                                <View style={[styles.avatar, { backgroundColor: `${color}20` }]}>
                                    <Text style={[styles.avatarText, { color }]}>
                                        {p.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.profName}>{p.name}</Text>
                                    <View style={[styles.specialtyBadge, { backgroundColor: `${color}15` }]}>
                                        <Text style={[styles.specialtyText, { color }]}>{p.specialty}</Text>
                                    </View>
                                    {p.clinic ? <Text style={styles.clinic}>🏥 {p.clinic}</Text> : null}
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(p)} style={styles.deleteBtn}>
                                    <Trash2 color={colors.error} size={18} />
                                </TouchableOpacity>
                            </View>

                            {(p.phone || p.email || p.address) && (
                                <View style={styles.contactRow}>
                                    {p.phone && (
                                        <TouchableOpacity style={styles.contactBtn}
                                            onPress={() => Linking.openURL(`tel:${p.phone.replace(/\D/g, '')}`)}>
                                            <Phone color={colors.surface} size={16} />
                                            <Text style={styles.contactBtnText}>{p.phone}</Text>
                                        </TouchableOpacity>
                                    )}
                                    {p.email && (
                                        <TouchableOpacity style={[styles.contactBtn, { backgroundColor: `${color}20` }]}
                                            onPress={() => Linking.openURL(`mailto:${p.email}`)}>
                                            <Mail color={color} size={16} />
                                            <Text style={[styles.contactBtnText, { color }]}>Email</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            {p.notes ? <Text style={styles.notes}>{p.notes}</Text> : null}
                        </View>
                    );
                })}
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
    addBtn: { padding: 8, backgroundColor: `${colors.primary}15`, borderRadius: 10 },
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l, paddingBottom: 100 },
    empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
    emptyTitle: { ...typography.h3, color: colors.textSecondary },
    emptyText: { ...typography.body2, color: colors.textSecondary, textAlign: 'center' },
    card: {
        backgroundColor: colors.surface, borderRadius: 20, padding: spacing.l,
        marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border,
    },
    primaryCard: { borderColor: `${colors.secondary}50`, backgroundColor: `${colors.secondary}05` },
    primaryBadge: { ...typography.caption, fontWeight: '700', color: colors.secondary, marginBottom: spacing.s },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.m, marginBottom: spacing.m },
    avatar: {
        width: 52, height: 52, borderRadius: 26,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '800' },
    cardInfo: { flex: 1 },
    profName: { ...typography.body1, fontWeight: '700', color: colors.text, marginBottom: 6 },
    specialtyBadge: {
        alignSelf: 'flex-start', borderRadius: 20,
        paddingHorizontal: spacing.m, paddingVertical: 4, marginBottom: 4,
    },
    specialtyText: { ...typography.caption, fontWeight: '700' },
    clinic: { ...typography.caption, color: colors.textSecondary },
    deleteBtn: { padding: 4 },
    contactRow: { flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap' },
    contactBtn: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.s,
        backgroundColor: colors.primary, borderRadius: 20,
        paddingHorizontal: spacing.m, paddingVertical: 8,
    },
    contactBtnText: { ...typography.caption, color: colors.surface, fontWeight: '600' },
    notes: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.s, fontStyle: 'italic' },
});
