import React from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Linking, Platform,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { ChevronLeft, ExternalLink, MapPin, Phone, Heart, Star } from 'lucide-react-native';

export const AboutScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sobre a Unicórnio</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>🦄</Text>
                    <Text style={styles.heroTitle}>Unicórnio Campina Verde</Text>
                    <Text style={styles.heroSubtitle}>Centro de Equoterapia e Desenvolvimento</Text>
                </View>

                {/* Missão */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Heart color={colors.primary} size={20} />
                        <Text style={styles.sectionTitle}>Nossa Missão</Text>
                    </View>
                    <Text style={styles.bodyText}>
                        Promover o desenvolvimento integral de crianças com deficiência por meio da
                        equoterapia e de um cuidado humano, acolhedor e especializado. Acreditamos
                        que cada criança tem um potencial único para crescer, se comunicar e se
                        conectar com o mundo.
                    </Text>
                </View>

                {/* O que é equoterapia */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Star color={colors.warning} size={20} />
                        <Text style={styles.sectionTitle}>O que é Equoterapia?</Text>
                    </View>
                    <Text style={styles.bodyText}>
                        A equoterapia é um método terapêutico e educacional que utiliza o cavalo
                        como instrumento de reabilitação. O movimento tridimensional do cavalo
                        estimula o sistema neuromotor, melhora o equilíbrio, a postura, a
                        coordenação motora e contribui para o desenvolvimento cognitivo e emocional.
                    </Text>
                    <View style={styles.benefitsList}>
                        {[
                            '🏇 Melhora do equilíbrio e postura',
                            '🧠 Estimulação cognitiva e sensorial',
                            '💬 Desenvolvimento da comunicação',
                            '❤️ Fortalecimento do vínculo afetivo',
                            '💪 Ganho de tônus muscular',
                        ].map((item, i) => (
                            <View key={i} style={styles.benefitItem}>
                                <Text style={styles.benefitText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Contato */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MapPin color={colors.secondary} size={20} />
                        <Text style={styles.sectionTitle}>Contato e Localização</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Linking.openURL('https://maps.google.com/?q=Campina+Verde+MG')}
                    >
                        <MapPin color={colors.textSecondary} size={18} />
                        <Text style={styles.contactText}>Campina Verde, Minas Gerais — MG</Text>
                        <ExternalLink color={colors.textSecondary} size={14} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Linking.openURL('tel:+55343400000')}
                    >
                        <Phone color={colors.textSecondary} size={18} />
                        <Text style={styles.contactText}>(34) 3400-0000</Text>
                    </TouchableOpacity>
                </View>

                {/* App info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoTitle}>Conexão Terapêutica</Text>
                    <Text style={styles.appInfoVersion}>Versão 1.0.0</Text>
                    <Text style={styles.appInfoDesc}>
                        Desenvolvido para facilitar a comunicação entre família e equipe terapêutica,
                        centralizando informações, compromissos e o histórico de evolução da criança.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Feito com ❤️ para famílias que compartilham amor, dedicação e esperança.
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
    hero: {
        alignItems: 'center', paddingVertical: spacing.xl,
        backgroundColor: `${colors.primary}10`, borderRadius: 24,
        marginBottom: spacing.l, borderWidth: 1, borderColor: `${colors.primary}25`,
    },
    heroEmoji: { fontSize: 56, marginBottom: spacing.s },
    heroTitle: { ...typography.h1, color: colors.primaryDark, textAlign: 'center' },
    heroSubtitle: { ...typography.body2, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
    section: {
        backgroundColor: colors.surface, borderRadius: 20, padding: spacing.l,
        marginBottom: spacing.m, borderWidth: 1, borderColor: colors.border,
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.s,
        marginBottom: spacing.m,
    },
    sectionTitle: { ...typography.h3, color: colors.text },
    bodyText: { ...typography.body1, color: colors.textSecondary, lineHeight: 24 },
    benefitsList: { marginTop: spacing.m, gap: spacing.s },
    benefitItem: {
        backgroundColor: `${colors.primary}08`, borderRadius: 12,
        paddingHorizontal: spacing.m, paddingVertical: spacing.s,
        borderWidth: 1, borderColor: `${colors.primary}20`,
    },
    benefitText: { ...typography.body2, color: colors.text },
    contactRow: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.m,
        paddingVertical: spacing.m,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    contactText: { ...typography.body1, color: colors.text, flex: 1 },
    appInfo: {
        backgroundColor: `${colors.secondary}10`, borderRadius: 20,
        padding: spacing.l, marginBottom: spacing.m,
        borderWidth: 1, borderColor: `${colors.secondary}25`,
        alignItems: 'center',
    },
    appInfoTitle: { ...typography.h2, color: colors.primaryDark, marginBottom: 4 },
    appInfoVersion: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.m },
    appInfoDesc: { ...typography.body2, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    footer: { alignItems: 'center', paddingVertical: spacing.l },
    footerText: { ...typography.body2, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
});
