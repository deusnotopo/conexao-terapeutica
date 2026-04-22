import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { webAlert } from '../../lib/webAlert';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, typography } from '../../theme';
import {
  User,
  Baby,
  LogOut,
  ChevronRight,
  Plus,
  Heart,
  FileHeart,
  DollarSign,
  Target,
  Stethoscope,
  Pill,
  Syringe,
  BookOpen,
  Smile,
  ShieldAlert,
  Users,
  Zap,
  TrendingUp,
  Scale,
  Moon,
  ChevronDown,
  ChevronUp,
  UserPlus,
  BarChart2,
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
      {
        label: 'Ficha Médica',
        icon: FileHeart,
        color: '#dc2626',
        bg: '#fff1f2',
        route: 'MedicalRecord',
      },
      {
        label: 'Histórico de Consultas',
        icon: Stethoscope,
        color: '#7c3aed',
        bg: '#ede9fe',
        route: 'Consultations',
      },
      {
        label: 'Medicamentos & Estoque',
        icon: Pill,
        color: '#7c3aed',
        bg: '#ede9fe',
        route: 'Medications',
      },
      {
        label: 'Adesão a Medicamentos',
        icon: BarChart2,
        color: '#7c3aed',
        bg: '#ede9fe',
        route: 'MedicationAdherence',
      },
      {
        label: 'Caderneta de Vacinas',
        icon: Syringe,
        color: '#16a34a',
        bg: '#dcfce7',
        route: 'Vaccines',
      },
      {
        label: 'Rastreador de Crises',
        icon: Zap,
        color: '#dc2626',
        bg: '#fff1f2',
        route: 'Crisis',
      },
      {
        label: 'Curva de Crescimento',
        icon: TrendingUp,
        color: '#16a34a',
        bg: '#f0fdf4',
        route: 'Growth',
      },
      {
        label: 'Diário de Sono',
        icon: Moon,
        color: '#7c3aed',
        bg: '#ede9fe',
        route: 'Sleep',
      },
      {
        label: 'Diretório de Profissionais',
        icon: Users,
        color: '#2563eb',
        bg: '#eff6ff',
        route: 'Professionals',
      },
      {
        label: 'Compartilhar Acesso',
        icon: UserPlus,
        color: '#7c3aed',
        bg: '#ede9fe',
        route: 'Caregiver',
      },
    ],
  },
  {
    key: 'rotina',
    title: '📅 Rotina & Desenvolvim.',
    color: '#2563eb',
    items: [
      {
        label: 'Metas Terapêuticas',
        icon: Target,
        color: '#d97706',
        bg: '#fef9c3',
        route: 'Goals',
      },
      {
        label: 'Diário dos Pais',
        icon: BookOpen,
        color: '#d97706',
        bg: '#fef3c7',
        route: 'ParentDiary',
      },
      {
        label: 'Meu Bem-Estar',
        icon: Smile,
        color: '#db2777',
        bg: '#fce7f3',
        route: 'Wellbeing',
      },
    ],
  },
  {
    key: 'financeiro',
    title: '💰 Financeiro & Direitos',
    color: '#16a34a',
    items: [
      {
        label: 'Gastos com Saúde',
        icon: DollarSign,
        color: '#16a34a',
        bg: '#dcfce7',
        route: 'Expenses',
      },
      {
        label: 'Direitos e Benefícios',
        icon: Scale,
        color: '#d97706',
        bg: '#fefce8',
        route: 'Benefits',
      },
    ],
  },
  {
    key: 'conta',
    title: '⚙️ Conta',
    color: '#6b7280',
    items: [
      {
        label: 'Ver Tutorial do App',
        icon: BookOpen,
        color: colors.primary,
        bg: `${colors.primary}15`,
        route: 'Tutorial',
        routeParams: { fromProfile: true },
      },
      {
        label: 'Sobre a Unicórnio Campina Verde',
        icon: Heart,
        color: '#db2777',
        bg: '#fce7f3',
        route: 'About',
      },
    ],
  },
];

const ActionRow = ({ label, Icon, color, bg, onPress }: any) => (
  <TouchableOpacity
    style={styles.actionRow}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[
        styles.actionIcon,
        { backgroundColor: bg || `${colors.border}30` },
      ]}
    >
      <Icon color={color || colors.textSecondary} size={20} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <ChevronRight color={colors.border} size={18} />
  </TouchableOpacity>
);

