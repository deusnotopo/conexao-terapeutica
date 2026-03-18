import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../theme';

export const Button = ({
    title,
    onPress,
    variant = 'primary', // 'primary', 'secondary', 'outline'
    loading = false,
    disabled = false,
    style = {}
}) => {
    const isOutline = variant === 'outline';

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.button,
                styles[variant],
                (disabled || loading) && styles.disabled,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isOutline ? colors.primary : colors.surface} />
            ) : (
                <Text style={[
                    styles.text,
                    isOutline ? styles.textOutline : styles.textSolid
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
        marginVertical: spacing.s,
        width: '100%',
    },
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        ...typography.body1,
        fontWeight: '600',
    },
    textSolid: {
        color: colors.surface,
    },
    textOutline: {
        color: colors.primary,
    },
});
