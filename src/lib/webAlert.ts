import { Alert, Platform } from 'react-native';
import { getWebWindow } from './platform';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export function webAlert(
  title: string,
  message: string = '',
  buttons: AlertButton[] = [{ text: 'OK' }]
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const destructiveBtn = buttons.find((b) => b.style === 'destructive');
  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const confirmBtn =
    buttons.find((b) => b.style !== 'cancel' && b.style !== 'destructive') ||
    destructiveBtn;

  const fullMessage = [title, message].filter(Boolean).join('\n\n');
  const w = getWebWindow();

  if (destructiveBtn && cancelBtn) {
    const confirmed = w?.confirm(fullMessage) ?? false;
    if (confirmed) destructiveBtn?.onPress?.();
    else cancelBtn?.onPress?.();
  } else if (buttons.length > 1) {
    const confirmed = w?.confirm(fullMessage) ?? false;
    if (confirmed) confirmBtn?.onPress?.();
  } else {
    w?.alert(fullMessage);
    buttons[0]?.onPress?.();
  }
}
