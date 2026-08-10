export type NotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermission;
  } catch {
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermission;
}

export async function sendNativeNotification(title: string, body: string, icon?: string): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: icon || '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'venrate-alert',
          requireInteraction: true,
          actions: [{ action: 'dismiss', title: 'Cerrar' }],
        } as NotificationOptions);
      });
      return true;
    } else {
      const notif = new Notification(title, {
        body,
        icon: icon || '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'venrate-alert',
        requireInteraction: true,
      });
      return true;
    }
  } catch {
    return false;
  }
}

export function vibrateOnAlert(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate([150, 80, 150]);
  }
}
