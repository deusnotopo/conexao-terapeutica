import React, { useState, useRef, useCallback } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';
import { colors, spacing, typography } from '../theme';

// Singleton ref para ser chamado de qualquer lugar
let _showToast = null;

export const Toast = () => {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('success'); // 'success' | 'error' | 'info'
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;
    const timerRef = useRef(null);

    const show = useCallback((msg, toastType = 'success') => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setMessage(msg);
        setType(toastType);

        Animated.parallel([
            Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start();

        timerRef.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
            ]).start();
        }, 2800);
    }, [opacity, translateY]);

    // Register singleton
    _showToast = show;

    const config = {
        success: { bg: '#dcfce7', border: '#86efac', iconColor: '#16a34a', Icon: CheckCircle },
        error:   { bg: '#fee2e2', border: '#fca5a5', iconColor: colors.error, Icon: XCircle },
        info:    { bg: '#eff6ff', border: '#93c5fd', iconColor: colors.secondary, Icon: Info },
    }[type] || { bg: '#dcfce7', border: '#86efac', iconColor: '#16a34a', Icon: CheckCircle };

    return (
        <Animated.View style={[
            styles.toast,
            { backgroundColor: config.bg, borderColor: config.border },
            { opacity, transform: [{ translateY }] },
        ]}>
            <config.Icon color={config.iconColor} size={18} />
            <Text style={[styles.text, { color: config.iconColor }]}>{message}</Text>
        </Animated.View>
    );
};

// Função global para mostrar toast de qualquer tela
export const showToast = (message, type = 'success') => {
    if (_showToast) _showToast(message, type);
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.m,
        borderRadius: 50,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 9999,
        maxWidth: 360,
    },
    text: {
        ...typography.body2,
        fontWeight: '700',
    },
});
