import { Link } from 'react-router-dom'

export default function TermsPage() {
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
            <span className="material-symbols-rounded text-primary text-sm">gavel</span>
            <span className="text-xs font-bold text-primary">מסמך משפטי</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-3">תנאי שימוש</h1>
          <p className="text-text-muted text-sm">עודכן לאחרונה: מרץ 2026</p>
        </section>

        <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 border border-gray-100 p-5 sm:p-7 md:p-10 space-y-8 text-sm text-text-main leading-relaxed">

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">description</span>
              1. כללי
            </h2>
            <p>
              ברוכים הבאים ל"הורות בכיס" (להלן: "האפליקציה", "השירות" או "המערכת"). השימוש באפליקציה מהווה הסכמה מלאה ובלתי מותנית לתנאי שימוש אלה. אם אינכם מסכימים לתנאים אלה, אנא הימנעו משימוש באפליקציה.
            </p>
            <p className="mt-2">
              האפליקציה מופעלת ומנוהלת על ידי צוות "הורות בכיס" (להלן: "החברה", "אנחנו"). אנו שומרים לעצמנו את הזכות לעדכן תנאים אלה מעת לעת. המשך השימוש לאחר עדכון מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">info</span>
              2. מהות השירות
            </h2>
            <p>
              האפליקציה מספקת מידע כללי בנושא הורות באמצעות טכנולוגיית בינה מלאכותית (AI). התכנים המסופקים נועדו למתן מידע כללי, תמיכה רגשית ראשונית והכוונה בלבד.
            </p>
            <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="font-bold text-red-700 flex items-center gap-2 mb-2">
                <span className="material-symbols-rounded text-lg">warning</span>
                הבהרה חשובה
              </p>
              <ul className="space-y-1.5 text-red-700">
                <li>• האפליקציה <strong>אינה</strong> מהווה תחליף לייעוץ, אבחון או טיפול פסיכולוגי, רפואי או כל ייעוץ מקצועי אחר.</li>
                <li>• האפליקציה <strong>אינה</strong> שירות חירום. במצב חירום נפשי, פנו מיידית לקו החירום <strong>1201</strong> או לחדר מיון.</li>
                <li>• התכנים מבוססי AI ועלולים לכלול אי-דיוקים. אין להסתמך עליהם כעצה מקצועית מחייבת.</li>
                <li>• האפליקציה אינה מופעלת על ידי פסיכולוגים מורשים ואינה מספקת שירותי פסיכולוגיה קלינית.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">person</span>
              3. הרשמה וחשבון משתמש
            </h2>
            <ul className="space-y-2">
              <li>• השימוש באפליקציה מחייב הרשמה או כניסה באמצעות חשבון Google, אימייל וסיסמה, או שימוש כאורח.</li>
              <li>• המשתמש מתחייב למסור פרטים מדויקים ועדכניים.</li>
              <li>• חשבונות אורח הינם זמניים ויימחקו באופן אוטומטי לאחר 3 ימים, כולל כל הנתונים המשויכים אליהם.</li>
              <li>• אתם אחראים לשמירה על סודיות פרטי הכניסה שלכם. כל פעולה שתבוצע בחשבונכם היא על אחריותכם.</li>
              <li>• אנו רשאים להשעות או לסגור חשבונות שמפרים תנאים אלה.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">rule</span>
              4. שימוש מותר ואסור
            </h2>
            <p className="font-semibold mb-2">שימוש מותר:</p>
            <ul className="space-y-1 mb-3">
              <li>• קבלת מידע כללי ותמיכה בנושאי הורות.</li>
              <li>• שיתוף מידע על ילדיכם לצורך התאמה אישית של התשובות.</li>
            </ul>
            <p className="font-semibold mb-2">שימוש אסור:</p>
            <ul className="space-y-1">
              <li>• שימוש באפליקציה כתחליף לטיפול מקצועי במצבי חירום או מצוקה נפשית.</li>
              <li>• העלאת תכנים פוגעניים, מאיימים, לא חוקיים או מטעים.</li>
              <li>• ניסיון לפרוץ, להפריע או לגשת למידע של משתמשים אחרים.</li>
              <li>• שימוש מסחרי באפליקציה או בתכניה ללא אישור בכתב.</li>
              <li>• העברת גישה לחשבונכם לצד שלישי.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">smart_toy</span>
              5. תוכן מבוסס בינה מלאכותית
            </h2>
            <ul className="space-y-2">
              <li>• התשובות באפליקציה נוצרות באמצעות מודל שפה מבוסס AI ואינן נכתבות או נבדקות על ידי אדם בזמן אמת.</li>
              <li>• ה-AI עלול לייצר תשובות שגויות, לא מדויקות או לא רלוונטיות. איננו ערבים לנכונות, שלמות או עדכניות התכנים.</li>
              <li>• יש להפעיל שיקול דעת עצמאי ולהתייעץ עם גורם מקצועי לפני קבלת החלטות משמעותיות הנוגעות לילדיכם.</li>
              <li>• אנו משפרים את המערכת באופן שוטף אך אין בכך כדי להבטיח דיוק מוחלט.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">database</span>
              6. מידע ונתונים
            </h2>
            <ul className="space-y-2">
              <li>• המערכת שומרת מידע שמסרתם (פרטי פרופיל, פרטי ילדים, היסטוריית שיחות) לצורך מתן שירות מותאם אישית.</li>
              <li>• המערכת מייצרת "זיכרונות" מהשיחות כדי לשפר את איכות התשובות העתידיות.</li>
              <li>• שיחות שלא נעשה בהן שימוש יימחקו אוטומטית לאחר 30 יום של חוסר פעילות.</li>
              <li>• ניתן למחוק שיחות ידנית בכל עת. מחיקה היא סופית ובלתי הפיכה.</li>
              <li>• לפרטים מלאים על איסוף ועיבוד מידע, ראו את <Link to="/privacy" className="text-primary hover:underline font-semibold">מדיניות הפרטיות</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">copyright</span>
              7. קניין רוחני
            </h2>
            <ul className="space-y-2">
              <li>• כל הזכויות באפליקציה, לרבות עיצוב, קוד, תוכן, סימני מסחר ולוגו, שייכות לחברה או לבעלי הרישיון שלה.</li>
              <li>• אין להעתיק, לשכפל, להפיץ או ליצור יצירות נגזרות מתכני האפליקציה ללא אישור בכתב.</li>
              <li>• התוכן שנוצר על ידי ה-AI בתגובה לשאלותיכם ניתן לכם לשימוש אישי בלבד.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">shield</span>
              8. הגבלת אחריות
            </h2>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <ul className="space-y-2 text-amber-900">
                <li>• השירות מסופק <strong>"כמות שהוא" (AS IS)</strong> ללא כל מצג או התחייבות, מפורשת או משתמעת.</li>
                <li>• החברה <strong>לא תישא בכל אחריות</strong> לנזק ישיר, עקיף, מקרי, תוצאתי או מיוחד הנובע מהשימוש באפליקציה או מהסתמכות על תכניה.</li>
                <li>• החברה <strong>לא אחראית</strong> להחלטות שתקבלו על בסיס מידע מהאפליקציה.</li>
                <li>• החברה <strong>לא מבטיחה</strong> זמינות רציפה וללא תקלות של השירות.</li>
                <li>• בכל מקרה, אחריות החברה לא תעלה על הסכום ששילמתם עבור השירות ב-12 החודשים האחרונים.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">child_care</span>
              9. קטינים ואחריות הורית
            </h2>
            <ul className="space-y-2">
              <li>• האפליקציה מיועדת לשימוש הורים ומטפלים בלגרים (מעל גיל 18) בלבד.</li>
              <li>• אין לאפשר לקטינים להשתמש באפליקציה ללא פיקוח.</li>
              <li>• המידע שתמסרו על ילדיכם הוא באחריותכם המלאה.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">cancel</span>
              10. סיום שימוש
            </h2>
            <ul className="space-y-2">
              <li>• תוכלו להפסיק להשתמש בשירות ולמחוק את חשבונכם בכל עת.</li>
              <li>• אנו רשאים לסגור חשבונות, להגביל גישה או להפסיק את השירות בכל עת, עם או בלי הודעה מראש.</li>
              <li>• עם סיום השימוש, נתוניכם יימחקו בהתאם למדיניות הפרטיות שלנו.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">handshake</span>
              11. שיפוי
            </h2>
            <p>
              המשתמש מתחייב לשפות ולפצות את החברה, מנהליה, עובדיה ושלוחיה בגין כל תביעה, דרישה, נזק, הפסד או הוצאה (כולל שכר טרחת עורכי דין) הנובעים משימושו באפליקציה או מהפרת תנאי שימוש אלה.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">balance</span>
              12. דין חל וסמכות שיפוט
            </h2>
            <ul className="space-y-2">
              <li>• על תנאים אלה יחולו דיני מדינת ישראל בלבד.</li>
              <li>• סמכות השיפוט הבלעדית תהיה לבתי המשפט המוסמכים במחוז תל אביב-יפו.</li>
              <li>• במקרה שסעיף כלשהו ייקבע כבלתי תקף, שאר הסעיפים יעמדו בתוקפם.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3 flex items-center gap-2">
              <span className="material-symbols-rounded text-primary text-xl">mail</span>
              13. יצירת קשר
            </h2>
            <p>
              לשאלות או בירורים בנוגע לתנאי שימוש אלה, ניתן לפנות אלינו בכתובת:
            </p>
            <p className="mt-2 font-semibold text-primary">support@psihologit.co.il</p>
          </section>

        </div>

        {/* Back to chat */}
        <div className="text-center mt-10">
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
