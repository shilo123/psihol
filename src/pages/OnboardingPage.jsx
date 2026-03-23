import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../shared/authStore'
import { CHALLENGES, PERSONALITIES, PARENTING_STYLES } from '../../shared/constants'
import BirthDatePicker from '../components/BirthDatePicker'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const completeOnboarding = useAuthStore(s => s.completeOnboarding)
  const loading = useAuthStore(s => s.loading)
  const user = useAuthStore(s => s.user)

  const [step, setStep] = useState(1)
  const [parentName, setParentName] = useState(user?.parentName || user?.name || '')
  const [parentAge, setParentAge] = useState('')
  const [parentStyle, setParentStyle] = useState('')

  // Multi-child support
  const [children, setChildren] = useState([
    { name: '', birthDate: '', gender: 'boy', personality: '' }
  ])
  const [selectedChallenges, setSelectedChallenges] = useState([])
  const [errors, setErrors] = useState({})

  const progressPercent = Math.round((step / 3) * 100)

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
    setStep(s => s + 1)
  }

  function handleBack() {
    setErrors({})
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
      parentAge,
      parentStyle,
      children: children.filter(c => c.name.trim()),
      challenges: selectedChallenges,
    })
    navigate('/')
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background-light via-white to-primary-light/30 py-6 px-4 sm:py-10">
      <div className="max-w-xl mx-auto">

        {/* Progress Section */}
        <div className="mb-8 anim-fade-in-down">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-text-secondary">
              שלב {step} מתוך 3
            </span>
            <span className="text-sm font-bold text-primary">
              {progressPercent}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-l from-primary via-primary-dark to-purple-600 transition-all duration-700 ease-out relative"
              style={{
                width: `${progressPercent}%`,
                boxShadow: '0 0 16px rgba(var(--color-primary-rgb, 99 102 241) / 0.5)',
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            </div>
          </div>
        </div>

        {/* Step 1 - Parent Details */}
        {step === 1 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden relative anim-fade-in-up">
            {/* Decorative Blobs */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-primary/20 to-purple-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-tr from-pink-200/20 to-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-6 sm:p-8">
              {/* Avatar */}
              <div className="flex justify-center mb-6 anim-pop-in anim-delay-1">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || ''}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-full shadow-lg shadow-primary/30 object-cover border-4 border-white"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="material-symbols-rounded text-white text-4xl">person</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-black tracking-tight text-text-main text-center mb-2 anim-fade-in-up anim-delay-2">
                {user?.picture ? `שלום ${user.name?.split(' ')[0] || ''}! 👋` : 'ספר/י לנו על עצמך'}
              </h1>
              <p className="text-text-secondary text-center mb-8 text-sm anim-fade-in-up anim-delay-3">
                המידע עוזר לנו להתאים את הייעוץ אליך
              </p>

              {/* Fields */}
              <div className="space-y-5 anim-fade-in-up anim-delay-4">
                {/* Parent Name */}
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">שם ההורה</label>
                  <div className="relative">
                    <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">badge</span>
                    <input
                      type="text"
                      value={parentName}
                      onChange={e => { setParentName(e.target.value); setErrors(prev => ({ ...prev, parentName: false })) }}
                      placeholder="השם שלך"
                      className={`w-full h-14 pr-12 pl-4 rounded-2xl border-2 bg-white/70 text-text-main placeholder-gray-400 text-base font-medium outline-none transition-all duration-200 focus:ring-4 focus:ring-primary/10 focus:border-primary ${
                        errors.parentName ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.parentName && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                      <span className="material-symbols-rounded text-sm">error</span>
                      שדה חובה
                    </p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">גיל</label>
                  <div className="relative">
                    <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">cake</span>
                    <input
                      type="number"
                      value={parentAge}
                      onChange={e => setParentAge(e.target.value)}
                      placeholder="הגיל שלך"
                      min="16"
                      max="99"
                      className="w-full h-14 pr-12 pl-4 rounded-2xl border-2 border-gray-200 bg-white/70 text-text-main placeholder-gray-400 text-base font-medium outline-none transition-all duration-200 hover:border-gray-300 focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Parenting Style */}
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">סגנון הורות</label>
                  <div className="relative">
                    <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">psychology</span>
                    <select
                      value={parentStyle}
                      onChange={e => setParentStyle(e.target.value)}
                      className="w-full h-14 pr-12 pl-4 rounded-2xl border-2 border-gray-200 bg-white/70 text-text-main text-base font-medium outline-none transition-all duration-200 hover:border-gray-300 focus:ring-4 focus:ring-primary/10 focus:border-primary appearance-none cursor-pointer"
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

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-100 anim-fade-in anim-delay-5">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className="material-symbols-rounded text-green-500 text-base">lock</span>
                  מאובטח ופרטי
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className="material-symbols-rounded text-blue-500 text-base">verified_user</span>
                  מוגן ומאושר
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 - Children Details */}
        {step === 2 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden relative anim-fade-in-up">
            {/* Decorative Blobs */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-bl from-pink-200/20 to-primary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-gradient-to-tr from-primary/15 to-yellow-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-6 sm:p-8">
              {/* Avatar */}
              <div className="flex justify-center mb-6 anim-pop-in anim-delay-1">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-primary flex items-center justify-center shadow-lg shadow-pink-400/30">
                  <span className="material-symbols-rounded text-white text-4xl">child_care</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-black tracking-tight text-text-main text-center mb-2 anim-fade-in-up anim-delay-2">
                ספר/י לנו על הילדים
              </h1>
              <p className="text-text-secondary text-center mb-8 text-sm anim-fade-in-up anim-delay-3">
                כדי שנוכל להתאים את התוכן באופן אישי
              </p>

              {/* Children list */}
              <div className="space-y-6 anim-fade-in-up anim-delay-4">
                {children.map((child, idx) => (
                  <div key={idx} className={`space-y-4 ${idx > 0 ? 'pt-5 border-t-2 border-dashed border-primary/20' : ''}`}>
                    {/* Child header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`size-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          child.gender === 'girl' ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="text-sm font-bold text-text-main">
                          {child.name || `ילד/ה ${idx + 1}`}
                        </span>
                      </div>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(idx)}
                          className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <span className="material-symbols-rounded text-lg">close</span>
                        </button>
                      )}
                    </div>

                    {/* Child Name */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">שם הילד/ה</label>
                      <div className="relative">
                        <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">badge</span>
                        <input
                          type="text"
                          value={child.name}
                          onChange={e => updateChild(idx, 'name', e.target.value)}
                          placeholder="שם הילד/ה"
                          className={`w-full h-14 pr-12 pl-4 rounded-2xl border-2 bg-white/70 text-text-main placeholder-gray-400 text-base font-medium outline-none transition-all duration-200 focus:ring-4 focus:ring-primary/10 focus:border-primary ${
                            errors[`childName_${idx}`] ? 'border-red-400 ring-4 ring-red-100' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        />
                      </div>
                      {errors[`childName_${idx}`] && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                          <span className="material-symbols-rounded text-sm">error</span>
                          שדה חובה
                        </p>
                      )}
                    </div>

                    {/* Birth Date + Gender */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-text-main mb-2">תאריך לידה</label>
                        <BirthDatePicker
                          value={child.birthDate}
                          onChange={(date) => updateChild(idx, 'birthDate', date)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-text-main mb-2">מין</label>
                        <div className="flex h-14 rounded-2xl border-2 border-gray-200 overflow-hidden bg-white/70">
                          <label className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-200 text-sm font-bold ${
                            child.gender === 'boy' ? 'bg-primary text-white shadow-inner' : 'text-text-secondary hover:bg-gray-50'
                          }`}>
                            <input
                              type="radio"
                              name={`gender_${idx}`}
                              value="boy"
                              checked={child.gender === 'boy'}
                              onChange={() => updateChild(idx, 'gender', 'boy')}
                              className="sr-only"
                            />
                            <span className="material-symbols-rounded text-lg me-1">boy</span>
                            בן
                          </label>
                          <label className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-200 text-sm font-bold border-r ${
                            child.gender === 'girl' ? 'bg-primary text-white shadow-inner' : 'text-text-secondary hover:bg-gray-50 border-gray-200'
                          }`}>
                            <input
                              type="radio"
                              name={`gender_${idx}`}
                              value="girl"
                              checked={child.gender === 'girl'}
                              onChange={() => updateChild(idx, 'gender', 'girl')}
                              className="sr-only"
                            />
                            <span className="material-symbols-rounded text-lg me-1">girl</span>
                            בת
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Personality */}
                    <div>
                      <label className="block text-sm font-bold text-text-main mb-2">מאפיין אישיות</label>
                      <div className="relative">
                        <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">emoji_objects</span>
                        <select
                          value={child.personality}
                          onChange={e => updateChild(idx, 'personality', e.target.value)}
                          className="w-full h-14 pr-12 pl-4 rounded-2xl border-2 border-gray-200 bg-white/70 text-text-main text-base font-medium outline-none transition-all duration-200 hover:border-gray-300 focus:ring-4 focus:ring-primary/10 focus:border-primary appearance-none cursor-pointer"
                        >
                          <option value="">בחר/י מאפיין</option>
                          {PERSONALITIES.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">expand_more</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add child button */}
                <button
                  type="button"
                  onClick={addChild}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                >
                  <span className="material-symbols-rounded text-xl">add_circle</span>
                  הוספת ילד/ה נוסף/ת
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-100 anim-fade-in anim-delay-5">
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className="material-symbols-rounded text-green-500 text-base">lock</span>
                  מאובטח ופרטי
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className="material-symbols-rounded text-blue-500 text-base">verified_user</span>
                  מוגן ומאושר
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 - Challenges */}
        {step === 3 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden relative anim-fade-in-up">
            {/* Decorative Blobs */}
            <div className="absolute -top-16 -left-16 w-52 h-52 bg-gradient-to-br from-yellow-200/20 to-primary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-tl from-primary/15 to-pink-200/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-6 sm:p-8">
              {/* Avatar */}
              <div className="flex justify-center mb-6 anim-pop-in anim-delay-1">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-primary flex items-center justify-center shadow-lg shadow-amber-400/30">
                  <span className="material-symbols-rounded text-white text-4xl">target</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-black tracking-tight text-text-main text-center mb-2 anim-fade-in-up anim-delay-2">
                מה האתגר המרכזי?
              </h1>
              <p className="text-text-secondary text-center mb-8 text-sm anim-fade-in-up anim-delay-3">
                בחר/י את האתגרים שהכי רלוונטיים עבורך
              </p>

              {/* Challenges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CHALLENGES.map((challenge, idx) => {
                  const isSelected = selectedChallenges.includes(challenge.value)
                  return (
                    <label key={challenge.value} className="cursor-pointer group anim-float-in" style={{ animationDelay: `${idx * 0.06}s` }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleChallenge(challenge.value)}
                        className="challenge-checkbox sr-only"
                      />
                      <div className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                          : 'border-transparent bg-white/60 hover:shadow-md hover:border-primary/30'
                      }`}>
                        {/* Icon Container */}
                        <div className={`icon-container w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                            : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          <span className="material-symbols-rounded text-2xl">{challenge.icon}</span>
                        </div>

                        {/* Label */}
                        <span className={`text-sm font-bold block transition-colors duration-200 ${
                          isSelected ? 'text-primary' : 'text-text-main'
                        }`}>
                          {challenge.label}
                        </span>

                        {/* Check Icon Overlay */}
                        {isSelected && (
                          <div className="check-icon absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
                            <span className="material-symbols-rounded text-white text-sm">check</span>
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 mt-6 anim-fade-in-up anim-delay-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="h-14 px-6 rounded-xl font-bold text-text-secondary hover:text-text-main hover:bg-white/60 transition-all duration-200 flex items-center gap-2"
            >
              <span className="material-symbols-rounded text-xl">arrow_forward</span>
              חזור
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-14 bg-primary rounded-xl font-bold text-lg text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              המשך
              <span className="material-symbols-rounded text-xl">arrow_back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 h-14 bg-gradient-to-l from-primary to-purple-600 rounded-xl font-bold text-lg text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-rounded animate-spin text-xl">progress_activity</span>
                  שומר...
                </>
              ) : (
                <>
                  סיום והתחלה
                  <span className="material-symbols-rounded text-xl">rocket_launch</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Shimmer Animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}
