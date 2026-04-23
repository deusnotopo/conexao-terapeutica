import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { colors, spacing, typography, radii, shadows } from '../../theme';
import {
  Home, Calendar, Stethoscope, FolderClosed,
  Target, DollarSign, Pill, Syringe, BookOpen,
  ShieldAlert, Users, TrendingUp, Moon, Zap,
  UserPlus, Smile, ChevronRight, ChevronLeft,
  CheckCircle, BarChart2,
} from 'lucide-react-native';
import { useResponsive } from '../../utils/responsive';

const SLIDES = [
  {
    key: 'welcome', emoji: '🦄', iconType: 'emoji',
    title: 'Bem-vindo ao\nConexão Terapêutica',
    subtitle: 'O app que organiza a jornada terapêutica do seu filho, do início ao acompanhamento diário.',
    color: colors.primary, bg: `${colors.primary}15`,
  },
  {
    key: 'dashboard', Icon: Home, iconColor: colors.primary,
    title: 'Início — Seu Painel',
    subtitle: 'Veja o próximo compromisso, atividades de hoje, metas em aberto e medicamentos, tudo de uma vez.',
    color: colors.primary, bg: `${colors.primary}12`,
  },
  {
    key: 'agenda', Icon: Calendar, iconColor: colors.purple,
    title: 'Agenda Completa',
    subtitle: 'Cadastre sessões de equoterapia, consultas, exames e compromissos. Acesse por dia com calendário.',
    color: colors.purple, bg: colors.purpleBg,
  },
  {
    key: 'medical', Icon: Stethoscope, iconColor: colors.error,
    title: 'Prontuário Digital',
    subtitle: 'Ficha médica (diagnósticos, alergias, tipo sanguíneo), histórico de consultas e dados de saúde.',
    color: colors.error, bg: colors.errorBg,
  },
  {
    key: 'medications', Icon: Pill, iconColor: colors.purple,
    title: 'Medicamentos & Adesão',
    subtitle: 'Cadastre remédios, controle estoque, marque doses tomadas e veja estatísticas de adesão.',
    color: colors.purple, bg: colors.purpleBg,
  },
  {
    key: 'goals', Icon: Target, iconColor: colors.amber,
    title: 'Metas Terapêuticas',
    subtitle: 'Defina objetivos com a equipe, acompanhe o progresso e registre notas de evolução.',
    color: colors.amber, bg: colors.warningBg,
  },
  {
    key: 'vault', Icon: FolderClosed, iconColor: colors.emerald,
    title: 'Cofre de Documentos',
    subtitle: 'Armazene laudos, receitas, exames e relatórios. Busque e filtre por categoria.',
    color: colors.emerald, bg: colors.emeraldBg,
  },
  {
    key: 'expenses', Icon: DollarSign, iconColor: colors.success,
    title: 'Controle de Gastos',
    subtitle: 'Registre despesas com saúde. Veja o total por mês e breakdown por categoria.',
    color: colors.success, bg: colors.emeraldBg,
  },
  {
    key: 'growth', Icon: TrendingUp, iconColor: colors.success,
    title: 'Curva de Crescimento',
    subtitle: 'Acompanhe peso, altura e perímetro cefálico ao longo do tempo.',
    color: colors.success, bg: colors.successBg,
  },
  {
    key: 'vaccines', Icon: Syringe, iconColor: colors.cyan,
    title: 'Caderneta de Vacinas',
    subtitle: 'Registre todas as vacinas com data e lote. Sempre atualizada e acessível.',
    color: colors.cyan, bg: colors.cyanBg,
  },
  {
    key: 'crisis', Icon: Zap, iconColor: colors.error,
    title: 'Rastreador de Crises',
    subtitle: 'Registre episódios com tipo, intensidade e duração. Identifique padrões.',
    color: colors.error, bg: colors.errorBg,
  },
  {
    key: 'sleep', Icon: Moon, iconColor: colors.purple,
    title: 'Diário de Sono',
    subtitle: 'Acompanhe qualidade e duração do sono — informações valiosas para a equipe terapêutica.',
    color: colors.purple, bg: colors.purpleBg,
  },
  {
    key: 'diary', Icon: BookOpen, iconColor: colors.amber,
    title: 'Diário dos Pais',
    subtitle: 'Registre como foi o dia com seu filho. Acompanhe o humor e anote momentos importantes.',
    color: colors.amber, bg: colors.amberBg,
  },
  {
    key: 'caregiver', Icon: UserPlus, iconColor: colors.purple,
    title: 'Compartilhar Acesso',
    subtitle: 'Convide o outro responsável por e-mail. Ambos gerenciam o mesmo perfil juntos.',
    color: colors.purple, bg: colors.purpleBg,
  },
  {
    key: 'emergency', Icon: ShieldAlert, iconColor: colors.error,
    title: 'Modo Emergência 🚨',
    subtitle: 'Contatos de emergência, dados médicos vitais e orientações — mesmo sem internet.',
    color: colors.error, bg: colors.errorBg,
  },
  {
    key: 'done', emoji: '🎉', iconType: 'emoji',
    title: 'Tudo pronto!',
    subtitle: 'Você está preparado para organizar a jornada do seu filho. Este tutorial fica no menu Perfil.',
    color: colors.primaryDark, bg: `${colors.primary}15`,
  },
] as const;

