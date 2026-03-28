import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-background-light via-white to-background-light flex items-center justify-center p-5">
      <div className="max-w-md w-full text-center anim-fade-in-up">
        {/* Illustration */}
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[160px] font-black text-primary/10 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-24 sm:size-28 rounded-3xl bg-gradient-to-br from-primary/15 to-purple-500/15 flex items-center justify-center anim-pop-in">
              <span className="material-symbols-rounded text-primary text-5xl sm:text-6xl">sentiment_confused</span>
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main mb-3">
          אופס! הדף לא נמצא
        </h1>
        <p className="text-text-muted text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
          נראה שהגעתם למקום שלא קיים.
          <br />
          אל דאגה, אנחנו כאן כדי להחזיר אתכם למסלול.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-l from-primary to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:brightness-110 transition-all duration-200 no-underline text-sm active:scale-[0.97]"
          >
            <span className="material-symbols-rounded text-lg">home</span>
            חזרה לדף הבית
          </Link>
          <Link
            to="/about"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border-2 border-gray-200 text-text-main font-bold rounded-2xl hover:border-primary/30 hover:bg-gray-50 transition-all no-underline text-sm"
          >
            <span className="material-symbols-rounded text-lg text-gray-400">info</span>
            קצת עלינו
          </Link>
        </div>

        {/* Fun footer */}
        <div className="mt-12 flex items-center justify-center gap-2 text-text-muted/50">
          <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <span className="text-xs font-bold">הורות בכיס</span>
        </div>
      </div>
    </div>
  )
}
