import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background-light">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-30 bg-white border-b border-border-color">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-14">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-main no-underline hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-rounded text-primary text-lg">arrow_forward</span>
            <span className="text-sm font-medium">חזרה לצ'אט</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <span className="text-sm font-bold text-text-main">הורות בכיס</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ---- Intro ---- */}
        <section className="mb-14 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main mb-3 leading-snug">
            קצת עלינו
          </h1>
          <p className="text-text-muted text-sm sm:text-base leading-relaxed">
            הורות בכיס נולדה מתוך אמונה שלכל הורה מגיע גישה לייעוץ פסיכולוגי איכותי,
            זמין ונגיש — בכל רגע שהוא צריך אותו. אנחנו משלבים ידע קליני מקצועי עם
            טכנולוגיה כדי לתת מענה אישי, חם ומדויק.
          </p>
        </section>

        {/* ---- Vision & Mission — asymmetric layout ---- */}
        <section className="mb-14 grid sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2 bg-white rounded-lg border border-border-color p-6">
            <h3 className="text-base font-bold text-text-main mb-2 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-lg">visibility</span>
              החזון שלנו
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              עולם שבו כל הורה מרגיש בטוח, מצויד ונתמך במסע ההורות שלו.
              אנחנו מאמינים שהורות טובה היא לא עניין של מזל או כישרון —
              אלא של כלים, ידע ותמיכה בזמן הנכון.
            </p>
          </div>
          <div className="bg-white rounded-lg border border-border-color p-6">
            <h3 className="text-base font-bold text-text-main mb-2 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-lg">favorite</span>
              המשימה
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              להנגיש ידע פסיכולוגי מקצועי לכל הורה בישראל — מענה אישי, 24/7.
            </p>
          </div>
        </section>

        {/* ---- How It Works — horizontal flow ---- */}
        <section className="mb-14">
          <h2 className="text-lg font-bold text-text-main mb-5">איך זה עובד?</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { step: '1', title: 'שאלו שאלה', desc: 'ספרו לנו מה מטריד אתכם — כל שאלה לגיטימית.' },
              { step: '2', title: 'קבלו מענה מקצועי', desc: 'תשובות מבוססות על גישות פסיכולוגיות מוכחות.' },
              { step: '3', title: 'צמחו כהורים', desc: 'עם כל שיחה, עוד כלים ותובנות שילוו אתכם.' },
            ].map((item, i) => (
              <div key={item.step} className="flex-1 flex items-start gap-3 bg-white rounded-lg border border-border-color p-4">
                <span className="shrink-0 size-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-semibold text-text-main text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Team — side-by-side compact ---- */}
        <section className="mb-14">
          <h2 className="text-lg font-bold text-text-main mb-5">הצוות המקצועי</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <div className="flex items-start gap-4 bg-white rounded-lg border border-border-color p-4">
              <div className="shrink-0 size-12 rounded-full bg-primary-light flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-xl">person</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-main">אורית</h3>
                <p className="text-xs text-text-sub mb-1.5">מדריכת הורים</p>
                <p className="text-xs text-text-muted leading-relaxed">
                  מומחית בהתפתחות הילד ודינמיקה משפחתית, עם ניסיון עשיר בליווי הורים וילדים.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-lg border border-border-color p-4">
              <div className="shrink-0 size-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="material-symbols-rounded text-emerald-600 text-xl">person</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-main">אפרת</h3>
                <p className="text-xs text-emerald-600 mb-1.5">יועצת פסיכולוגית</p>
                <p className="text-xs text-text-muted leading-relaxed">
                  מתמחה בפסיכולוגיה חינוכית והתנהגותית, עם התמקדות באתגרי הורות יומיומיים.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Values — inline list, not cards ---- */}
        <section className="mb-14">
          <h2 className="text-lg font-bold text-text-main mb-4">הערכים שלנו</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: 'shield', label: 'פרטיות מוחלטת' },
              { icon: 'diversity_3', label: 'ללא שיפוטיות' },
              { icon: 'science', label: 'מבוסס מחקר' },
              { icon: 'emoji_objects', label: 'נגיש לכולם' },
            ].map((v) => (
              <span key={v.label} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-border-color text-xs font-medium text-text-main">
                <span className="material-symbols-rounded text-primary text-sm">{v.icon}</span>
                {v.label}
              </span>
            ))}
          </div>
        </section>

        {/* ---- Disclaimer ---- */}
        <section className="mb-10 max-w-2xl">
          <p className="text-xs text-text-muted leading-relaxed border-r-2 border-amber-400 pr-3">
            <strong className="text-amber-700">שימו לב:</strong>{' '}
            הורות בכיס היא כלי עזר מבוסס AI ואינה מחליפה ייעוץ או טיפול פסיכולוגי מקצועי.
            במקרה של מצוקה נפשית חריפה, אנא פנו לגורם מקצועי או חייגו לקו החירום{' '}
            <strong className="text-red-600">1201</strong>.
          </p>
        </section>

        {/* ---- CTA ---- */}
        <section className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity no-underline text-sm"
          >
            <span className="material-symbols-rounded text-base">chat</span>
            בואו נדבר
          </Link>
        </section>

      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border-color bg-white">
        <div className="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">
          <span className="text-xs text-text-muted">הורות בכיס © {new Date().getFullYear()}</span>
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
