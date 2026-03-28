import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-background-light via-white to-background-light">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100/60">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-5 h-14">
          <Link
            to="/"
            className="flex items-center gap-2 text-text-main no-underline hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-rounded text-primary text-lg">arrow_forward</span>
            <span className="text-sm font-bold">חזרה לצ'אט</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <span className="text-sm font-extrabold text-text-main">הורות בכיס</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-5 py-8 sm:py-10">

        {/* ---- Hero Section ---- */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/8 rounded-full mb-6">
            <span className="material-symbols-rounded text-primary text-sm">info</span>
            <span className="text-xs font-bold text-primary">קצת עלינו</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-4 leading-tight">
            הורות טובה יותר,<br />
            <span className="bg-gradient-to-l from-primary to-purple-600 bg-clip-text text-transparent">צעד אחד בכל פעם</span>
          </h1>
          <p className="text-text-muted text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            הורות בכיס נולדה מתוך אמונה שלכל הורה מגיע גישה לייעוץ פסיכולוגי איכותי,
            זמין ונגיש — בכל רגע שהוא צריך אותו.
          </p>
        </section>

        {/* ---- Vision & Mission ---- */}
        <section className="grid sm:grid-cols-2 gap-5 mb-16">
          <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 p-7 sm:p-8">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/15 to-purple-500/15 flex items-center justify-center mb-5">
              <span className="material-symbols-rounded text-primary text-2xl">visibility</span>
            </div>
            <h3 className="text-lg font-extrabold text-text-main mb-3">החזון שלנו</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              עולם שבו כל הורה מרגיש בטוח, מצויד ונתמך במסע ההורות שלו.
              אנחנו מאמינים שהורות טובה היא לא עניין של מזל או כישרון —
              אלא של כלים, ידע ותמיכה בזמן הנכון.
            </p>
          </div>
          <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 p-7 sm:p-8">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center mb-5">
              <span className="material-symbols-rounded text-emerald-600 text-2xl">favorite</span>
            </div>
            <h3 className="text-lg font-extrabold text-text-main mb-3">המשימה שלנו</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              להנגיש ידע פסיכולוגי מקצועי לכל הורה בישראל.
              אנחנו משלבים טכנולוגיית AI מתקדמת עם ידע קליני מעמיק
              כדי לתת לכם מענה אישי, חם ומדויק — 24/7.
            </p>
          </div>
        </section>

        {/* ---- How It Works ---- */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-text-main mb-2">איך זה עובד?</h2>
            <p className="text-sm text-text-muted">שלושה צעדים פשוטים לתמיכה מקצועית</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { step: '1', icon: 'chat', title: 'שאלו שאלה', desc: 'ספרו לנו מה מטריד אתכם — כל שאלה לגיטימית, אין שיפוטיות.' },
              { step: '2', icon: 'psychology', title: 'קבלו מענה מקצועי', desc: 'התשובות מבוססות על גישות פסיכולוגיות מוכחות ומותאמות לילד שלכם.' },
              { step: '3', icon: 'trending_up', title: 'צמחו כהורים', desc: 'עם כל שיחה, תקבלו עוד כלים ותובנות שילוו אתכם בהורות.' },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <div className="absolute -top-3 right-1/2 translate-x-1/2 size-7 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-extrabold shadow-md">
                  {item.step}
                </div>
                <div className="size-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4 mt-2 group-hover:bg-primary/12 transition-colors">
                  <span className="material-symbols-rounded text-primary text-2xl">{item.icon}</span>
                </div>
                <h4 className="font-bold text-text-main mb-2">{item.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Team Section ---- */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-text-main mb-2">הצוות המקצועי</h2>
            <p className="text-sm text-text-muted">היועצות שעומדות מאחורי התוכן המקצועי</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Orit */}
            <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-48 bg-gradient-to-br from-primary/10 via-purple-100/50 to-pink-100/50 flex items-center justify-center relative overflow-hidden">
                {/* Empty image placeholder */}
                <div className="size-28 rounded-full bg-white/80 border-4 border-white shadow-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-rounded text-primary/30 text-5xl">person</span>
                </div>
                {/* Decorative */}
                <div className="absolute top-4 left-4 size-8 rounded-full bg-primary/10 blur-sm" />
                <div className="absolute bottom-6 right-6 size-6 rounded-full bg-pink-300/20 blur-sm" />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-lg font-extrabold text-text-main mb-1">אורית</h3>
                <p className="text-xs font-semibold text-primary mb-3">מדריכת הורים</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  מומחית בהתפתחות הילד ודינמיקה משפחתית,
                  עם ניסיון עשיר בליווי הורים וילדים בגילאי הילדות המוקדמת.
                </p>
              </div>
            </div>

            {/* Efrat */}
            <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-48 bg-gradient-to-br from-emerald-50/80 via-teal-100/50 to-cyan-100/50 flex items-center justify-center relative overflow-hidden">
                {/* Empty image placeholder */}
                <div className="size-28 rounded-full bg-white/80 border-4 border-white shadow-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-rounded text-emerald-400/30 text-5xl">person</span>
                </div>
                {/* Decorative */}
                <div className="absolute top-6 right-4 size-8 rounded-full bg-emerald-200/20 blur-sm" />
                <div className="absolute bottom-4 left-6 size-6 rounded-full bg-teal-300/20 blur-sm" />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-lg font-extrabold text-text-main mb-1">אפרת</h3>
                <p className="text-xs font-semibold text-emerald-600 mb-3">יועצת פסיכולוגית</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  מתמחה בפסיכולוגיה חינוכית והתנהגותית,
                  עם התמקדות באתגרי הורות יומיומיים ובניית חוסן רגשי.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Values ---- */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-text-main mb-2">הערכים שלנו</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: 'shield', label: 'פרטיות מוחלטת', color: 'text-indigo-500 bg-indigo-50' },
              { icon: 'diversity_3', label: 'ללא שיפוטיות', color: 'text-rose-500 bg-rose-50' },
              { icon: 'science', label: 'מבוסס מחקר', color: 'text-amber-600 bg-amber-50' },
              { icon: 'emoji_objects', label: 'נגיש לכולם', color: 'text-emerald-600 bg-emerald-50' },
            ].map((v) => (
              <div key={v.label} className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`size-11 rounded-xl ${v.color} flex items-center justify-center`}>
                  <span className="material-symbols-rounded text-xl">{v.icon}</span>
                </div>
                <span className="text-xs font-bold text-text-main text-center leading-snug">{v.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Disclaimer ---- */}
        <section className="mb-12">
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-6 text-center">
            <span className="material-symbols-rounded text-amber-500 text-2xl mb-2 block">info</span>
            <p className="text-sm text-amber-800 leading-relaxed font-medium">
              הורות בכיס היא כלי עזר מבוסס AI ואינה מחליפה ייעוץ או טיפול פסיכולוגי מקצועי.
              במקרה של מצוקה נפשית חריפה, אנא פנו לגורם מקצועי או חייגו לקו החירום <b className="text-red-600">1201</b>.
            </p>
          </div>
        </section>

        {/* ---- CTA ---- */}
        <section className="text-center mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-l from-primary to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:brightness-110 transition-all duration-200 no-underline text-base active:scale-[0.97]"
          >
            <span className="material-symbols-rounded text-xl">chat</span>
            בואו נדבר
          </Link>
          <p className="text-xs text-text-muted mt-3">חינם, פרטי ובלי התחייבות</p>
        </section>

      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-gray-100 bg-white/60">
        <div className="max-w-4xl mx-auto px-5 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <span className="text-xs font-bold text-text-muted">הורות בכיס © {new Date().getFullYear()}</span>
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
