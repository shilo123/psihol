import { useState, useRef, useEffect, useCallback } from 'react'

const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]

function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate()
}

function calculateAge(y, m, d) {
  const birth = new Date(y, m - 1, d)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--
    months += 12
  }
  if (years < 0) return null
  if (years === 0) return `${months} חודשים`
  if (years === 1) return 'שנה'
  return `${years} שנים`
}

function WheelColumn({ items, selectedIndex, onChange, label }) {
  const containerRef = useRef(null)
  const ITEM_HEIGHT = 44
  const isScrolling = useRef(false)

  useEffect(() => {
    if (containerRef.current && !isScrolling.current) {
      containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT
    }
  }, [selectedIndex])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    isScrolling.current = true
    clearTimeout(containerRef.current._scrollTimer)
    containerRef.current._scrollTimer = setTimeout(() => {
      const idx = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      containerRef.current.scrollTop = clamped * ITEM_HEIGHT
      if (clamped !== selectedIndex) onChange(clamped)
      isScrolling.current = false
    }, 80)
  }, [items.length, selectedIndex, onChange])

  return (
    <div className="flex-1 flex flex-col items-center">
      <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</span>
      <div className="relative h-[132px] w-full overflow-hidden">
        {/* Selection highlight */}
        <div className="absolute top-[44px] inset-x-1 h-[44px] bg-primary/10 rounded-xl border-2 border-primary/20 pointer-events-none z-10" />
        {/* Fade edges */}
        <div className="absolute top-0 inset-x-0 h-[44px] bg-gradient-to-b from-white to-transparent dark:from-surface-dark pointer-events-none z-20" />
        <div className="absolute bottom-0 inset-x-0 h-[44px] bg-gradient-to-t from-white to-transparent dark:from-surface-dark pointer-events-none z-20" />

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-none snap-y snap-mandatory"
          style={{ scrollBehavior: 'smooth', scrollSnapType: 'y mandatory' }}
        >
          {/* Top spacer */}
          <div style={{ height: ITEM_HEIGHT }} />
          {items.map((item, i) => (
            <div
              key={i}
              onClick={() => { onChange(i); if (containerRef.current) containerRef.current.scrollTop = i * ITEM_HEIGHT }}
              className={`h-[44px] flex items-center justify-center cursor-pointer snap-center transition-all duration-150 select-none ${
                i === selectedIndex
                  ? 'text-primary font-black text-lg'
                  : 'text-gray-400 font-medium text-base hover:text-gray-600'
              }`}
            >
              {item.label}
            </div>
          ))}
          {/* Bottom spacer */}
          <div style={{ height: ITEM_HEIGHT }} />
        </div>
      </div>
    </div>
  )
}

export default function BirthDatePicker({ value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false)

  // Parse value (YYYY-MM-DD)
  const parsed = value ? value.split('-').map(Number) : [null, null, null]
  const [selYear, selMonth, selDay] = parsed[0]
    ? [parsed[0], parsed[1], parsed[2]]
    : [new Date().getFullYear() - 3, 1, 1]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 19 }, (_, i) => {
    const y = currentYear - i
    return { value: y, label: String(y) }
  })

  const months = MONTHS_HE.map((name, i) => ({
    value: i + 1,
    label: name,
  }))

  const daysCount = getDaysInMonth(selMonth, selYear)
  const days = Array.from({ length: daysCount }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
  }))

  const yearIdx = years.findIndex(y => y.value === selYear)
  const monthIdx = selMonth - 1
  const dayIdx = Math.min(selDay - 1, daysCount - 1)

  function update(y, m, d) {
    const maxDay = getDaysInMonth(m, y)
    const safeDay = Math.min(d, maxDay)
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
    onChange(dateStr)
  }

  const age = value ? calculateAge(selYear, selMonth, selDay) : null
  const isFuture = value && new Date(value) > new Date()
  const isTooOld = value && (currentYear - selYear) > 18

  let validationError = null
  if (isFuture) validationError = 'תאריך לידה לא יכול להיות בעתיד'
  else if (isTooOld) validationError = 'הגיל חייב להיות עד 18'

  return (
    <div>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full h-14 pr-12 pl-4 rounded-2xl border-2 bg-white/70 text-right flex items-center transition-all duration-200 focus:ring-4 focus:ring-primary/10 focus:border-primary relative ${
          error || validationError
            ? 'border-red-400 ring-4 ring-red-100'
            : value ? 'border-primary/30 hover:border-primary' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">calendar_month</span>
        {value ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-base font-medium text-text-main">
              {selDay} {MONTHS_HE[selMonth - 1]} {selYear}
            </span>
            {age && !validationError && (
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {age}
              </span>
            )}
          </div>
        ) : (
          <span className="text-base text-gray-400">בחר/י תאריך לידה</span>
        )}
      </button>

      {/* Validation error */}
      {validationError && (
        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
          <span className="material-symbols-rounded text-sm">error</span>
          {validationError}
        </p>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full sm:max-w-sm bg-white dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <span className="material-symbols-rounded text-white text-lg">cake</span>
                </div>
                <span className="font-black text-text-main">תאריך לידה</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="size-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-text-main hover:bg-gray-100 transition-all"
              >
                <span className="material-symbols-rounded text-xl">close</span>
              </button>
            </div>

            {/* Wheels */}
            <div className="flex gap-1 px-4 py-5" dir="ltr">
              <WheelColumn
                label="יום"
                items={days}
                selectedIndex={dayIdx}
                onChange={(i) => update(selYear, selMonth, days[i].value)}
              />
              <WheelColumn
                label="חודש"
                items={months}
                selectedIndex={monthIdx}
                onChange={(i) => update(selYear, months[i].value, selDay)}
              />
              <WheelColumn
                label="שנה"
                items={years}
                selectedIndex={yearIdx >= 0 ? yearIdx : 3}
                onChange={(i) => update(years[i].value, selMonth, selDay)}
              />
            </div>

            {/* Age preview */}
            {age && !validationError && (
              <div className="mx-5 mb-3 p-3 bg-primary/5 rounded-xl flex items-center justify-center gap-2">
                <span className="material-symbols-rounded text-primary text-lg">child_care</span>
                <span className="text-sm font-bold text-primary">גיל: {age}</span>
              </div>
            )}
            {validationError && (
              <div className="mx-5 mb-3 p-3 bg-red-50 rounded-xl flex items-center justify-center gap-2">
                <span className="material-symbols-rounded text-red-500 text-lg">error</span>
                <span className="text-sm font-bold text-red-500">{validationError}</span>
              </div>
            )}

            {/* Confirm */}
            <div className="px-5 pb-5 pt-1">
              <button
                onClick={() => { if (!validationError) setIsOpen(false) }}
                disabled={!!validationError}
                className="w-full h-12 bg-gradient-to-l from-primary to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-rounded text-lg">check</span>
                אישור
              </button>
            </div>
          </div>

          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .animate-slideUp { animation: slideUp 0.3s ease-out; }
            .scrollbar-none::-webkit-scrollbar { display: none; }
            .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      )}
    </div>
  )
}
