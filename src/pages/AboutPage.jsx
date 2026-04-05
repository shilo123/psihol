import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-5 h-14">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-main no-underline hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-rounded text-primary text-lg">arrow_forward</span>
            <span className="text-sm font-semibold">חזרה לצ'אט</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <span className="text-sm font-bold text-text-main">הורות בכיס</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-5 py-8 sm:py-10">

        {/* ---- Hero Section ---- */}
        <section className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main mb-3 leading-tight">
            הורות טובה יותר, צעד אחד בכל פעם
          </h1>
          <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            הורות בכיס נולדה מתוך אמונה שלכל הורה מגיע גישה לייעוץ פסיכולוגי איכותי,
            זמין ונגיש — בכל רגע שהוא צריך אותו.
          </p>
        </section>

        {/* ---- Vision & Mission ---- */}
        <section className="grid sm:grid-cols-2 gap-5 mb-12">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-rounded text-primary text-xl">visibility</span>
            </div>
            <h3 className="text-base font-bold text-text-main mb-2">החזון שלנו</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              עולם שבו כל הורה מרגיש בטוח, מצויד ונתמך במסע ההורות שלו.
              אנחנו מאמינים שהורות טובה היא לא עניין של מזל או כישרון —
              אלא של כלים, ידע ותמיכה בזמן הנכון.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
              <span className="material-symbols-rounded text-emerald-600 text-xl">favorite</span>
            </div>
            <h3 className="text-base font-bold text-text-main mb-2">המשימה שלנו</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              להנגיש ידע פסיכולוגי מקצועי לכל הורה בישראל.
              אנחנו משלבים טכנולוגיית AI מתקדמת עם ידע קליני מעמיק
              כדי לתת לכם מענה אישי, חם ומדויק — 24/7.
            </p>
          </div>
        </section>

        {/* ---- How It Works ---- */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-main mb-1 text-center">איך זה עובד?</h2>
          <p className="text-sm text-text-muted mb-6 text-center">שלושה צעדים פשוטים לתמיכה מקצועית</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '1', icon: 'chat', title: 'שאלו שאלה', desc: 'ספרו לנו מה מטריד אתכם — כל שאלה לגיטימית, אין שיפוטיות.' },
              { step: '2', icon: 'psychology', title: 'קבלו מענה מקצועי', desc: 'התשובות מבוססות על גישות פסיכולוגיות מוכחות ומותאמות לילד שלכם.' },
              { step: '3', icon: 'trending_up', title: 'צמחו כהורים', desc: 'עם כל שיחה, תקבלו עוד כלים ותובנות שילוו אתכם בהורות.' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="size-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <div className="size-10 rounded-lg bg-primary/8 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-rounded text-primary text-xl">{item.icon}</span>
                </div>
                <h4 className="font-semibold text-text-main mb-1.5 text-sm">{item.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Team Section ---- */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-main mb-1 text-center">הצוות המקצועי</h2>
          <p className="text-sm text-text-muted mb-6 text-center">היועצות שעומדות מאחורי התוכן המקצועי</p>
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Orit */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
              <div className="size-20 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-gray-300 text-4xl">person</span>
              </div>
              <h3 className="text-base font-bold text-text-main mb-0.5">אורית</h3>
              <p className="text-xs font-medium text-primary mb-2">מדריכת הורים</p>
              <p className="text-sm text-text-muted leading-relaxed">
                מומחית בהתפתחות הילד ודינמיקה משפחתית,
                עם ניסיון עשיר בליווי הורים וילדים בגילאי הילדות המוקדמת.
              </p>
            </div>

            {/* Efrat */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
              <div className="size-20 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-gray-300 text-4xl">person</span>
              </div>
              <h3 className="text-base font-bold text-text-main mb-0.5">אפרת</h3>
              <p className="text-xs font-medium text-emerald-600 mb-2">יועצת פסיכולוגית</p>
              <p className="text-sm text-text-muted leading-relaxed">
                מתמחה בפסיכולוגיה חינוכית והתנהגותית,
                עם התמקדות באתגרי הורות יומיומיים ובניית חוסן רגשי.
              </p>
            </div>
          </div>
        </section>

        {/* ---- Values ---- */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-main mb-6 text-center">הערכים שלנו</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: 'shield', label: 'פרטיות מוחלטת', color: 'text-indigo-500 bg-indigo-50' },
              { icon: 'diversity_3', label: 'ללא שיפוטיות', color: 'text-rose-500 bg-rose-50' },
              { icon: 'science', label: 'מבוסס מחקר', color: 'text-amber-600 bg-amber-50' },
              { icon: 'emoji_objects', label: 'נגיש לכולם', color: 'text-emerald-600 bg-emerald-50' },
            ].map((v) => (
              <div key={v.label} className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-xl border border-gray-200">
                <div className={`size-10 rounded-lg ${v.color} flex items-center justify-center`}>
                  <span className="material-symbols-rounded text-lg">{v.icon}</span>
                </div>
                <span className="text-xs font-semibold text-text-main text-center leading-snug">{v.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Disclaimer ---- */}
        <section className="mb-10">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
            <span className="material-symbols-rounded text-amber-500 text-xl mb-1.5 block">info</span>
            <p className="text-sm text-amber-800 leading-relaxed">
              הורות בכיס היא כלי עזר מבוסס AI ואינה מחליפה ייעוץ או טיפול פסיכולוגי מקצועי.
              במקרה של מצוקה נפשית חריפה, אנא פנו לגורם מקצועי או חייגו לקו החירום <b className="text-red-600">1201</b>.
            </p>
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity no-underline text-sm"
          >
            <span className="material-symbols-rounded text-lg">chat</span>
            בואו נדבר
          </Link>
          <p className="text-xs text-text-muted mt-2">חינם, פרטי ובלי התחייבות</p>
        </section>

      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <span className="text-xs text-text-muted">הורות בכיס © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-text-muted hover:text-primary transition-colors no-underline">צ'אט</Link>
            <Link to="/terms" className="text-xs text-text-muted hover:text-primary transition-colors no-underline">תנאי שימוש</Link>
            <Link to="/privacy" className="text-xs text-text-muted hover:text-primary transition-colors no-underline">פרטיות</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