export const TutorialScreen = ({ navigation, route }: any) => {
  const { width, isSmall, isXSmall, slideIconSize, hPad } = useResponsive();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fromProfile = route?.params?.fromProfile || false;
  const contentAnim = useRef(new Animated.Value(1)).current;

  const goTo = (index: number) => {
    if (index < 0 || index >= SLIDES.length) return;
    Animated.timing(contentAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      setCurrent(index);
      scrollRef.current?.scrollTo({ x: index * width, animated: false });
      Animated.timing(contentAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const canGoToOnboarding = () => {
    const state = navigation.getState?.();
    return state?.routeNames?.includes('Onboarding') ?? false;
  };

  const handleFinish = () => {
    if (fromProfile) navigation.goBack();
    else if (canGoToOnboarding()) navigation.replace('Onboarding');
    else navigation.goBack();
  };

  const handleSkip = () => {
    if (fromProfile) navigation.goBack();
    else if (canGoToOnboarding()) navigation.replace('Onboarding');
    else navigation.goBack();
  };

  const isLast  = current === SLIDES.length - 1;
  const isFirst = current === 0;
  const slide   = SLIDES[current];
  const SlideIcon = (slide as any).Icon as React.ComponentType<{ color?: string; size?: number }> | undefined;

  // Adaptive icon size: smaller on small phones
  const iconBoxSize = isXSmall ? 88 : isSmall ? 100 : slideIconSize;
  const iconSize    = isXSmall ? 40 : isSmall ? 48 : 54;
  const emojiSize   = isXSmall ? 44 : isSmall ? 50 : 56;

  const progressPct = ((current + 1) / SLIDES.length) * 100;

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingHorizontal: hPad }]}>
        <Text style={styles.counter}>
          <Text style={styles.counterCurrent}>{current + 1}</Text>
          <Text style={styles.counterTotal}> / {SLIDES.length}</Text>
        </Text>
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipTxt}>Pular</Text>
        </TouchableOpacity>
      </View>

      {/* ── Progress bar ── */}
      <View style={[styles.progressTrack, { marginHorizontal: hPad }]}>
        <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: slide.color }]} />
      </View>

      {/* ── Slides ── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, idx) => {
          const SIcon = (s as any).Icon as React.ComponentType<{ color?: string; size?: number }> | undefined;
          return (
            <Animated.View
              key={s.key}
              style={[
                styles.slide,
                { width, paddingHorizontal: hPad },
                idx === current ? { opacity: contentAnim } : { opacity: 0 },
              ]}
            >
              {/* Icon */}
              <View style={[
                styles.iconBox,
                {
                  width: iconBoxSize,
                  height: iconBoxSize,
                  borderRadius: iconBoxSize * 0.28,
                  backgroundColor: s.bg,
                  marginBottom: isSmall ? spacing.m : spacing.l,
                },
              ]}>
                {(s as any).iconType === 'emoji'
                  ? <Text style={{ fontSize: emojiSize }}>{(s as any).emoji}</Text>
                  : SIcon ? <SIcon color={(s as any).iconColor} size={iconSize} /> : null
                }
              </View>

              {/* Step badge */}
              <View style={[styles.badge, { backgroundColor: `${s.color}18` }]}>
                <Text style={[styles.badgeTxt, { color: s.color }]}>
                  {idx + 1} de {SLIDES.length}
                </Text>
              </View>

              {/* Text — always scrollable in case of very small phone */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                style={{ flexShrink: 1 }}
              >
                <Text style={[
                  styles.title,
                  { color: s.color },
                  isSmall && { fontSize: 20, lineHeight: 28 },
                  isXSmall && { fontSize: 18, lineHeight: 26 },
                ]}>
                  {s.title}
                </Text>
                <Text style={[
                  styles.subtitle,
                  isSmall && { fontSize: 14, lineHeight: 22 },
                ]}>
                  {s.subtitle}
                </Text>
              </ScrollView>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* ── Dots ── */}
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
            hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`Slide ${idx + 1}`}
          >
            <View style={[
              styles.dot,
              idx === current
                ? [styles.dotActive, { backgroundColor: slide.color }]
                : styles.dotInactive,
            ]} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Nav buttons ── */}
      <View style={[styles.nav, { paddingHorizontal: hPad, paddingBottom: isSmall ? spacing.m : spacing.xl }]}>
        <TouchableOpacity
          style={[styles.backBtn, isFirst && styles.invisible]}
          onPress={() => goTo(current - 1)}
          disabled={isFirst}
          accessibilityLabel="Slide anterior"
        >
          <ChevronLeft color={colors.textSecondary} size={18} />
          <Text style={styles.backTxt}>Anterior</Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primaryDark }]}
            onPress={handleFinish}
          >
            <CheckCircle color={colors.surface} size={18} />
            <Text style={styles.nextTxt}>{fromProfile ? 'Fechar' : 'Começar!'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: slide.color }]}
            onPress={() => goTo(current + 1)}
          >
            <Text style={styles.nextTxt}>Próximo</Text>
            <ChevronRight color={colors.surface} size={18} />
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
  },
  counter: {},
  counterCurrent: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  counterTotal:   { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  skipBtn: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radii.chip,
    backgroundColor: `${colors.textSecondary}12`,
  },
  skipTxt: { ...(typography.body2 as object), color: colors.textSecondary, fontWeight: '600' as const },

  progressTrack: { height: 3, backgroundColor: colors.border, borderRadius: 2, marginBottom: spacing.s },
  progressFill:  { height: 3, borderRadius: 2 },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
  },

  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },

  badge: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radii.chip,
    marginBottom: spacing.m,
  },
  badgeTxt: { fontSize: 11, fontWeight: '700' as const, textTransform: 'uppercase', letterSpacing: 0.5 },

  title: {
    ...(typography.h2 as object),
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  subtitle: {
    ...(typography.body1 as object),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 15,
  },

  dotsScroll: { flexGrow: 0, maxHeight: 28 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xs,
  },
  dot:         { borderRadius: 4, height: 7 },
  dotActive:   { width: 22 },
  dotInactive: { width: 7, backgroundColor: colors.border },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
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
    minHeight: 48,
  },
  backTxt: { ...(typography.body2 as object), fontWeight: '700' as const, color: colors.textSecondary },

  invisible: { opacity: 0 } as any,

  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    borderRadius: radii.m,
    gap: spacing.s,
    minHeight: 48,
    ...shadows.button,
  },
  nextTxt: { ...(typography.body1 as object), color: colors.surface, fontWeight: '700' as const },
});
