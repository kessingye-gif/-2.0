import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  tone: 'success' | 'warning' | 'error';
  onClose: () => void;
}

const toneStyles = {
  success: 'border-[#BBE7CC] bg-[#F0FDF4] text-[#166534]',
  warning: 'border-[#FED7AA] bg-[#FFF7ED] text-[#9A3412]',
  error: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]',
};

export const Toast: React.FC<ToastProps> = ({ message, tone, onClose }) => {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div role="status" aria-live="polite" className={`fixed bottom-6 right-6 z-[100] flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-xl ${toneStyles[tone]}`}>
      <span className="material-symbols-outlined text-[19px]">{tone === 'success' ? 'check_circle' : tone === 'warning' ? 'warning' : 'error'}</span>
      <span className="flex-1 text-[12.5px] font-semibold">{message}</span>
      <button type="button" onClick={onClose} className="material-symbols-outlined text-[17px] opacity-60 hover:opacity-100">close</button>
    </div>
  );
};
