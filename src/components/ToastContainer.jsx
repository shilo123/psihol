import { useToastStore } from '../../shared/toastStore'

const ICONS = {
  error: 'error',
  success: 'check_circle',
  info: 'info',
}

const COLORS = {
  error: 'from-red-500 to-rose-600',
  success: 'from-emerald-500 to-green-600',
  info: 'from-blue-500 to-indigo-600',
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white bg-gradient-to-r ${COLORS[t.type]} animate-slideDown`}
          dir="rtl"
        >
          <span className="material-symbols-outlined text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            {ICONS[t.type]}
          </span>
          <span className="text-sm font-medium flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 size-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
