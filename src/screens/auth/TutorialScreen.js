import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, Dimensions, Animated,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import {
    Home, Calendar, Stethoscope, FolderClosed, User,
    Target, DollarSign, Pill, Syringe, BookOpen,
    ShieldAlert, Users, TrendingUp, Moon, Zap,
    Heart, FileText, BarChart2, UserPlus, Smile,
    ChevronRight, CheckCircle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        key: 'welcome',
        emoji: '🦄',
        iconType: 'emoji',
        title: 'Bem-vindo ao\nConexão Terapêutica',
        subtitle: 'O app que organiza a jornada terapêutica do seu filho, do início ao acompanhamento diário.',
        color: colors.primary,
        bg: `${colors.primary}15`,
    },
    {
        key: 'dashboard',
        Icon: Home,
        iconColor: colors.primary,
        title: 'Início — Seu Painel',
        subtitle: 'Veja o próximo compromisso, atividades de hoje, metas em aberto e medicamentos, tudo de uma vez.',
        color: colors.primary,
        bg: `${colors.primary}10`,
    },
    {
        key: 'agenda',
        Icon: Calendar,
        iconColor: '#7c3aed',
        title: 'Agenda Completa',
        subtitle: 'Cadastre sessões de equoterapia, consultas, exames e compromissos. Acesse por dia com visualização em calendário.',
        color: '#7c3aed',
        bg: '#ede9fe',
    },
    {
        key: 'medical',
        Icon: Stethoscope,
        iconColor: '#dc2626',
        title: 'Prontuário Digital',
        subtitle: 'Ficha médica (diagnósticos, alergias, tipo sanguíneo), histórico de consultas e todos os dados de saúde num só lugar.',
        color: '#dc2626',
        bg: '#fff1f2',
    },
    {
        key: 'medications',
        Icon: Pill,
        iconColor: '#7c3aed',
        title: 'Medicamentos & Adesão',
        subtitle: 'Cadastre remédios, controle estoque, marque doses tomadas e veja estatísticas de adesão por mês.',
        color: '#7c3aed',
        bg: '#ede9fe',
    },
    {
        key: 'goals',
        Icon: Target,
        iconColor: '#d97706',
        title: 'Metas Terapêuticas',
        subtitle: 'Defina objetivos com a equipe terapêutica, acompanhe o progresso e registre notas de evolução por meta.',
        color: '#d97706',
        bg: '#fef9c3',
    },
    {
        key: 'vault',
        Icon: FolderClosed,
        iconColor: '#059669',
        title: 'Cofre de Documentos',
        subtitle: 'Armazene laudos, receitas, exames e relatórios com segurança. Busque e filtre por categoria a qualquer hora.',
        color: '#059669',
        bg: '#dcfce7',
    },
    {
        key: 'expenses',
        Icon: DollarSign,
        iconColor: '#16a34a',
        title: 'Controle de Gastos',
        subtitle: 'Registre despesas com saúde (terapia, remédios, exames). Veja o total por mês e o breakdown por categoria.',
        color: '#16a34a',
        bg: '#dcfce7',
    },
    {
        key: 'growth',
        Icon: TrendingUp,
        iconColor: '#16a34a',
        title: 'Curva de Crescimento',
        subtitle: 'Acompanhe peso, altura e perímetro cefálico ao longo do tempo. Compare com a última medição.',
        color: '#16a34a',
        bg: '#f0fdf4',
    },
    {
        key: 'vaccines',
        Icon: Syringe,
        iconColor: '#0891b2',
        title: 'Caderneta de Vacinas',
        subtitle: 'Registre todas as vacinas com data e lote. Tenha a caderneta sempre atualizada e acessível.',
        color: '#0891b2',
        bg: '#e0f2fe',
    },
    {
        key: 'crisis',
        Icon: Zap,
        iconColor: '#dc2626',
        title: 'Rastreador de Crises',
        subtitle: 'Registre episódios de crise com tipo, intensidade e duração. Identifique padrões para compartilhar com a equipe.',
        color: '#dc2626',
        bg: '#fff1f2',
    },
    {
        key: 'sleep',
        Icon: Moon,
        iconColor: '#7c3aed',
        title: 'Diário de Sono',
        subtitle: 'Acompanhe a qualidade e duração do sono. Informações valiosas para terapeutas e neuropediatras.',
        color: '#7c3aed',
        bg: '#ede9fe',
    },
    {
        key: 'diary',
        Icon: BookOpen,
        iconColor: '#d97706',
        title: 'Diário dos Pais',
        subtitle: 'Registre como foi o dia com seu filho. Acompanhe seu humor e anote momentos importantes para lembrar depois.',
        color: '#d97706',
        bg: '#fef3c7',
    },
    {
        key: 'caregiver',
        Icon: UserPlus,
        iconColor: '#7c3aed',
        title: 'Compartilhar Acesso',
        subtitle: 'Convide o outro responsável (pai, avó, cuidador) por e-mail. Ambos gerenciam o mesmo perfil juntos.',
        color: '#7c3aed',
        bg: '#ede9fe',
    },
    {
        key: 'emergency',
        Icon: ShieldAlert,
        iconColor: '#dc2626',
        title: 'Modo Emergência 🚨',
        subtitle: 'Acesso rápido a contatos de emergência, dados médicos vitais e orientações — mesmo sem internet.',
        color: '#dc2626',
        bg: '#fff1f2',
    },
    {
        key: 'done',
        emoji: '🎉',
        iconType: 'emoji',
        title: 'Tudo pronto!',
        subtitle: 'Você está preparado para organizar a jornada do seu filho. Qualquer dúvida, este tutorial está no menu Perfil.',
        color: colors.primary,
        bg: `${colors.primary}15`,
    },
];

