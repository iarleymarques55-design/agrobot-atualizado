import { useCallback, useEffect, useRef, useState } from 'react';

/** Notificação temporária no canto da tela. */
export function useToast(duration = 3200) {
  const [toast, setToast] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback(
    (msg) => {
      clearTimeout(timerRef.current);
      setToast(msg);
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), duration);
    },
    [duration]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { toast, visible, showToast };
}
