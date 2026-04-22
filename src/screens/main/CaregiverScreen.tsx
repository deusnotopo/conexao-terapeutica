import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Linking,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useCaregivers } from '../../hooks/useCaregivers';
import { webAlert } from '../../lib/webAlert';
import { colors, spacing, typography } from '../../theme';
import {
  ChevronLeft,
  UserPlus,
  Mail,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
} from 'lucide-react-native';
import { formatShort } from '../../utils/formatDate';

export const CaregiverScreen = ({ navigation }: any) => {
  const { activeDependent, user } = useUser();
  const {
    caregivers,
    invites,
    loading,
    refreshing,
    refresh,
    sendInvite,
    revokeAccess,
    revokeInvite,
  } = useCaregivers(activeDependent?.id ?? "");

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendInvite = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }
    setSending(true);
    setErrorMsg('');
    try {
      const result = await sendInvite({
        invited_by: user?.id ?? "",
        invited_email: email.trim().toLowerCase(),
      } as any);

      if (!result.success) throw new Error(result.error ?? undefined);

      setEmail('');
      // Open default email client to help user send manual message (Best effort)
      const body = encodeURIComponent(
        `Olá! Te convidei para cuidar de ${(activeDependent?.name ?? "")} no app Conexão Terapêutica.\n\nBaixe o app, crie sua conta com este e-mail (${email.trim()}) e você terá acesso automático.`
      );
      const subject = encodeURIComponent(
        `Convite para o app Conexão Terapêutica — ${(activeDependent?.name ?? "")}`
      );
      void Linking.openURL(`mailto:${email.trim()}?subject=${subject}&body=${body}`
      ).catch(() => {});
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao enviar convite.');
    } finally {
      setSending(false);
    }
  };

  const handleRevokeAccess = (caregiver: any) => {
    const name =
      caregiver.profiles?.full_name ||
      caregiver.invited_email ||
      'este cuidador';
    webAlert('Remover Acesso', `Deseja remover o acesso de ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => revokeAccess(caregiver.id),
      },
    ]);
  };

  const handleRevokeInvite = (invite: any) => {
    webAlert(
      'Revogar Convite',
      `Deseja cancelar o convite para ${invite.invited_email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: () => revokeInvite(invite.id),
        },
      ]
    );
  };

  const STATUS_ICON = {
    pending: <Clock color="#d97706" size={18} />,
    accepted: <CheckCircle color="#16a34a" size={18} />,
    declined: <XCircle color="#dc2626" size={18} />,
  };
  const STATUS_LABEL = {
    pending: 'Aguardando',
    accepted: 'Aceito',
    declined: 'Recusado',
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
        <Text style={styles.headerTitle}>Compartilhar Acesso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refresh();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* Invite Box */}
        <View style={styles.inviteCard}>
          <Text style={styles.inviteTitle}>👥 Convidar Cuidador</Text>
          <Text style={styles.inviteDesc}>
            Convide outro responsável (pai, mãe, avô/avó, cuidador) para
            gerenciar {activeDependent?.name} junto com você. Eles criam
            uma conta no app com este e-mail e têm acesso automático.
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.emailInput}
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendInvite}
              disabled={sending}
            >
              <Mail color={colors.surface} size={18} />
              <Text style={styles.sendBtnText}>
                {sending ? '...' : 'Convidar'}
              </Text>
            </TouchableOpacity>
          </View>
          {errorMsg ? (
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          ) : null}
        </View>

        {/* Active Caregivers */}
        {caregivers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Cuidadores com Acesso</Text>
            {caregivers.map((c: any) => (
              <View key={c.id} style={styles.caregiverCard}>
                <View style={styles.caregiverIcon}>
                  <Users color={colors.primary} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caregiverName}>
                    {c.profiles?.full_name || 'Cuidador'}
                  </Text>
                  <Text style={styles.caregiverRole}>
                    {c.access_level === 'admin'
                      ? 'Acesso completo'
                      : 'Acesso de leitura'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRevokeAccess(c)}
                  style={styles.revokeBtn}
                >
                  <Trash2 color={colors.error} size={16} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Pending/Sent Invites */}
        {invites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📨 Convites Enviados</Text>
            {invites.map((inv: any) => (
              <View
                key={inv.id}
                style={[
                  styles.inviteRow,
                  inv.status === 'accepted' && styles.inviteAccepted,
                  inv.status === 'declined' && styles.inviteDeclined,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviteEmail}>{inv.invited_email}</Text>
                  <Text style={styles.inviteDate}>
                    {formatShort(inv.created_at)}
                  </Text>
                </View>
                <View style={styles.inviteStatus}>
                  {(STATUS_ICON as any)[inv.status]}
                  <Text style={styles.inviteStatusText}>
                    {(STATUS_LABEL as any)[inv.status]}
                  </Text>
                </View>
                {inv.status === 'pending' && (
                  <TouchableOpacity
                    onPress={() => handleRevokeInvite(inv)}
                    style={{ padding: 4, marginLeft: spacing.s }}
                  >
                    <Trash2 color={colors.error} size={16} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {caregivers.length === 0 && invites.length === 0 && !loading && (
          <View style={styles.empty}>
            <UserPlus color={colors.border} size={48} />
            <Text style={styles.emptyTitle}>Nenhum cuidador compartilhado</Text>
            <Text style={styles.emptyText}>
              Convide o outro responsável para gerenciar juntos.
            </Text>
          </View>
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
  backBtn: { padding: 4 },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l,
    paddingBottom: 100,
  },
  inviteCard: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: 20,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
  },
  inviteTitle: {
    ...(typography.body1 as object),
    fontWeight: '700' as const,
    color: colors.primaryDark,
    marginBottom: spacing.s,
  },
  inviteDesc: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.m,
  },
  inputRow: { flexDirection: 'row', gap: spacing.s },
  emailInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...(typography.body2 as object),
    color: colors.text,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: 12,
  },
  sendBtnText: {
    ...(typography.body2 as object),
    color: colors.surface,
    fontWeight: '700' as const,
  },
  errorText: {
    ...(typography.caption as object),
    color: colors.error,
    marginTop: spacing.s,
  },
  section: { marginBottom: spacing.l },
  sectionTitle: {
    ...(typography.body1 as object),
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: spacing.m,
  },
  caregiverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  caregiverIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caregiverName: { ...(typography.body2 as object), fontWeight: '700' as const, color: colors.text },
  caregiverRole: { ...(typography.caption as object), color: colors.textSecondary },
  revokeBtn: {
    padding: 6,
    backgroundColor: `${colors.error}10`,
    borderRadius: 8,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inviteAccepted: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  inviteDeclined: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
    opacity: 0.7,
  },
  inviteEmail: { ...(typography.body2 as object), fontWeight: '600' as const, color: colors.text },
  inviteDate: { ...(typography.caption as object), color: colors.textSecondary },
  inviteStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inviteStatusText: {
    ...(typography.caption as object),
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.m },
  emptyTitle: { ...(typography.h3 as object), color: colors.textSecondary },
  emptyText: {
    ...(typography.body2 as object),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
