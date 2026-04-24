import React from 'react';
import { RootStackProps } from '../../navigation/types';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useProfessionals } from '../../hooks/useProfessionals';
import { webAlert } from '../../lib/webAlert';
import { Professional } from '../../lib/schemas';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Plus,
  Phone,
  Mail,
  MapPin,
  User,
  Stethoscope,
  Star,
  Edit2,
  Trash2,
} from 'lucide-react-native';

const SPECIALTIES = [
  'Equoterapia',
  'Neuropediatria',
  'Neurologia',
  'Pediatria',
  'Fisioterapia',
  'Fonoaudiologia',
  'T. Ocupacional',
  'Psicologia',
  'Ortopedia',
  'Oftalmologia',
  'Nutrição',
  'Outro',
];

const COLORS = [
  '#7c3aed',
  '#2563eb',
  '#0891b2',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#db2777',
  '#6b7280',
];

const getColor = (specialty: string) => {
  const idx = SPECIALTIES.indexOf(specialty) % COLORS.length;
  return COLORS[Math.max(0, idx)];
};

export const ProfessionalsScreen = ({ navigation }: RootStackProps<'Professionals'>) => {
  const { activeDependent } = useUser();
  const {
    professionals,
    loading,
    refreshing,
    refresh,
    deleteProfessional,
  } = useProfessionals(activeDependent?.id ?? "");

  const handleDelete = (p: Professional) => {
    webAlert('Excluir', `Remover ${p.name} do diretório?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteProfessional(p.id),
      },
    ]);
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profissionais</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProfessionalForm')}
          style={styles.addBtn}
        >
          <Plus color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
          />
        }
      >
        {professionals.length === 0 && !loading && (
          <View style={styles.empty}>
            <Stethoscope color={colors.border} size={48} />
            <Text style={styles.emptyTitle}>
              Nenhum profissional cadastrado
            </Text>
            <Text style={styles.emptyText}>
              Adicione médicos, terapeutas e especialistas para ter tudo em um
              só lugar.
            </Text>
          </View>
        )}

        {professionals.map((p: Professional) => {
          const color = getColor(p.specialty);
          return (
            <View
              key={p.id}
              style={[styles.card, p.is_primary && styles.primaryCard]}
            >
              {p.is_primary && (
                <Text style={styles.primaryBadge}>⭐ Principal</Text>
              )}
              <View style={styles.cardTop}>
                <View
                  style={[styles.avatar, { backgroundColor: `${color}20` }]}
                >
                  <Text style={[styles.avatarText, { color }]}>
                    {p.name
                      .split(' ')
                      .slice(0, 2)
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.profName}>{p.name}</Text>
                  <View
                    style={[
                      styles.specialtyBadge,
                      { backgroundColor: `${color}15` },
                    ]}
                  >
                    <Text style={[styles.specialtyText, { color }]}>
                      {p.specialty}
                    </Text>
                  </View>
                  {p.clinic ? (
                    <Text style={styles.clinic}>🏥 {p.clinic}</Text>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ProfessionalForm', { professional: p })}
                    style={styles.deleteBtn}
                  >
                    <Edit2 color={colors.textSecondary} size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(p)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 color={colors.error} size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              {(p.phone || p.email || p.address) && (
                <View style={styles.contactRow}>
                  {p.phone && (
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() =>
                        p.phone && Linking.openURL(`tel:${p.phone.replace(/\D/g, '')}`)
                      }
                    >
                      <Phone color={colors.surface} size={16} />
                      <Text style={styles.contactBtnText}>{p.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {p.email && (
                    <TouchableOpacity
                      style={[
                        styles.contactBtn,
                        { backgroundColor: `${color}20` },
                      ]}
                      onPress={() => Linking.openURL(`mailto:${p.email}`)}
                    >
                      <Mail color={color} size={16} />
                      <Text style={[styles.contactBtnText, { color }]}>
                        Email
                      </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    height: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  addBtn: {
    padding: 8,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 10,
  },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
  },
  empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.textSecondary },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.l,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryCard: {
    borderColor: `${colors.secondary}50`,
    backgroundColor: `${colors.secondary}05`,
  },
  primaryBadge: {
    ...(typography.caption as object),
    fontWeight: '700' as const,
    color: colors.secondary,
    marginBottom: spacing.s,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800' as const },
  cardInfo: { flex: 1 },
  profName: {
    ...(typography.body1 as object),
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 6,
  },
  specialtyBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: spacing.m,
    paddingVertical: 4,
    marginBottom: 4,
  },
  specialtyText: { ...(typography.caption as object), fontWeight: '700' as const },
  clinic: { ...(typography.caption as object), color: colors.textSecondary },
  deleteBtn: { padding: 4 },
  contactRow: { flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap' },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.m,
    paddingVertical: 8,
  },
  contactBtnText: {
    ...(typography.caption as object),
    color: colors.surface,
    fontWeight: '600' as const,
  },
  notes: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: spacing.s,
    fontStyle: 'italic',
  },
});
