import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import {
    User, Baby, LogOut, ChevronRight, Plus, Heart,
    FileHeart, DollarSign, Target, Stethoscope, Pill, Syringe,
    BookOpen, Smile, ShieldAlert, Users, Zap, TrendingUp, Scale,
    Moon, ChevronDown, ChevronUp, UserPlus, BarChart2
} from 'lucide-react-native';

const SECTIONS = [
    {
        key: 'emergency',
        isSpecial: true,
    },
    {
        key: 'saude',
        title: '🏥 Saúde & Médico',
        color: '#dc2626',
        items: [
            { label: 'Ficha Médica', icon: FileHeart, color: '#dc2626', bg: '#fff1f2', route: 'MedicalRecord' },
            { label: 'Histórico de Consultas', icon: Stethoscope, color: '#7c3aed', bg: '#ede9fe', route: 'Consultations' },
            { label: 'Medicamentos & Estoque', icon: Pill, color: '#7c3aed', bg: '#ede9fe', route: 'Medications' },
            { label: 'Adesão a Medicamentos', icon: BarChart2, color: '#7c3aed', bg: '#ede9fe', route: 'MedicationAdherence' },
            { label: 'Caderneta de Vacinas', icon: Syringe, color: '#16a34a', bg: '#dcfce7', route: 'Vaccines' },
            { label: 'Rastreador de Crises', icon: Zap, color: '#dc2626', bg: '#fff1f2', route: 'Crisis' },
            { label: 'Curva de Crescimento', icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4', route: 'Growth' },
            { label: 'Diário de Sono', icon: Moon, color: '#7c3aed', bg: '#ede9fe', route: 'Sleep' },
            { label: 'Diretório de Profissionais', icon: Users, color: '#2563eb', bg: '#eff6ff', route: 'Professionals' },
            { label: 'Compartilhar Acesso', icon: UserPlus, color: '#7c3aed', bg: '#ede9fe', route: 'Caregiver' },
        ]
    },
    {
        key: 'rotina',
        title: '📅 Rotina & Desenvolvim.',
        color: '#2563eb',
        items: [
            { label: 'Metas Terapêuticas', icon: Target, color: '#d97706', bg: '#fef9c3', route: 'Goals' },
            { label: 'Diário dos Pais', icon: BookOpen, color: '#d97706', bg: '#fef3c7', route: 'ParentDiary' },
            { label: 'Meu Bem-Estar', icon: Smile, color: '#db2777', bg: '#fce7f3', route: 'Wellbeing' },
        ]
    },
    {
        key: 'financeiro',
        title: '💰 Financeiro & Direitos',
        color: '#16a34a',
        items: [
            { label: 'Gastos com Saúde', icon: DollarSign, color: '#16a34a', bg: '#dcfce7', route: 'Expenses' },
            { label: 'Direitos e Benefícios', icon: Scale, color: '#d97706', bg: '#fefce8', route: 'Benefits' },
        ]
    },
    {
        key: 'conta',
        title: '⚙️ Conta',
        color: '#6b7280',
        items: [
            { label: 'Ver Tutorial do App', icon: BookOpen, color: colors.primary, bg: `${colors.primary}15`, route: 'Tutorial', routeParams: { fromProfile: true } },
            { label: 'Sobre a Unicórnio Campina Verde', icon: Heart, color: '#db2777', bg: '#fce7f3', route: null },
        ]
    }
];

const ActionRow = ({ label, Icon, color, bg, onPress }) => (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.actionIcon, { backgroundColor: bg || `${colors.border}30` }]}>
            <Icon color={color || colors.textSecondary} size={20} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
        <ChevronRight color={colors.border} size={18} />
    </TouchableOpacity>
);

