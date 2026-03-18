/**
 * webAlert.js
 * Cross-platform alert utility.
 * On web, uses window.confirm() / window.alert() since React Native's
 * Alert.alert with button callbacks does NOT work reliably on web.
 * On native, falls through to the real Alert.
 */
import { Alert, Platform } from 'react-native';

/**
 * Drop-in replacement for Alert.alert that works on web.
 *
 * @param {string} title
 * @param {string} message
 * @param {Array<{text: string, onPress?: () => void, style?: string}>} buttons
 */
export function webAlert(title, message = '', buttons = [{ text: 'OK' }]) {
    if (Platform.OS !== 'web') {
        // On native, use the real Alert as-is
        Alert.alert(title, message, buttons);
        return;
    }

    // On web, map button configurations to confirm/alert dialogs
    const destructiveBtn = buttons.find(b => b.style === 'destructive');
    const cancelBtn = buttons.find(b => b.style === 'cancel');
    const confirmBtn = buttons.find(b => b.style !== 'cancel' && b.style !== 'destructive') || destructiveBtn;

    if (destructiveBtn && cancelBtn) {
        // Two-button dialog → use confirm()
        const fullMessage = [title, message].filter(Boolean).join('\n\n');
        const confirmed = window.confirm(fullMessage);
        if (confirmed && destructiveBtn?.onPress) {
            destructiveBtn.onPress();
        } else if (!confirmed && cancelBtn?.onPress) {
            cancelBtn.onPress();
        }
    } else if (buttons.length > 1) {
        // Multiple non-destructive buttons
        const fullMessage = [title, message].filter(Boolean).join('\n\n');
        const confirmed = window.confirm(fullMessage);
        if (confirmed && confirmBtn?.onPress) {
            confirmBtn.onPress();
        }
    } else {
        // Single button → use alert()
        const fullMessage = [title, message].filter(Boolean).join('\n\n');
        window.alert(fullMessage);
        if (buttons[0]?.onPress) buttons[0].onPress();
    }
}
