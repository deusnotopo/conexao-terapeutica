import { Alert, Platform } from 'react-native';

// window is a browser global — guarded at runtime via Platform.OS checks.
declare const window: { confirm: (msg: string) => boolean; alert: (msg: string) => void } | undefined;

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

  if (destructiveBtn && cancelBtn) {
    const confirmed = window?.confirm(fullMessage) ?? false;
    if (confirmed) destructiveBtn?.onPress?.();
    else cancelBtn?.onPress?.();
  } else if (buttons.length > 1) {
    const confirmed = window?.confirm(fullMessage) ?? false;
    if (confirmed) confirmBtn?.onPress?.();
  } else {
    window?.alert(fullMessage);
    buttons[0]?.onPress?.();
  }
}
