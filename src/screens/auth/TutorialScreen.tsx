import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { colors, spacing, typography, radii, shadows } from '../../theme';
import {
  Home,
  Calendar,
  Stethoscope,
  FolderClosed,
  User,
  Target,
  DollarSign,
  Pill,
  Syringe,
  BookOpen,
  ShieldAlert,
  Users,
  TrendingUp,
  Moon,
  Zap,
  Heart,
  UserPlus,
  Smile,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  BarChart2,
} from 'lucide-react-native';

const SLIDES = [
  {
    key: 'welcome',
    emoji: '🦄',
    iconType: 'emoji',
    title: 'Bem-vindo ao\nConexão Terapêutica',
    subtitle:
      'O app que organiza a jornada terapêutica do seu filho, do início ao acompanhamento diário.',
    color: colors.primary,
    bg: `${colors.primary}15`,
  },
  {
    key: 'dashboard',
    Icon: Home,
    iconColor: colors.primary,
    title: 'Início — Seu Painel',
    subtitle:
      'Veja o próximo compromisso, atividades de hoje, metas em aberto e medicamentos, tudo de uma vez.',
    color: colors.primary,
    bg: `${colors.primary}12`,
  },
  {
    key: 'agenda',
    Icon: Calendar,
    iconColor: colors.purple,
    title: 'Agenda Completa',
    subtitle:
      'Cadastre sessões de equoterapia, consultas, exames e compromissos. Acesse por dia com visualização em calendário.',
    color: colors.purple,
    bg: colors.purpleBg,
  },
  {
    key: 'medical',
    Icon: Stethoscope,
    iconColor: colors.error,
    title: 'Prontuário Digital',
    subtitle:
      'Ficha médica (diagnósticos, alergias, tipo sanguíneo), histórico de consultas e todos os dados de saúde num só lugar.',
    color: colors.error,
    bg: colors.errorBg,
  },
  {
    key: 'medications',
    Icon: Pill,
    iconColor: colors.purple,
    title: 'Medicamentos & Adesão',
    subtitle:
      'Cadastre remédios, controle estoque, marque doses tomadas e veja estatísticas de adesão por mês.',
    color: colors.purple,
    bg: colors.purpleBg,
  },
  {
    key: 'goals',
    Icon: Target,
    iconColor: colors.amber,
    title: 'Metas Terapêuticas',
    subtitle:
      'Defina objetivos com a equipe terapêutica, acompanhe o progresso e registre notas de evolução por meta.',
    color: colors.amber,
    bg: colors.warningBg,
  },
  {
    key: 'vault',
    Icon: FolderClosed,
    iconColor: colors.emerald,
    title: 'Cofre de Documentos',
    subtitle:
      'Armazene laudos, receitas, exames e relatórios com segurança. Busque e filtre por categoria.',
    color: colors.emerald,
    bg: colors.emeraldBg,
  },
  {
    key: 'expenses',
    Icon: DollarSign,
    iconColor: colors.success,
    title: 'Controle de Gastos',
    subtitle:
      'Registre despesas com saúde (terapia, remédios, exames). Veja o total por mês e breakdown por categoria.',
    color: colors.success,
    bg: colors.emeraldBg,
  },
  {
    key: 'growth',
    Icon: TrendingUp,
    iconColor: colors.success,
    title: 'Curva de Crescimento',
    subtitle:
      'Acompanhe peso, altura e perímetro cefálico ao longo do tempo. Compare com a última medição.',
    color: colors.success,
    bg: colors.successBg,
  },
  {
    key: 'vaccines',
    Icon: Syringe,
    iconColor: colors.cyan,
    title: 'Caderneta de Vacinas',
    subtitle:
      'Registre todas as vacinas com data e lote. Tenha a caderneta sempre atualizada e acessível.',
    color: colors.cyan,
    bg: colors.cyanBg,
  },
  {
    key: 'crisis',
    Icon: Zap,
    iconColor: colors.error,
    title: 'Rastreador de Crises',
    subtitle:
      'Registre episódios de crise com tipo, intensidade e duração. Identifique padrões para compartilhar com a equipe.',
    color: colors.error,
    bg: colors.errorBg,
  },
  {
    key: 'sleep',
    Icon: Moon,
    iconColor: colors.purple,
    title: 'Diário de Sono',
    subtitle:
      'Acompanhe a qualidade e duração do sono — informações valiosas para terapeutas e neuropediatras.',
    color: colors.purple,
    bg: colors.purpleBg,
  },
  {
    key: 'diary',
    Icon: BookOpen,
    iconColor: colors.amber,
    title: 'Diário dos Pais',
    subtitle:
      'Registre como foi o dia com seu filho. Acompanhe o humor e anote momentos importantes.',
    color: colors.amber,
    bg: colors.amberBg,
  },
  {
    key: 'caregiver',
    Icon: UserPlus,
    iconColor: colors.purple,
    title: 'Compartilhar Acesso',
    subtitle:
      'Convide o outro responsável (pai, avó, cuidador) por e-mail. Ambos gerenciam o mesmo perfil juntos.',
    color: colors.purple,
    bg: colors.purpleBg,
  },
  {
    key: 'emergency',
    Icon: ShieldAlert,
    iconColor: colors.error,
    title: 'Modo Emergência 🚨',
    subtitle:
      'Acesso rápido a contatos de emergência, dados médicos vitais e orientações — mesmo sem internet.',
    color: colors.error,
    bg: colors.errorBg,
  },
  {
    key: 'done',
    emoji: '🎉',
    iconType: 'emoji',
    title: 'Tudo pronto!',
    subtitle:
      'Você está preparado para organizar a jornada do seu filho. Este tutorial fica no menu Perfil, sempre disponível.',
    color: colors.primaryDark,
    bg: `${colors.primary}15`,
  },
] as const;

