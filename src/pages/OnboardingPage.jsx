import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../shared/authStore'
import { CHALLENGES, PERSONALITIES, PARENTING_STYLES } from '../../shared/constants'
import BirthDatePicker from '../components/BirthDatePicker'

const STEP_META = [
  { icon: 'waving_hand', gradient: 'from-primary to-purple-600', shadowColor: 'shadow-primary/30' },
  { icon: 'child_care', gradient: 'from-pink-500 to-rose-600', shadowColor: 'shadow-pink-400/30' },
  { icon: 'target', gradient: 'from-amber-500 to-orange-600', shadowColor: 'shadow-amber-400/30' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const completeOnboarding = useAuthStore(s => s.completeOnboarding)
  const loading = useAuthStore(s => s.loading)
  const user = useAuthStore(s => s.user)

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState('forward') // for animation direction
  const [parentName, setParentName] = useState(user?.parentName || user?.name || '')
  const [parentGender, setParentGender] = useState('')
  const [parentAge, setParentAge] = useState('')
  const [parentStyle, setParentStyle] = useState('')

  const [children, setChildren] = useState([
    { name: '', birthDate: '', gender: 'boy', personality: '' }
  ])
  const [selectedChallenges, setSelectedChallenges] = useState([])
  const [errors, setErrors] = useState({})
  const [showCelebration, setShowCelebration] = useState(false)

  const progressPercent = Math.round((step / 3) * 100)
  const meta = STEP_META[step - 1]

  function updateChild(index, field, value) {
    setChildren(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
    if (field === 'name') setErrors(prev => ({ ...prev, [`childName_${index}`]: false }))
  }

  function addChild() {
    setChildren(prev => [...prev, { name: '', birthDate: '', gender: 'boy', personality: '' }])
  }

  function removeChild(index) {
    if (children.length <= 1) return
    setChildren(prev => prev.filter((_, i) => i !== index))
  }

  function validateStep1() {
    const newErrors = {}
    if (!parentName.trim()) newErrors.parentName = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateStep2() {
    const newErrors = {}
    children.forEach((child, i) => {
      if (!child.name.trim()) newErrors[`childName_${i}`] = true
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setErrors({})
    setDirection('forward')
    setStep(s => s + 1)
  }

  function handleBack() {
    setErrors({})
    setDirection('back')
    setStep(s => s - 1)
  }

  function toggleChallenge(value) {
    setSelectedChallenges(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    )
  }

  async function handleSubmit() {
    await completeOnboarding({
      parentName,
      parentGender,
      parentAge,
      parentStyle,
      children: children.filter(c => c.name.trim()),
      challenges: selectedChallenges,
    })
    setShowCelebration(true)
    setTimeout(() => navigate('/'), 2500)
  }

  /* ---- Celebration screen ---- */
  if (showCelebration) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background-light via-white to-primary-light/30 flex items-center justify-center">
        <div className="text-center anim-scale-in">
          {/* Confetti emojis */}
          <div className="text-6xl mb-4 anim-pop-in">🎉</div>
          <h1 className="text-3xl font-black text-text-main mb-2 anim-fade-in-up anim-delay-1">
            מעולה, {parentName}!
          </h1>
          <p className="text-text-muted text-base mb-6 anim-fade-in-up anim-delay-2">
            הכל מוכן. הפסיכולוגית שלך מחכה לך
          </p>
          <div className="flex items-center justify-center gap-3 anim-fade-in-up anim-delay-3">
            <div className="size-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="size-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="size-3 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Floating celebration particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${8 + Math.random() * 12}px`,
                height: `${8 + Math.random() * 12}px`,
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                background: ['#7a5afc', '#ec4899', '#f59e0b', '#34d399', '#3b82f6'][i % 5],
                opacity: 0.6,
                animation: `confettiFall ${2 + Math.random() * 3}s ease-in forwards`,
                animationDelay: `${Math.random() * 1.5}s`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background-light via-white to-primary-light/30 flex flex-col">
      {/* Top bar with step indicator */}
      <div className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/50">
        <div className="max-w-xl mx-auto px-5 py-4">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-3">
                <div className={`relative flex items-center justify-center transition-all duration-500 ${
                  s === step
                    ? 'w-10 h-10 rounded-2xl bg-gradient-to-br ' + meta.gradient + ' shadow-lg ' + meta.shadowColor
                    : s < step
                      ? 'w-8 h-8 rounded-xl bg-primary/15'
                      : 'w-8 h-8 rounded-xl bg-gray-100'
                }`}>
                  {s < step ? (
                    <span className="material-symbols-rounded text-primary text-lg font-bold">check</span>
                  ) : (
                    <span className={`text-sm font-black ${s === step ? 'text-white' : 'text-gray-400'}`}>{s}</span>
                  )}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 rounded-full transition-all duration-500 ${
                    s < step ? 'bg-primary/30' : 'bg-gray-100'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-primary via-primary-dark to-purple-600 transition-all duration-700 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 rounded-full" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-xl">

          {/* ── Step 1: Parent Details ── */}
          {step === 1 && (
            <div key="step1" className="anim-fade-in-up">
              {/* Header card */}
              <div className="text-center mb-6">
                <div className="anim-pop-in anim-delay-1">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || ''}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 rounded-3xl shadow-xl shadow-primary/20 object-cover border-4 border-white mx-auto mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/20 mx-auto mb-4">
                      <span className="material-symbols-rounded text-white text-5xl">person</span>
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-black tracking-tight text-text-main mb-1 anim-fade-in-up anim-delay-2">
                  {user?.picture ? `היי ${user.name?.split(' ')[0] || ''} 👋` : 'ספר/י לנו על עצמך'}
                </h1>
                <p className="text-text-muted text-sm anim-fade-in-up anim-delay-3">
                  נתאים את הייעוץ בדיוק אליך
                </p>
              </div>

              {/* Form card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden relative anim-fade-in-up anim-delay-3">
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-primary/10 to-purple-300/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-tr from-pink-200/10 to-primary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative p-6 sm:p-8 space-y-5">
                  {/* Parent Name */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-2">
                      <span className="material-symbols-rounded text-primary text-base align-middle me-1">badge</span>
                      שם ההורה
                    </label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={e => { setParentName(e.target.value); setErrors(prev => ({ ...prev, parentName: false })) }}
                      placeholder="השם שלך"
                      className={`w-full h-14 px-5 rounded-2xl border-2 bg-white/70 text-text-main placeholder-gray-400 text-base font-medium outline-none transition-all duration-200 focus:ring-4 focus:ring-primary/10 focus:border-primary ${
                        errors.parentName ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                    {errors.parentName && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                        <span className="material-symbols-rounded text-sm">error</span>
                        שדה חובה
                      </p>
                    )}
                  </div>

                  {/* Parent Gender */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-2">
                      <span className="material-symbols-rounded text-primary text-base align-middle me-1">wc</span>
                      אני...
                    </label>
                    <div className="flex gap-3">
                      {[{ value: 'mom', label: 'אמא' }, { value: 'dad', label: 'אבא' }].map(g => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setParentGender(g.value)}
                          className={`flex-1 h-14 rounded-2xl border-2 text-base font-semibold transition-all duration-200 ${
                            parentGender === g.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 bg-white/70 text-text-main hover:border-gray-300'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-2">
                      <span className="material-symbols-rounded text-primary text-base align-middle me-1">cake</span>
                      גיל <span className="text-gray-400 font-normal">(אופציונלי)</span>
                    </label>
                    <input
                      type="number"
                      value={parentAge}
                      onChange={e => setParentAge(e.target.value)}
                      placeholder="הגיל שלך"
                      min="16"
                      max="99"
                      className="w-full h-14 px-5 rounded-2xl border-2 border-gray-200 bg-white/70 text-text-main placeholder-gray-400 text-base font-medium outline-none transition-all duration-200 hover:border-gray-300 focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    />
                  </div>

                  {/* Parenting Style */}
                  <div>
                    <label className="block text-sm font-bold text-text-main mb-2">
                      <span className="material-symbols-rounded text-primary text-base align-middle me-1">psychology</span>
                      סגנון הורות <span className="text-gray-400 font-normal">(אופציונלי)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={parentStyle}
                        onChange={e => setParentStyle(e.target.value)}
                        className="w-full h-14 px-5 rounded-2xl border-2 border-gray-200 bg-white/70 text-text-main text-base font-medium outline-none transition-all duration-200 hover:border-gray-300 focus:ring-4 focus:ring-primary/10 focus:border-primary appearance-none cursor-pointer"
                      >
                        <option value="">בחר/י סגנון</option>
                        {PARENTING_STYLES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust footer */}
              <div className="flex items-center justify-center gap-6 mt-5 anim-fade-in anim-delay-5">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="material-symbols-rounded text-green-500 text-base">lock</span>
                  מאובטח ופרטי
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="material-symbols-rounded text-blue-500 text-base">verified_user</span>
                  המידע לא משותף
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Children Details ── */}
          {step === 2 && (
            <div key="step2" className="anim-fade-in-up">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-xl shadow-pink-400/20 mx-auto mb-4 anim-pop-in anim-delay-1">
                  <span className="material-symbols-rounded text-white text-4xl">child_care</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-text-main mb-1 anim-fade-in-up anim-delay-2">
                  ספר/י לנו על הילדים
                </h1>
                <p className="text-text-muted text-sm anim-fade-in-up anim-delay-3">
                  נתאים את התוכן באופן אישי לכל ילד/ה
                </p>
              </div>

              {/* Children cards */}
              <div className="space-y-4 anim-fade-in-up anim-delay-3">
                {children.map((child, idx) => (
                  <div
                    key={idx}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden relative"
                  >
                    <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-bl from-pink-200/15 to-transparent rounded-full blur-3xl pointer-events-none" />

                    <div className="relative p-6 sm:p-7">
                      {/* Child header */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-md ${
                            child.gender === 'girl'
                              ? 'bg-gradient-to-br from-pink-400 to-rose-500 shadow-pink-300/30'
                              : 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-300/30'
                          }`}>
                            <span className="material-symbols-rounded text-xl">
                              {child.gender === 'girl' ? 'girl' : 'boy'}
                            </span>
                          </div>
                          <span className="text-base font-bold text-text-main">
                            {child.name || `ילד/ה ${idx + 1}`}
                          </span>
                        </div>
                        {children.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChild(idx)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <span className="material-symbols-rounded text-lg">delete_outline</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Child Name */}
                        <div>
                          <label className="block text-sm font-bold text-text-main mb-2">שם הילד/ה</label>
                          <input
                            type="text"
                            value={child.name}
                            onChange={e => updateChild(idx, 'name', e.target.value)}
                            placeholder="שם הילד/ה"
                            className={`w-full h-14 px-5 rounded-2xl border-2 bg-white/70 text-text-main placeholder-gray-400 text-base font-medium outline-none transition-all duration-200 focus:ring-4 focus:ring-primary/10 focus:border-primary ${
                              errors[`childName_${idx}`] ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          />
                          {errors[`childName_${idx}`] && (
                            <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                              <span className="material-symbols-rounded text-sm">error</span>
                              שדה חובה
                            </p>
                          )}
                        </div>

                        {/* Gender toggle */}
                        <div>
                          <label className="block text-sm font-bold text-text-main mb-2">מין</label>
                          <div className="flex h-14 rounded-2xl border-2 border-gray-200 overflow-hidden bg-white/70">
                            <label className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 text-sm font-bold gap-1.5 ${
                              child.gender === 'boy'
                                ? 'bg-gradient-to-l from-blue-500 to-indigo-500 text-white shadow-inner'
                                : 'text-text-muted hover:bg-gray-50'
                            }`}>
                              <input type="radio" name={`gender_${idx}`} value="boy" checked={child.gender === 'boy'} onChange={() => updateChild(idx, 'gender', 'boy')} className="sr-only" />
                              <span className="material-symbols-rounded text-lg">boy</span>
                              בן
                            </label>
                            <label className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 text-sm font-bold border-r gap-1.5 ${
                              child.gender === 'girl'
                                ? 'bg-gradient-to-l from-pink-500 to-rose-500 text-white shadow-inner'
                                : 'text-text-muted hover:bg-gray-50 border-gray-200'
                            }`}>
                              <input type="radio" name={`gender_${idx}`} value="girl" checked={child.gender === 'girl'} onChange={() => updateChild(idx, 'gender', 'girl')} className="sr-only" />
                              <span className="material-symbols-rounded text-lg">girl</span>
                              בת
                            </label>
                          </div>
                        </div>

                        {/* Birth Date */}
                        <div>
                          <label className="block text-sm font-bold text-text-main mb-2">תאריך לידה</label>
                          <BirthDatePicker
                            value={child.birthDate}
                            onChange={(date) => updateChild(idx, 'birthDate', date)}
                          />
                        </div>

                        {/* Personality */}
                        <div>
                          <label className="block text-sm font-bold text-text-main mb-2">מאפיין אישיות</label>
                          <div className="flex flex-wrap gap-2">
                            {PERSONALITIES.map(p => (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => updateChild(idx, 'personality', child.personality === p.value ? '' : p.value)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                  child.personality === p.value
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'bg-gray-100 text-text-muted hover:bg-primary/10 hover:text-primary'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add child button */}
                <button
                  type="button"
                  onClick={addChild}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 active:scale-[0.98] transition-all duration-200"
                >
                  <span className="material-symbols-rounded text-xl">add_circle</span>
                  הוספת ילד/ה נוסף/ת
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Challenges ── */}
          {step === 3 && (
            <div key="step3" className="anim-fade-in-up">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-400/20 mx-auto mb-4 anim-pop-in anim-delay-1">
                  <span className="material-symbols-rounded text-white text-4xl">target</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-text-main mb-1 anim-fade-in-up anim-delay-2">
                  מה האתגר המרכזי?
                </h1>
                <p className="text-text-muted text-sm anim-fade-in-up anim-delay-3">
                  בחר/י אתגרים שרלוונטיים עבורך
                  {selectedChallenges.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-primary text-white text-xs font-bold ms-2 px-1.5">
                      {selectedChallenges.length}
                    </span>
                  )}
                </p>
              </div>

              {/* Challenges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 anim-fade-in-up anim-delay-3">
                {CHALLENGES.map((challenge, idx) => {
                  const isSelected = selectedChallenges.includes(challenge.value)
                  return (
                    <button
                      key={challenge.value}
                      type="button"
                      onClick={() => toggleChallenge(challenge.value)}
                      className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-center group anim-float-in active:scale-95 ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/15'
                          : 'border-gray-100 bg-white/80 hover:shadow-md hover:border-primary/20'
                      }`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}>
                        <span className="material-symbols-rounded text-2xl">{challenge.icon}</span>
                      </div>
                      <span className={`text-sm font-bold block transition-colors duration-200 ${
                        isSelected ? 'text-primary' : 'text-text-main'
                      }`}>
                        {challenge.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm anim-pop-in">
                          <span className="material-symbols-rounded text-white text-sm">check</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Optional skip text */}
              {selectedChallenges.length === 0 && (
                <p className="text-center text-xs text-text-muted mt-4 anim-fade-in anim-delay-5">
                  אפשר גם לדלג ולחזור לזה מאוחר יותר
                </p>
              )}
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="flex items-center gap-3 mt-6 anim-fade-in-up anim-delay-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="h-14 px-5 rounded-2xl font-bold text-text-muted hover:text-text-main hover:bg-white/80 transition-all duration-200 flex items-center gap-1.5 active:scale-95"
              >
                <span className="material-symbols-rounded text-xl">arrow_forward</span>
                חזור
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 h-14 bg-gradient-to-l from-primary to-purple-600 rounded-2xl font-bold text-lg text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2"
              >
                המשך
                <span className="material-symbols-rounded text-xl">arrow_back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-14 bg-gradient-to-l from-primary to-purple-600 rounded-2xl font-bold text-lg text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-rounded animate-spin text-xl">progress_activity</span>
                    שומר...
                  </>
                ) : (
                  <>
                    בואו נתחיל
                    <span className="material-symbols-rounded text-xl">rocket_launch</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Bottom spacing */}
          <div className="h-8" />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}
