import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { webAlert } from '../../lib/webAlert';
import { useUser } from '../../context/UserContext';
import { useDocuments } from '../../hooks/useDocuments';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  Type,
  ChevronLeft,
  Upload,
  FileCheck,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
export const UploadDocScreen = ({ navigation }: any) => {
  const { activeDependent, user } = useUser();
  const { addDocument } = useDocuments(activeDependent?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Laudo');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err: any) {
      // Silent error during picker
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      webAlert('Erro', 'Por favor, insira um título para o documento.');
      return;
    }

    if (!selectedFile) {
      webAlert('Erro', 'Por favor, selecione um arquivo.');
      return;
    }

    if (!activeDependent) {
      webAlert('Erro', 'Nenhum dependente selecionado.');
      return;
    }

    setLoading(true);
    try {
      const sf = selectedFile as any;
      const fileName = `${Date.now()}-${sf.name}`;
      const filePath = `${user?.id}/${activeDependent.id}/${fileName}`;
      
      const metadata: any = {
        title,
        category,
        file_path: filePath,
        file_type: sf.mimeType,
      };

      const success = await addDocument(metadata, sf.uri);
      
      if (success) {
        navigation.goBack();
      }
    } catch (error: any) {
      webAlert(
        'Erro',
        'Ocorreu um problema no processamento do upload.'
      );
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Novo Documento</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Input
          label="Título do Documento"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Laudo Neuropsicológico 2024"
          icon={<Type size={20} color={colors.textSecondary} />}
        />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.typeSelector}>
            {['Laudo', 'Exame', 'Receita', 'Outro'].map((cat: any) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.typeChip,
                  category === cat && styles.typeChipActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    category === cat && styles.typeChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.label}>Arquivo</Text>
          <TouchableOpacity
            style={[styles.uploadBox, selectedFile && styles.uploadBoxSelected]}
            onPress={pickDocument}
          >
            {selectedFile ? (
              <>
                <FileCheck color={colors.success} size={40} />
                <Text style={styles.fileName}>{(selectedFile as any).name}</Text>
                <Text style={styles.fileSize}>
                  {((selectedFile as any).size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </>
            ) : (
              <>
                <Upload color={colors.primary} size={40} />
                <Text style={styles.uploadText}>Selecionar PDF ou Imagem</Text>
                <Text style={styles.uploadHint}>Máximo 10MB</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Button
          title={loading ? 'Fazendo upload...' : 'Salvar no Cofre'}
          onPress={handleUpload}
          disabled={loading || !selectedFile}
          style={styles.saveButton}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Criptografando e enviando...</Text>
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
  backButton: { padding: 4 },
  headerTitle: { ...(typography.h3 as object), color: colors.primaryDark },
  container: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexGrow: 1,
    padding: spacing.l, paddingBottom: 100 },
  inputGroup: { marginBottom: spacing.l },
  label: {
    ...(typography.body2 as object),
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.s,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  typeChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    ...(typography.caption as object),
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.surface,
  },
  uploadSection: { marginBottom: spacing.l },
  uploadBox: {
    height: 160,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  uploadBoxSelected: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}05`,
  },
  uploadText: {
    ...(typography.body1 as object),
    color: colors.primary,
    marginTop: spacing.s,
    fontWeight: '600' as const,
  },
  uploadHint: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 4,
  },
  fileName: {
    ...(typography.body2 as object),
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: spacing.s,
    paddingHorizontal: spacing.m,
    textAlign: 'center',
  },
  fileSize: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: 2,
  },
  saveButton: { marginTop: spacing.m },
  loadingOverlay: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...(typography.caption as object),
    color: colors.textSecondary,
    marginTop: spacing.s,
  },
});