export const TutorialScreen = ({ navigation, route }: any) => {
  const { width } = useWindowDimensions(); // responsive: recalculates on resize
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fromProfile = route?.params?.fromProfile || false;

  // Animate content on slide change
  const contentAnim = useRef(new Animated.Value(1)).current;

  const goTo = (index: number) => {
    if (index < 0 || index >= SLIDES.length) return;

    // Brief fade-out → update state → fade-in
    Animated.timing(contentAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setCurrent(index);
      scrollRef.current?.scrollTo({ x: index * width, animated: false });
      Animated.timing(contentAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const canGoToOnboarding = () => {
    const state = navigation.getState?.();
    if (!state) return false;
    return state.routeNames?.includes('Onboarding') ?? false;
  };

  const handleFinish = () => {
    if (fromProfile) {
      navigation.goBack();
    } else if (canGoToOnboarding()) {
      navigation.replace('Onboarding');
    } else {
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    if (fromProfile) {
      navigation.goBack();
    } else if (canGoToOnboarding()) {
      navigation.replace('Onboarding');
    } else {
      navigation.goBack();
    }
  };

  const isLast  = current === SLIDES.length - 1;
  const isFirst = current === 0;
  const slide   = SLIDES[current];
  const SlideIcon = (slide as any).Icon as React.ComponentType<{ color?: string; size?: number }> | undefined;

  // Progress bar width
  const progressPct = ((current + 1) / SLIDES.length) * 100;

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.slideCount}>
          {current + 1} <Text style={styles.slideTotal}>/ {SLIDES.length}</Text>
        </Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>

      {/* ── Progress Bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${progressPct}%`, backgroundColor: slide.color },
          ]}
        />
      </View>

      {/* ── Slide Content — single view, animated in/out ── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}           // swipe disabled: we control navigation
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, idx) => {
          const SIcon = (s as any).Icon as React.ComponentType<{ color?: string; size?: number }> | undefined;
          return (
            <Animated.View
              key={s.key}
              style={[
                styles.slide,
                { width },
                idx === current ? { opacity: contentAnim } : { opacity: 0 },
              ]}
            >
              {/* Icon Card */}
              <View style={[styles.iconCard, { backgroundColor: s.bg }]}>
                {(s as any).iconType === 'emoji' ? (
                  <Text style={styles.emoji}>{(s as any).emoji}</Text>
                ) : SIcon ? (
                  <SIcon color={(s as any).iconColor} size={56} />
                ) : null}
              </View>

              {/* Slide number badge */}
              <View style={[styles.slideBadge, { backgroundColor: `${s.color}18` }]}>
                <Text style={[styles.slideBadgeText, { color: s.color }]}>
                  {idx + 1} de {SLIDES.length}
                </Text>
              </View>

              <Text style={[styles.slideTitle, { color: s.color }]}>{s.title}</Text>
              <Text style={styles.slideSubtitle}>{s.subtitle}</Text>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* ── Dots — scrollable if too many ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dots}
        style={styles.dotsScroll}
      >
        {SLIDES.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => goTo(idx)}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`Ir para slide ${idx + 1}`}
          >
            <Animated.View
              style={[
                styles.dot,
                idx === current
                  ? [styles.dotActive, { backgroundColor: slide.color }]
                  : styles.dotInactive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Navigation Buttons ── */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.backBtn, isFirst && styles.btnHidden]}
          onPress={() => goTo(current - 1)}
          disabled={isFirst}
          accessibilityLabel="Slide anterior"
        >
          <ChevronLeft color={colors.textSecondary} size={20} />
          <Text style={styles.backBtnText}>Anterior</Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primaryDark }]}
            onPress={handleFinish}
            accessibilityLabel={fromProfile ? 'Fechar tutorial' : 'Começar a usar o app'}
          >
            <CheckCircle color={colors.surface} size={20} />
            <Text style={styles.nextBtnText}>
              {fromProfile ? 'Fechar' : 'Começar!'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: slide.color }]}
            onPress={() => goTo(current + 1)}
            accessibilityLabel="Próximo slide"
          >
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

  // ── Header ──────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
  },
  slideCount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  slideTotal: {
    fontWeight: '400' as const,
    color: colors.textSecondary,
    fontSize: 14,
  },
  skipBtn: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radii.chip,
    backgroundColor: `${colors.textSecondary}12`,
  },
  skipText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },

  // ── Progress ─────────────────────────────────────────────────────────────────
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: spacing.l,
    borderRadius: 2,
    marginBottom: spacing.s,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },

  // ── Slide ────────────────────────────────────────────────────────────────────
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.l,
    maxWidth: 640,
    alignSelf: 'center',
  },
  iconCard: {
    width: 130,
    height: 130,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
    ...shadows.card,
  },
  emoji: { fontSize: 60 },
  slideBadge: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radii.chip,
    marginBottom: spacing.m,
  },
  slideBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slideTitle: {
    ...(typography.h2 as object),
    textAlign: 'center',
    marginBottom: spacing.m,
    lineHeight: 34,
  },
  slideSubtitle: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 360,
  },

  // ── Dots ─────────────────────────────────────────────────────────────────────
  dotsScroll: { flexGrow: 0, maxHeight: 32 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
  dot: { borderRadius: 4, height: 8 },
  dotActive: { width: 24 },
  dotInactive: { width: 8, backgroundColor: colors.border },

  // ── Nav buttons ──────────────────────────────────────────────────────────────
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xl,
    paddingTop: spacing.s,
    gap: spacing.m,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    borderRadius: radii.m,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  backBtnText: {
    ...(typography.body2 as object),
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  btnHidden: { opacity: 0, pointerEvents: 'none' } as any,

  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m + 2,
    borderRadius: radii.m,
    gap: spacing.s,
    ...shadows.button,
  },
  nextBtnText: {
    ...(typography.body1 as object),
    color: colors.surface,
    fontWeight: '700' as const,
  },
});
