import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, spacing, typography } from '../../theme';

export const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    async function signInWithEmail() {
        if (!email || !password) {
            setErrorMsg('Por favor, preencha o email e senha.');
            return;
        }
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
        });

        if (error) {
            setErrorMsg(error.message);
        }
        setLoading(false);
    }

    async function signUpWithEmail() {
        if (!email || !password || !fullName) {
            setErrorMsg('Por favor, preencha todos os campos.');
            return;
        }
        if (password.length < 6) {
            setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(true);

        const { data: { session }, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: { full_name: fullName },
            },
        });

        if (error) {
            setErrorMsg(error.message);
        } else if (!session) {
            setSuccessMsg('Quase lá! Verifique sua caixa de entrada para ativar a conta.');
        }
        setLoading(false);
    }

    const handleSwitch = () => {
        setIsSignUp(!isSignUp);
        setErrorMsg('');
        setSuccessMsg('');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Conexão Terapêutica</Text>
                        <Text style={styles.subtitle}>
                            A rotina do seu filho, organizada e conectada.
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        {isSignUp && (
                            <Input
                                label="Nome Completo"
                                onChangeText={(text) => { setFullName(text); setErrorMsg(''); }}
                                value={fullName}
                                placeholder="Seu nome"
                            />
                        )}
                        <Input
                            label="E-mail"
                            onChangeText={(text) => { setEmail(text); setErrorMsg(''); }}
                            value={email}
                            placeholder="email@exemplo.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <Input
                            label="Senha"
                            onChangeText={(text) => { setPassword(text); setErrorMsg(''); }}
                            value={password}
                            secureTextEntry={true}
                            placeholder="Mínimo 6 caracteres"
                            autoCapitalize="none"
                        />

                        {errorMsg ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                            </View>
                        ) : null}

                        {successMsg ? (
                            <View style={styles.successBox}>
                                <Text style={styles.successText}>✅ {successMsg}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.buttonsContainer}>
                        <Button
                            title={isSignUp ? 'Criar Conta' : 'Entrar'}
                            onPress={() => isSignUp ? signUpWithEmail() : signInWithEmail()}
                            loading={loading}
                        />

                        <TouchableOpacity
                            onPress={handleSwitch}
                            style={styles.toggleButton}
                        >
                            <Text style={styles.toggleText}>
                                {isSignUp
                                    ? 'Já tem uma conta? Entre aqui'
                                    : 'Não tem conta? Cadastre-se'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Tutorial')}
                            style={styles.tourButton}
                        >
                            <Text style={styles.tourText}>🦄 Ver tour completo do app</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    flex: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.l,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    title: {
        ...typography.h1,
        color: colors.primaryDark,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body1,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    formContainer: {
        marginBottom: spacing.l,
        width: '100%',
    },
    buttonsContainer: {
        width: '100%',
        gap: spacing.s,
    },
    toggleButton: {
        marginTop: spacing.m,
        alignItems: 'center',
    },
    toggleText: {
        ...typography.body2,
        color: colors.primary,
        fontWeight: '600',
    },
    tourButton: {
        marginTop: spacing.m,
        alignItems: 'center',
        paddingVertical: spacing.s,
    },
    tourText: {
        ...typography.body2,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    errorBox: {
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        padding: spacing.s,
        marginTop: spacing.s,
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
    },
    errorText: {
        color: colors.error,
        fontSize: 14,
        fontWeight: '500',
    },
    successBox: {
        backgroundColor: '#dcfce7',
        borderRadius: 8,
        padding: spacing.s,
        marginTop: spacing.s,
        borderLeftWidth: 4,
        borderLeftColor: colors.success,
    },
    successText: {
        color: '#166534',
        fontSize: 14,
        fontWeight: '500',
    },
});
