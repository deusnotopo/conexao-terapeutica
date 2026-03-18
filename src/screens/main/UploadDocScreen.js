import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../context/UserContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { FileText, Type, ChevronLeft, Upload, FileCheck } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export const UploadDocScreen = ({ navigation }) => {
    const { activeDependent, user } = useUser();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Laudo');
    const [selectedFile, setSelectedFile] = useState(null);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                setSelectedFile(result.assets[0]);
            }
        } catch (err) {
            console.error('Error picking document:', err);
        }
    };

    const handleUpload = async () => {
        if (!title.trim()) {
            Alert.alert('Erro', 'Por favor, insira um título para o documento.');
            return;
        }

        if (!selectedFile) {
            Alert.alert('Erro', 'Por favor, selecione um arquivo.');
            return;
        }

        if (!activeDependent) {
            Alert.alert('Erro', 'Nenhum dependente selecionado.');
            return;
        }

        setLoading(true);
        try {
            const fileUri = selectedFile.uri;
            const fileName = `${Date.now()}-${selectedFile.name}`;
            const filePath = `${user.id}/${activeDependent.id}/${fileName}`;

            // Read file as base64
            const base64 = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Upload to Supabase Storage
            const { data: storageData, error: storageError } = await supabase.storage
                .from('vault')
                .upload(filePath, decode(base64), {
                    contentType: selectedFile.mimeType,
                });

            if (storageError) throw storageError;

            // Save metadata to documents table
            const { error: dbError } = await supabase
                .from('documents')
                .insert([{
                    dependent_id: activeDependent.id,
                    title,
                    category,
                    file_path: storageData.path,
                    file_type: selectedFile.mimeType,
                }]);

            if (dbError) throw dbError;

            Alert.alert('Sucesso', 'Documento salvo com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error uploading document:', error);
            Alert.alert('Erro', 'Ocorreu um problema no upload. Verifique as permissões do Storage.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={colors.primaryDark} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Novo Documento</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
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
                        {['Laudo', 'Exame', 'Receita', 'Outro'].map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.typeChip,
                                    category === cat && styles.typeChipActive
                                ]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[
                                    styles.typeChipText,
                                    category === cat && styles.typeChipTextActive
                                ]}>{cat}</Text>
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
                                <Text style={styles.fileName}>{selectedFile.name}</Text>
                                <Text style={styles.fileSize}>
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
                    title={loading ? "Fazendo upload..." : "Salvar no Cofre"}
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
    headerTitle: { ...typography.h3, color: colors.primaryDark },
    container: { padding: spacing.l },
    inputGroup: { marginBottom: spacing.l },
    label: {
        ...typography.body2,
        fontWeight: '600',
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
        ...typography.caption,
        fontWeight: '500',
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
        ...typography.body1,
        color: colors.primary,
        marginTop: spacing.s,
        fontWeight: '600',
    },
    uploadHint: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 4,
    },
    fileName: {
        ...typography.body2,
        fontWeight: '600',
        color: colors.text,
        marginTop: spacing.s,
        paddingHorizontal: spacing.m,
        textAlign: 'center',
    },
    fileSize: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    saveButton: { marginTop: spacing.m },
    loadingOverlay: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    loadingText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.s,
    }
});