const CollapsibleSection = ({ section, navigation }) => {
    const [open, setOpen] = useState(true);
    return (
        <View style={styles.section}>
            <TouchableOpacity style={styles.sectionToggle} onPress={() => setOpen(v => !v)} activeOpacity={0.7}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {open ? <ChevronUp color={colors.textSecondary} size={18} /> : <ChevronDown color={colors.textSecondary} size={18} />}
            </TouchableOpacity>
            {open && (
                <View style={styles.sectionContent}>
                    {section.items.map(item => (
                        <ActionRow
                            key={item.label}
                            label={item.label}
                            Icon={item.icon}
                            color={item.color}
                            bg={item.bg}
                            onPress={item.route ? () => navigation.navigate(item.route, item.routeParams) : undefined}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

export const ProfileScreen = ({ navigation }) => {
    const { profile, dependents, activeDependent, setActiveDependent } = useUser();

    const handleLogout = () => {
        webAlert('Sair', 'Deseja realmente sair da sua conta?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: () => supabase.auth.signOut() }
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meu Perfil</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                {/* User Info Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <User color={colors.primary} size={36} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{profile?.full_name || 'Usuário'}</Text>
                        <Text style={styles.userRole}>
                            {profile?.role === 'parent' ? '👨‍👩‍👧 Pai / Responsável' : '🩺 Terapeuta'}
                        </Text>
                    </View>
                </View>

                {/* Dependents Section */}
                <View style={styles.section}>
                    <View style={styles.sectionToggle}>
                        <Text style={styles.sectionTitle}>👶 Dependentes</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Onboarding')} style={styles.addDepBtn}>
                            <Plus color={colors.primary} size={18} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.sectionContent}>
                        {dependents.map(dep => (
                            <TouchableOpacity
                                key={dep.id}
                                style={[styles.depCard, activeDependent?.id === dep.id && styles.activeDepCard]}
                                onPress={() => setActiveDependent(dep)}>
                                <View style={[styles.depIcon, { backgroundColor: activeDependent?.id === dep.id ? `${colors.primary}20` : `${colors.secondary}10` }]}>
                                    <Baby color={activeDependent?.id === dep.id ? colors.primary : colors.secondary} size={22} />
                                </View>
                                <View style={styles.depInfo}>
                                    <Text style={styles.depName}>{dep.first_name} {dep.last_name}</Text>
                                    <Text style={styles.depDetail}>
                                        {activeDependent?.id === dep.id ? '✅ Ativo agora' : 'Toque para selecionar'}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditDependent', { dependent: dep })}>
                                    <ChevronRight color={colors.textSecondary} size={18} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 🚨 Emergency Mode - always visible, top priority */}
                <TouchableOpacity style={styles.emergencyBtn} onPress={() => navigation.navigate('Emergency')}>
                    <ShieldAlert color={colors.surface} size={22} />
                    <Text style={styles.emergencyBtnText}>🚨 Modo Emergência</Text>
                    <ChevronRight color={colors.surface} size={18} />
                </TouchableOpacity>

                {/* Collapsible Sections */}
                {SECTIONS.filter(s => !s.isSpecial).map(section => (
                    <CollapsibleSection key={section.key} section={section} navigation={navigation} />
                ))}

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut color={colors.error} size={20} />
                    <Text style={styles.logoutText}>Sair da Conta</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Conexão Terapêutica v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        height: 60, justifyContent: 'center', alignItems: 'center',
        backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l, paddingBottom: 100 },

    profileCard: {
        flexDirection: 'row', backgroundColor: colors.surface,
        padding: spacing.l, borderRadius: 20, alignItems: 'center',
        marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border,
    },
    avatar: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: `${colors.primary}10`,
        justifyContent: 'center', alignItems: 'center', marginRight: spacing.l,
    },
    profileInfo: { flex: 1 },
    userName: { ...typography.h2, fontSize: 20, color: colors.text },
    userRole: { ...typography.body2, marginTop: 4, color: colors.textSecondary },

    section: {
        backgroundColor: colors.surface, borderRadius: 20,
        marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border,
        overflow: 'hidden',
    },
    sectionToggle: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.m, paddingVertical: spacing.m,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    sectionTitle: { ...typography.body1, fontWeight: '700', color: colors.text },
    addDepBtn: { padding: 4, backgroundColor: `${colors.primary}10`, borderRadius: 8 },
    sectionContent: { paddingHorizontal: spacing.s, paddingVertical: spacing.s },

    depCard: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.m, borderRadius: 12, marginBottom: spacing.xs,
    },
    activeDepCard: { backgroundColor: `${colors.primary}08` },
    depIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: spacing.m },
    depInfo: { flex: 1 },
    depName: { ...typography.body1, fontWeight: '600', color: colors.text },
    depDetail: { ...typography.caption, color: colors.textSecondary },
    editBtn: { padding: spacing.s },

    actionRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.m, borderRadius: 12, marginBottom: spacing.xs,
    },
    actionIcon: {
        width: 38, height: 38, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginRight: spacing.m,
    },
    actionLabel: { ...typography.body2, flex: 1, fontWeight: '500', color: colors.text },

    emergencyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.m,
        backgroundColor: '#dc2626', borderRadius: 20, padding: spacing.m,
        marginBottom: spacing.m,
    },
    emergencyBtnText: { ...typography.body1, color: colors.surface, fontWeight: '800', flex: 1 },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.m,
        backgroundColor: colors.surface, borderRadius: 16, padding: spacing.m,
        marginTop: spacing.m, borderWidth: 1, borderColor: `${colors.error}30`,
    },
    logoutText: { ...typography.body1, color: colors.error, fontWeight: '600' },
    versionText: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl, color: colors.textSecondary },
});