export const TutorialScreen = ({ navigation, route }) => {
    const [current, setCurrent] = useState(0);
    const scrollRef = useRef(null);
    const fromProfile = route?.params?.fromProfile || false;

    const goTo = (index) => {
        if (index < 0 || index >= SLIDES.length) return;
        setCurrent(index);
        scrollRef.current?.scrollTo({ x: index * width, animated: true });
    };

    const handleFinish = () => {
        if (fromProfile) {
            navigation.goBack();
        } else {
            navigation.replace('Onboarding');
        }
    };

    const handleSkip = () => {
        if (fromProfile) {
            navigation.goBack();
        } else {
            navigation.replace('Onboarding');
        }
    };

    const isLast = current === SLIDES.length - 1;

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.topBar}>
                <Text style={styles.slideCount}>{current + 1} / {SLIDES.length}</Text>
                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                    <Text style={styles.skipText}>Pular</Text>
                </TouchableOpacity>
            </View>

            {/* Slides */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                style={styles.scrollView}
            >
                {SLIDES.map((slide, idx) => (
                    <View key={slide.key} style={[styles.slide, { width }]}>
                        <View style={[styles.iconWrapper, { backgroundColor: slide.bg }]}>
                            {slide.iconType === 'emoji' ? (
                                <Text style={styles.emoji}>{slide.emoji}</Text>
                            ) : (
                                <slide.Icon color={slide.iconColor} size={52} />
                            )}
                        </View>
                        <Text style={[styles.slideTitle, { color: slide.color }]}>
                            {slide.title}
                        </Text>
                        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Dots */}
            <View style={styles.dots}>
                {SLIDES.map((_, idx) => (
                    <TouchableOpacity key={idx} onPress={() => goTo(idx)}>
                        <View style={[
                            styles.dot,
                            idx === current ? styles.dotActive : styles.dotInactive,
                        ]} />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navRow}>
                <TouchableOpacity
                    style={[styles.backBtn, current === 0 && styles.btnDisabled]}
                    onPress={() => goTo(current - 1)}
                    disabled={current === 0}
                >
                    <Text style={[styles.backBtnText, current === 0 && styles.btnDisabledText]}>
                        ← Anterior
                    </Text>
                </TouchableOpacity>

                {isLast ? (
                    <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                        <CheckCircle color={colors.surface} size={20} />
                        <Text style={styles.finishBtnText}>
                            {fromProfile ? 'Fechar' : 'Começar!'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.nextBtn} onPress={() => goTo(current + 1)}>
                        <Text style={styles.nextBtnText}>Próximo</Text>
                        <ChevronRight color={colors.surface} size={20} />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    topBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.l, paddingVertical: spacing.m,
    },
    slideCount: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
    skipBtn: { padding: spacing.s },
    skipText: { ...typography.body2, color: colors.textSecondary, fontWeight: '600' },

    scrollView: { flex: 1 },
    slide: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: spacing.xl, paddingVertical: spacing.l,
    },
    iconWrapper: {
        width: 120, height: 120, borderRadius: 36,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: spacing.xl,
    },
    emoji: { fontSize: 56 },
    slideTitle: {
        ...typography.h2, textAlign: 'center',
        marginBottom: spacing.m, lineHeight: 32,
    },
    slideSubtitle: {
        ...typography.body1, color: colors.textSecondary,
        textAlign: 'center', lineHeight: 26,
    },

    dots: {
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', gap: 6, paddingVertical: spacing.m,
    },
    dot: { borderRadius: 4, height: 8 },
    dotActive: { width: 24, backgroundColor: colors.primary },
    dotInactive: { width: 8, backgroundColor: colors.border },

    navRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingHorizontal: spacing.l, paddingBottom: spacing.xl,
        gap: spacing.m,
    },
    backBtn: {
        flex: 1, paddingVertical: spacing.m,
        borderRadius: 14, borderWidth: 1,
        borderColor: colors.border, alignItems: 'center',
    },
    backBtnText: { ...typography.body2, fontWeight: '700', color: colors.textSecondary },
    btnDisabled: { borderColor: colors.background, backgroundColor: colors.background },
    btnDisabledText: { color: colors.border },

    nextBtn: {
        flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.primary, borderRadius: 14,
        paddingVertical: spacing.m, gap: spacing.s,
    },
    nextBtnText: { ...typography.body1, color: colors.surface, fontWeight: '700' },

    finishBtn: {
        flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.primaryDark, borderRadius: 14,
        paddingVertical: spacing.m, gap: spacing.s,
    },
    finishBtnText: { ...typography.body1, color: colors.surface, fontWeight: '700' },
});