const CollapsibleSection = ({ section, navigation }: any) => {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionToggle}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {open ? (
          <ChevronUp color={colors.textSecondary} size={18} />
        ) : (
          <ChevronDown color={colors.textSecondary} size={18} />
        )}
      </TouchableOpacity>
      {open && (
        <View style={styles.sectionContent}>
          {section.items.map((item: any) => (
            <ActionRow
              key={item.label}
              label={item.label}
              Icon={item.icon}
              color={item.color}
              bg={item.bg}
              onPress={
                item.route
                  ? () => navigation.navigate(item.route, item.routeParams)
                  : undefined
              }
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const ProfileScreen = ({ navigation }: any) => {
  const { 
    user, 
    profile, 
    dependents, 
    activeDependent, 
    setActiveDependent, 
    updateAvatar,
    logout
  } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const [avatarUri, setAvatarUri] = useState(profile?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setUploadingAvatar(true);

      const ext = asset.uri.split('.').pop() || 'jpg';
      let fileBody;

      if (asset.base64) {
        const binary = atob(asset.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        fileBody = bytes;
      } else {
        const response = await fetch(asset.uri);
        fileBody = await response.blob();
      }

      const res = await updateAvatar(fileBody as any, ext);
      
      if (res.success) {
        if (res.data?.avatar_url) {
          setAvatarUri(res.data.avatar_url);
        } else if (res.metadata?.enqueued) {
          webAlert('Offline', 'Seu novo avatar será enviado assim que você estiver online.');
        }
      } else {
        webAlert('Erro', 'Não foi possível atualizar o avatar.');
      }
    } catch (_: any) {
      // Best-effort: picker cancelled or unavailable, previous avatar unchanged
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    webAlert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
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
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={{ fontSize: 32, fontWeight: '700' as const, color: colors.surface }}>
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={{ fontSize: 11, color: colors.surface, fontWeight: '700' as const }}>
                {uploadingAvatar ? '...' : '📷'}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {profile?.full_name || 'Usuário'}
            </Text>
            {user?.email && (
              <Text
                style={{
                  ...(typography.body2 as object),
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                {user.email}
              </Text>
            )}
            <Text style={styles.userRole}>
              {(profile as any)?.role === 'parent'
                ? '👨‍👩‍👧 Pai / Responsável'
                : '🩺 Terapeuta'}
            </Text>
            {activeDependent && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: `${colors.primary}15`,
                  alignSelf: 'flex-start',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 12, marginRight: 4 }}>👶</Text>
                <Text
                  style={{
                    ...(typography.caption as object),
                    color: colors.primaryDark,
                    fontWeight: '700' as const,
                  }}
                >
                  {(activeDependent?.name ?? "")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Dependents Section */}
        <View style={styles.section}>
          <View style={styles.sectionToggle}>
            <Text style={styles.sectionTitle}>👶 Dependentes</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddDependent')}
              style={styles.addDepBtn}
            >
              <Plus color={colors.primary} size={18} />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            {dependents.map((dep: any) => (
              <TouchableOpacity
                key={dep.id}
                style={[
                  styles.depCard,
                  activeDependent?.id === dep.id && styles.activeDepCard,
                ]}
                onPress={() => setActiveDependent(dep)}
              >
                <View
                  style={[
                    styles.depIcon,
                    {
                      backgroundColor:
                        activeDependent?.id === dep.id
                          ? `${colors.primary}20`
                          : `${colors.secondary}10`,
                    },
                  ]}
                >
                  <Baby
                    color={
                      activeDependent?.id === dep.id
                        ? colors.primary
                        : colors.secondary
                    }
                    size={22}
                  />
                </View>
                <View style={styles.depInfo}>
                  <Text style={styles.depName}>
                    {dep.name} {""}
                  </Text>
                  <Text style={styles.depDetail}>
                    {activeDependent?.id === dep.id
                      ? '✅ Ativo agora'
                      : 'Toque para selecionar'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    navigation.navigate('EditDependent', { dependent: dep })
                  }
                >
                  <ChevronRight color={colors.textSecondary} size={18} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 🚨 Emergency Mode - always visible, top priority */}
        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={() => navigation.navigate('Emergency')}
        >
          <ShieldAlert color={colors.surface} size={22} />
          <Text style={styles.emergencyBtnText}>🚨 Modo Emergência</Text>
          <ChevronRight color={colors.surface} size={18} />
        </TouchableOpacity>

        {/* Collapsible Sections */}
        {SECTIONS.filter((s: any) => !s.isSpecial).map((section: any) => (
          <CollapsibleSection
            key={section.key}
            section={section}
            navigation={navigation}
          />
        ))}

        {/* Dark Mode Toggle */}
        <View style={styles.themeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.themeLabel}>{isDark ? '🌙 Modo Escuro' : '☀️ Modo Claro'}</Text>
            <Text style={styles.themeSub}>Altera a aparência do aplicativo</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ true: colors.primaryDark, false: colors.border }}
            thumbColor={isDark ? colors.primary : colors.surface}
          />
        </View>

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
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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

  profileCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.l,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.l,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: { flex: 1 },
  userName: { ...(typography.h2 as object), fontSize: 20, color: colors.text },
  userRole: { ...(typography.body2 as object), marginTop: 4, color: colors.textSecondary },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  addDepBtn: {
    padding: 4,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
  },
  sectionContent: { paddingHorizontal: spacing.s, paddingVertical: spacing.s },

  depCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  activeDepCard: { backgroundColor: `${colors.primary}08` },
  depIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  depInfo: { flex: 1 },
  depName: { ...(typography.body1 as object), fontWeight: '600' as const, color: colors.text },
  depDetail: { ...(typography.caption as object), color: colors.textSecondary },
  editBtn: { padding: spacing.s },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  actionLabel: {
    ...(typography.body2 as object),
    flex: 1,
    fontWeight: '500' as const,
    color: colors.text,
  },

  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: '#dc2626',
    borderRadius: 20,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  emergencyBtnText: {
    ...(typography.body1 as object),
    color: colors.surface,
    fontWeight: '800' as const,
    flex: 1,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginTop: spacing.m,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  logoutText: { ...(typography.body1 as object), color: colors.error, fontWeight: '600' as const },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeLabel: { ...(typography.body1 as object), fontWeight: '700' as const, color: colors.text },
  themeSub: { ...(typography.caption as object), color: colors.textSecondary, marginTop: 2 },
  versionText: {
    ...(typography.caption as object),
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textSecondary,
  },
});
