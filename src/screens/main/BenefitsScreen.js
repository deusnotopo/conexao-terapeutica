import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ChevronLeft, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react-native';

const BENEFITS = [
    {
        id: 'bpc',
        emoji: '💰',
        title: 'BPC — Benefício de Prestação Continuada',
        color: '#16a34a',
        subtitle: 'Renda mensal de 1 salário-mínimo',
        body: 'Pago pelo INSS a pessoas com deficiência que comprovem baixa renda familiar (até 1/4 do salário-mínimo por pessoa). Não precisa ter contribuído ao INSS.',
        requirements: [
            'CID da deficiência no laudo médico',
            'Renda familiar ≤ 1/4 do salário-mínimo por pessoa',
            'Cadastro no CadÚnico',
            'Avaliação médica e social do INSS',
        ],
        link: 'https://www.gov.br/mds/pt-br/acoes-e-programas/assistencia-social/beneficios/bpc',
        linkText: 'Saiba mais no Gov.br',
    },
    {
        id: 'isentoipva',
        emoji: '🚗',
        title: 'Isenção de IPVA',
        color: '#2563eb',
        subtitle: 'Para veículo de pessoa com deficiência',
        body: 'A maioria dos estados oferece isenção total ou parcial de IPVA para veículos utilizados por pessoas com deficiência física, visual, mental severa ou autismo.',
        requirements: [
            'Laudo médico ou declaração de deficiência',
            'O veículo deve ser de uso do deficiente',
            'Solicitação na Secretaria de Fazenda do estado',
        ],
        link: 'https://www.gov.br/pt-br/servicos/isencao-de-ipi-e-icms-para-deficientes',
        linkText: 'Ver requisitos por estado',
    },
    {
        id: 'isetoipi',
        emoji: '🚘',
        title: 'Isenção de IPI na compra de veículo',
        color: '#7c3aed',
        subtitle: 'Desconto de até 20% no valor',
        body: 'Pessoas com deficiência física, visual, auditiva ou mental severa têm direito à isenção de IPI e IOF na compra de veículo novo, a cada 2 anos.',
        requirements: [
            'Laudo médico com CID e descrição da deficiência',
            'Credenciamento na Receita Federal',
            'Deficiência que impeça condução normal do veículo',
        ],
        link: 'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/ipi/ipi-ipi-veiculos',
        linkText: 'Processo na Receita Federal',
    },
    {
        id: 'passe',
        emoji: '🚌',
        title: 'Passe Livre (Lei 8.899/94)',
        color: '#0891b2',
        subtitle: 'Gratuidade no transporte interestadual',
        body: 'Pessoas com deficiência comprovada e renda de até 1 salário-mínimo têm direito a viajar gratuitamente em linhas interestaduais de ônibus, trem e barco. 2 vagas por veículo reservadas.',
        requirements: [
            'Inscrição no CadÚnico',
            'Comprovação da deficiência por laudo',
            'Renda ≤ 1 salário-mínimo',
            'Cartão emitido pelo DPC (Departamento de Políticas de Acessibilidade)',
        ],
        link: 'https://www.gov.br/pt-br/servicos/obter-o-passe-livre-para-pessoas-com-deficiencia',
        linkText: 'Solicitar Passe Livre',
    },
    {
        id: 'educacao',
        emoji: '🎓',
        title: 'Direitos na Educação',
        color: '#d97706',
        subtitle: 'Inclusão escolar garantida por lei',
        body: 'A Lei Brasileira de Inclusão (LBI) garante matrícula obrigatória em escola regular, Atendimento Educacional Especializado (AEE), professor de apoio, sala de recursos e adaptação curricular.',
        requirements: [
            'Laudo médico não é obrigatório para matrícula',
            'AEE é direito em qualquer escola pública',
            'Escola não pode recusar matrícula por deficiência',
            'Solicite o PEI (Plano Educacional Individualizado)',
        ],
        link: 'https://www.gov.br/mec/pt-br/areas-de-atuacao/educacao-especial',
        linkText: 'MEC — Educação Especial',
    },
    {
        id: 'saude',
        emoji: '🏥',
        title: 'Saúde — Rede SARAH e SUS',
        color: '#dc2626',
        subtitle: 'Atendimento especializado gratuito',
        body: 'O SUS oferece reabilitação física e mental, órteses e próteses, cadeiras de rodas e outros equipamentos gratuitamente. A Rede Sarah é referência para doenças neurológicas e reabilitação.',
        requirements: [
            'Encaminhamento médico pelo SUS (UBS)',
            'Cadastro no CADSUS',
            'Para órteses/próteses: avaliação pelo Hospital/APAE',
            'Rede Sarah: encaminhamento por médico especialista',
        ],
        link: 'https://www.sarah.br/nossos-hospitais/',
        linkText: 'Rede Sarah de Hospitais',
    },
    {
        id: 'aposentadoria',
        emoji: '👴',
        title: 'Aposentadoria por Invalidez / Incapacidade',
        color: '#6b7280',
        subtitle: 'Para o cuidador que não pode trabalhar',
        body: 'Cuidadores que precisam se afastar do trabalho para cuidar do familiar com deficiência podem ter direito a benefícios previdenciários como auxílio-doença, se contribuíram ao INSS.',
        requirements: [
            'Contribuição mínima ao INSS',
            'Incapacidade laboral comprovada',
            'Perícia médica no INSS',
            'Consulte um advogado previdenciário',
        ],
        link: 'https://www.gov.br/inss/pt-br',
        linkText: 'INSS Gov.br',
    },
];

