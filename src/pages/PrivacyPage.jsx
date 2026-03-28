import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-background-light via-white to-background-light">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100/60">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-5 h-14">
          <Link to="/" className="flex items-center gap-2 text-text-main no-underline hover:opacity-80 transition-opacity">
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
        {/* Title */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/8 rounded-full mb-6">
            <span className="material-symbols-rounded text-primary text-sm">lock</span>
            <span className="text-xs font-bold text-primary">הגנה על פרטיותכם</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-3">מדיניות פרטיות</h1>
          <p className="text-text-muted text-sm">עודכן לאחרונה: מרץ 2026</p>
        </section>

        <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 p-5 sm:p-7 md:p-10 space-y-8 text-sm text-text-main leading-relaxed">

          {/* Intro */}
          <section>
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
              <p className="text-primary font-semibold flex items-center gap-2 mb-2">
                <span className="material-symbols-rounded text-lg">verified_user</span>
                המחויבות שלנו לפרטיותכם
              </p>
              <p>
                "הורות בכיס" מחויבת להגנה על פרטיות המשתמשים שלה. מדיניות זו מפרטת כיצד אנו אוספים, משתמשים, שומרים ומגנים על המידע שלכם. אנו ממליצים לקרוא מדיניות זו בעיון לפני השימוש באפליקציה.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">folder_open</span>
              1. מידע שאנו אוספים
            </h2>

            <h3 className="font-bold text-base mt-4 mb-2">1.1 מידע שאתם מוסרים</h3>
            <ul className="space-y-1.5">
              <li>• <strong>פרטי הרשמה:</strong> שם, כתובת אימייל, תמונת פרופיל (בכניסה דרך Google).</li>
              <li>• <strong>פרטי הורה:</strong> שם ההורה, גיל, סגנון הורות.</li>
              <li>• <strong>פרטי ילדים:</strong> שם, תאריך לידה, מין, תיאור אופי.</li>
              <li>• <strong>אתגרי הורות:</strong> נושאים שבחרתם כאתגרים (שינה, זעם, וכדומה).</li>
              <li>• <strong>תוכן שיחות:</strong> הודעות שאתם כותבים בצ'אט.</li>
            </ul>

            <h3 className="font-bold text-base mt-4 mb-2">1.2 מידע שנוצר אוטומטית</h3>
            <ul className="space-y-1.5">
              <li>• <strong>תשובות AI:</strong> התשובות שהמערכת מייצרת.</li>
              <li>• <strong>זיכרונות AI:</strong> המערכת מחלצת פרטים חשובים מהשיחות (כגון התנהגויות של ילדים, הישגים) ושומרת אותם כ"זיכרונות" לצורך שיפור תשובות עתידיות.</li>
              <li>• <strong>ציוני ביטחון:</strong> כל תשובת AI מקבלת ציון פנימי שמעריך את רמת הביטחון בתשובה.</li>
              <li>• <strong>נתוני שימוש:</strong> מספר טוקנים (יחידות עיבוד טקסט) לצורך מעקב עלויות.</li>
            </ul>

            <h3 className="font-bold text-base mt-4 mb-2">1.3 מידע שאיננו אוספים</h3>
            <ul className="space-y-1.5">
              <li>• איננו אוספים מידע על מיקומכם הגיאוגרפי.</li>
              <li>• איננו משתמשים בעוגיות מעקב (tracking cookies) של צדדים שלישיים.</li>
              <li>• איננו אוספים מידע פיננסי (כרטיסי אשראי וכדומה).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">settings</span>
              2. כיצד אנו משתמשים במידע
            </h2>
            <ul className="space-y-2">
              <li>• <strong>מתן שירות מותאם אישית:</strong> פרטי הפרופיל, הילדים והאתגרים משולבים בכל שיחה כדי שהתשובות יהיו רלוונטיות למשפחתכם.</li>
              <li>• <strong>שיפור תשובות:</strong> "זיכרונות AI" נשמרים כדי לאפשר המשכיות בין שיחות ותשובות מדויקות יותר.</li>
              <li>• <strong>בקרת איכות:</strong> שאלות שה-AI פחות בטוח בתשובתן (ציון ביטחון נמוך) נשמרות לצורך סקירה פנימית ושיפור המערכת.</li>
              <li>• <strong>ניתוח סטטיסטי:</strong> אנו משתמשים בנתונים מצטברים (לא מזוהים) להבנת דפוסי שימוש ושיפור השירות.</li>
              <li>• <strong>תקשורת:</strong> לשליחת עדכונים חיוניים הנוגעים לשירות (לא דיוור שיווקי).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">storage</span>
              3. אחסון ושמירת מידע
            </h2>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full mt-2 text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-right p-3 font-bold border border-gray-200 rounded-tr-xl">סוג מידע</th>
                    <th className="text-right p-3 font-bold border border-gray-200">משך שמירה</th>
                    <th className="text-right p-3 font-bold border border-gray-200 rounded-tl-xl">מחיקה</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['חשבון משתמש רגיל', 'עד מחיקה ידנית', 'דרך הגדרות החשבון'],
                    ['חשבון אורח', '3 ימים', 'אוטומטית'],
                    ['שיחות', '3 ימים ללא פעילות', 'אוטומטית או ידנית'],
                    ['זיכרונות AI', 'עד 100 לכל משתמש', 'ישנים נמחקים אוטומטית'],
                    ['נתוני שימוש (טוקנים)', '90 יום', 'אוטומטית'],
                  ].map(([type, duration, deletion], i) => (
                    <tr key={i} className={i % 2 ? 'bg-gray-50/50' : ''}>
                      <td className="p-3 border border-gray-200">{type}</td>
                      <td className="p-3 border border-gray-200">{duration}</td>
                      <td className="p-3 border border-gray-200">{deletion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2 mt-3">
              {[
                ['חשבון משתמש רגיל', 'עד מחיקה ידנית', 'דרך הגדרות החשבון'],
                ['חשבון אורח', '3 ימים', 'אוטומטית'],
                ['שיחות', '3 ימים ללא פעילות', 'אוטומטית או ידנית'],
                ['זיכרונות AI', 'עד 100 לכל משתמש', 'ישנים נמחקים אוטומטית'],
                ['נתוני שימוש (טוקנים)', '90 יום', 'אוטומטית'],
              ].map(([type, duration, deletion], i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <p className="font-bold text-sm text-gray-900">{type}</p>
                  <p className="text-xs text-gray-600">שמירה: <span className="font-medium">{duration}</span></p>
                  <p className="text-xs text-gray-600">מחיקה: <span className="font-medium">{deletion}</span></p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">share</span>
              4. שיתוף מידע עם צדדים שלישיים
            </h2>
            <p className="mb-3">אנו משתפים מידע עם צדדים שלישיים רק במקרים הבאים:</p>
            <ul className="space-y-2">
              <li>
                <strong>OpenAI (ספק AI):</strong> תוכן השיחות שלכם נשלח לשירות OpenAI לצורך עיבוד וייצור תשובות. OpenAI פועלת בהתאם ל
                <a href="https://openai.com/policies/api-data-usage-policies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"> מדיניות השימוש בנתונים שלה</a>
                , ואינה משתמשת בנתוני API לאימון מודלים.
              </li>
              <li>
                <strong>Google (אימות):</strong> בכניסה דרך Google, מתקבלים שם, אימייל ותמונת פרופיל בלבד. איננו מקבלים גישה לחשבון Google שלכם.
              </li>
              <li>
                <strong>MongoDB Atlas (אחסון):</strong> הנתונים מאוחסנים בשרתי MongoDB Atlas עם הצפנה. MongoDB פועלת בהתאם לתקני אבטחה מחמירים.
              </li>
              <li>
                <strong>דרישה חוקית:</strong> נחשוף מידע אם נידרש לכך על פי חוק, צו בית משפט או רשות מוסמכת.
              </li>
            </ul>
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
              <p className="font-bold text-green-700 flex items-center gap-2">
                <span className="material-symbols-rounded text-lg">verified</span>
                אנו לא מוכרים את המידע שלכם לצדדים שלישיים, לעולם.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">security</span>
              5. אבטחת מידע
            </h2>
            <ul className="space-y-2">
              <li>• סיסמאות מוצפנות באמצעות bcrypt ואינן נשמרות כטקסט גלוי.</li>
              <li>• התקשורת עם השרתים מוצפנת באמצעות HTTPS/TLS.</li>
              <li>• הגישה למסד הנתונים מוגבלת ומאובטחת.</li>
              <li>• אנו מיישמים אמצעי אבטחה סבירים מקובלים בתעשייה, אולם אין שיטת אבטחה שהיא בטוחה ב-100%. לא ניתן להבטיח הגנה מוחלטת מפני כל סיכון.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">checklist</span>
              6. הזכויות שלכם
            </h2>
            <p className="mb-3">בהתאם לחוק הגנת הפרטיות, עומדות לכם הזכויות הבאות:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: 'visibility', title: 'זכות עיון', desc: 'לעיין במידע שנשמר עליכם' },
                { icon: 'edit', title: 'זכות תיקון', desc: 'לתקן מידע שגוי או לא מדויק' },
                { icon: 'delete', title: 'זכות מחיקה', desc: 'למחוק את חשבונכם וכל הנתונים' },
                { icon: 'download', title: 'זכות ניידות', desc: 'לקבל עותק של המידע שלכם' },
                { icon: 'block', title: 'זכות הגבלה', desc: 'להגביל את עיבוד המידע שלכם' },
                { icon: 'gavel', title: 'זכות התנגדות', desc: 'להתנגד לעיבוד מסוים של המידע' },
              ].map(r => (
                <div key={r.icon} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-primary text-lg">{r.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3">
              למימוש זכויותיכם, פנו אלינו בכתובת <span className="text-primary font-semibold">support@psihologit.co.il</span>. נשתדל להשיב תוך 30 ימי עסקים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">child_care</span>
              7. פרטיות ילדים
            </h2>
            <ul className="space-y-2">
              <li>• האפליקציה אוספת מידע על ילדים (שם, גיל, אופי) <strong>רק דרך ההורים</strong> ולצורך התאמת התשובות.</li>
              <li>• אנו לא אוספים מידע ישירות מילדים.</li>
              <li>• מידע על ילדים מטופל ברגישות מוגברת ונמחק עם מחיקת חשבון ההורה.</li>
              <li>• אם נודע לכם שמידע על ילד נאסף שלא כראוי, פנו אלינו ונסיר אותו מיידית.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">cookie</span>
              8. עוגיות (Cookies) ואחסון מקומי
            </h2>
            <ul className="space-y-2">
              <li>• אנו משתמשים ב-localStorage בדפדפן שלכם לשמירת טוקן ההתחברות בלבד.</li>
              <li>• איננו משתמשים בעוגיות מעקב או עוגיות של צדדים שלישיים.</li>
              <li>• שירות Google Sign-In עשוי להשתמש בעוגיות משלו בהתאם למדיניות Google.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">update</span>
              9. שינויים במדיניות
            </h2>
            <p>
              אנו רשאים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באפליקציה. המשך השימוש לאחר עדכון המדיניות מהווה הסכמה לשינויים. מומלץ לבדוק דף זה מדי פעם.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">mail</span>
              10. יצירת קשר
            </h2>
            <p>
              לשאלות, בקשות או תלונות בנוגע לפרטיותכם, פנו אלינו:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-2xl space-y-1">
              <p><strong>אימייל:</strong> <span className="text-primary">support@psihologit.co.il</span></p>
              <p><strong>נושא:</strong> "בקשת פרטיות - [פרטו את בקשתכם]"</p>
            </div>
          </section>

        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <Link
            to="/terms"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-colors no-underline text-sm shadow-sm"
          >
            <span className="material-symbols-rounded text-lg">gavel</span>
            תנאי שימוש
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200 transition-colors no-underline text-sm"
          >
            <span className="material-symbols-rounded text-lg">arrow_forward</span>
            חזרה לצ'אט
          </Link>
        </div>
      </main>
    </div>
  )
}
