import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useConsultations } from '../../hooks/useConsultations';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  Plus,
  Stethoscope,
  User,
  Trash2,
  Pencil,
} from 'lucide-react-native';
import { formatShort, formatShortYear2 } from '../../utils/formatDate';
import { LoadingState } from '../../components/LoadingState';

export const ConsultationsScreen = ({ navigation }: any) => {
  const { activeDependent } = useUser();
  const {
    items: consultations,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    total,
    refresh,
    loadMore,
    deleteById,
  } = useConsultations(activeDependent?.id);

  const handleDelete = (c) => {
    webAlert(
      'Excluir Consulta',
      `Deseja excluir a consulta de ${c.specialty}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteById(c.id),
        },
      ]
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Consultas</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ConsultationForm')}
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
        {consultations.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Stethoscope color={colors.border} size={56} />
            <Text style={styles.emptyTitle}>Nenhuma consulta registrada</Text>
            <Text style={styles.emptyText}>
              Mantenha um histórico completo das consultas médicas e retornos.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('ConsultationForm')}
            >
              <Plus color="#fff" size={18} />
              <Text style={styles.emptyBtnText}>Registrar Consulta</Text>
            </TouchableOpacity>
          </View>
        ) : loading && consultations.length === 0 ? (
          <LoadingState message="Carregando consultas..." />
        ) : null}

        {consultations.map((c: any) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconBox}>
                <Stethoscope color={colors.primary} size={22} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.specialty}>{c.specialty}</Text>
                {c.physician_name ? (
                  <Text style={styles.physician}>
                    <User size={12} color={colors.textSecondary} />{' '}
                    {c.physician_name}
                  </Text>
                ) : null}
                {c.cid_code ? (
                  <Text style={styles.cid}>CID: {c.cid_code}</Text>
                ) : null}
                {c.notes ? (
                  <Text style={styles.notes} numberOfLines={2}>
                    {c.notes}
                  </Text>
                ) : null}
                {c.next_appointment ? (
                  <Text style={styles.nextAppt}>
                    📅 Retorno: {formatShort(c.next_appointment)}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.date}>{formatShortYear2(c.date)}</Text>
              <View style={styles.actionBtns}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ConsultationForm', { consultation: c })
                  }
                  style={styles.editBtn}
                >
                  <Pencil color={colors.primary} size={15} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(c)}
                  style={styles.deleteBtn}
                >
                  <Trash2 color={colors.error} size={15} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Paginação */}
        {consultations.length > 0 && (
          <Text style={styles.counter}>
            Exibindo {consultations.length} de {total} consulta
            {total !== 1 ? 's' : ''}
          </Text>
        )}
        {hasMore && (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={loadMore}
            disabled={loadingMore}
          >
            <Text style={styles.loadMoreText}>
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </Text>
          </TouchableOpacity>
        )}
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
  emptyTitle: { ...(typography.h3 as object), color: colors.text },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    marginTop: spacing.s,
  },
  emptyBtnText: { ...(typography.body2 as object), fontWeight: '700' as const, color: '#fff' },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: { flexDirection: 'row', flex: 1, gap: spacing.m },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  specialty: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  physician: { ...(typography.body2 as object), color: colors.textSecondary, marginTop: 2 },
  cid: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  notes: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  nextAppt: {
    ...(typography.caption as object),
    color: colors.primary,
    marginTop: 6,
    fontWeight: '600' as const,
  },
  cardRight: { alignItems: 'flex-end', gap: spacing.s, marginLeft: spacing.s },
  date: { ...(typography.caption as object), color: colors.textSecondary },
  actionBtns: { flexDirection: 'row', gap: spacing.s },
  editBtn: {
    padding: 5,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
  },
  deleteBtn: {
    padding: 5,
    backgroundColor: `${colors.error}10`,
    borderRadius: 8,
  },
  counter: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.m,
  },
  loadMoreBtn: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  loadMoreText: {
    ...(typography.body2 as object),
    color: colors.primary,
    fontWeight: '700' as const,
  },
});