export const BenefitsScreen = ({ navigation }) => {
    const [expanded, setExpanded] = useState(null);

    const toggle = (id) => setExpanded(prev => prev === id ? null : id);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Direitos e Benefícios</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                <View style={styles.banner}>
                    <Text style={styles.bannerTitle}>⚖️ Conheça seus Direitos</Text>
                    <Text style={styles.bannerText}>
                        Famílias de crianças com deficiência têm acesso a benefícios importantes.
                        Toque em cada item para ver os requisitos.
                    </Text>
                </View>

                {BENEFITS.map(b => {
                    const isOpen = expanded === b.id;
                    return (
                        <TouchableOpacity key={b.id} style={[styles.card, isOpen && { borderColor: b.color }]} onPress={() => toggle(b.id)} activeOpacity={0.85}>
                            <View style={styles.cardRow}>
                                <View style={[styles.iconBadge, { backgroundColor: `${b.color}15` }]}>
                                    <Text style={styles.emoji}>{b.emoji}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{b.title}</Text>
                                    <Text style={[styles.cardSub, { color: b.color }]}>{b.subtitle}</Text>
                                </View>
                                {isOpen ? <ChevronUp color={colors.textSecondary} size={20} /> : <ChevronDown color={colors.textSecondary} size={20} />}
                            </View>

                            {isOpen && (
                                <View style={styles.details}>
                                    <Text style={styles.bodyText}>{b.body}</Text>
                                    <Text style={styles.reqTitle}>📋 Como ter acesso:</Text>
                                    {b.requirements.map((r, i) => (
                                        <Text key={i} style={styles.reqItem}>• {r}</Text>
                                    ))}
                                    <TouchableOpacity style={[styles.linkBtn, { backgroundColor: `${b.color}15`, borderColor: `${b.color}40` }]}
                                        onPress={() => Linking.openURL(b.link)}>
                                        <ExternalLink color={b.color} size={16} />
                                        <Text style={[styles.linkText, { color: b.color }]}>{b.linkText}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}

                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        ⚠️ As informações são de caráter informativo. Consulte um advogado, assistente social ou o INSS para orientação específica ao seu caso.
                    </Text>
                </View>
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
    banner: {
        backgroundColor: `${colors.primary}10`, borderRadius: 20, padding: spacing.l,
        marginBottom: spacing.l, borderWidth: 1, borderColor: `${colors.primary}25`,
    },
    bannerTitle: { ...typography.h2, fontSize: 20, color: colors.primaryDark, marginBottom: spacing.s },
    bannerText: { ...typography.body2, color: colors.textSecondary, lineHeight: 22 },
    card: {
        backgroundColor: colors.surface, borderRadius: 16, padding: spacing.m,
        marginBottom: spacing.m, borderWidth: 1.5, borderColor: colors.border,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
    iconBadge: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    emoji: { fontSize: 24 },
    cardTitle: { ...typography.body1, fontWeight: '700', color: colors.text },
    cardSub: { ...typography.caption, fontWeight: '600', marginTop: 2 },
    details: { marginTop: spacing.m, paddingTop: spacing.m, borderTopWidth: 1, borderTopColor: colors.border },
    bodyText: { ...typography.body2, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.m },
    reqTitle: { ...typography.body2, fontWeight: '700', color: colors.text, marginBottom: spacing.s },
    reqItem: { ...typography.body2, color: colors.textSecondary, marginBottom: 4, lineHeight: 22 },
    linkBtn: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.s,
        marginTop: spacing.m, borderRadius: 12, padding: spacing.m,
        borderWidth: 1,
    },
    linkText: { ...typography.body2, fontWeight: '700' },
    disclaimer: {
        backgroundColor: '#fef9c3', borderRadius: 12, padding: spacing.m,
        borderWidth: 1, borderColor: '#fde68a', marginTop: spacing.m,
    },
    disclaimerText: { ...typography.caption, color: '#92400e', lineHeight: 20 },
});
