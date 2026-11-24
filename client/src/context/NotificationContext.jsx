import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const notifySuccess = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const notifyError = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const notifyInfo = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <NotificationContext.Provider value={{ notifySuccess, notifyError, notifyInfo, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bg = 'bg-dark-800 border-dark-600 text-slate-100';
          let icon = <Info className="w-5 h-5 text-brand-primary flex-shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-950/90 border-rose-700/60 text-rose-100';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in ${bg}`}
            >
              {icon}
              <div className="flex-1 text-sm leading-relaxed">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
