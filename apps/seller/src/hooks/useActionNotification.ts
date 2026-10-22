import { useCallback, useEffect, useRef, useState } from 'react';

export const ACTION_NOTIFICATION_DURATION = { success: 4000, error: 5000 } as const;
type NotificationType = keyof typeof ACTION_NOTIFICATION_DURATION;

/** One replaceable action message; field validation stays with the form. */
export function useActionNotification() {
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  const cancelTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const clearNotification = useCallback(() => {
    cancelTimer();
    if (mounted.current) setNotification(null);
  }, [cancelTimer]);

  const notify = useCallback((type: NotificationType, message: string) => {
    cancelTimer();
    if (!mounted.current) return;
    setNotification({ type, message });
    timer.current = setTimeout(() => {
      timer.current = null;
      if (mounted.current) setNotification(null);
    }, ACTION_NOTIFICATION_DURATION[type]);
  }, [cancelTimer]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelTimer();
    };
  }, [cancelTimer]);

  return { notification, notify, clearNotification };
}
