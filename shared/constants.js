// Shared constants - used by both React Web and React Native

export const CHALLENGES = [
  { value: 'tantrums', label: 'התפרצויות זעם', icon: 'thunderstorm' },
  { value: 'defiance', label: 'סירוב לשמוע', icon: 'hearing_disabled' },
  { value: 'sleep', label: 'קושי בשינה', icon: 'bedtime' },
  { value: 'siblings', label: 'ריבים בין אחים', icon: 'group' },
  { value: 'separation', label: 'חרדת נטישה', icon: 'sentiment_dissatisfied' },
  { value: 'eating', label: 'בעיות אכילה', icon: 'restaurant' },
  { value: 'screens', label: 'התמכרות למסכים', icon: 'devices' },
  { value: 'social', label: 'קשיים חברתיים', icon: 'diversity_3' },
]

export const PERSONALITIES = [
  { value: 'sensitive', label: 'רגיש/ה' },
  { value: 'stubborn', label: 'עקשן/ית' },
  { value: 'anxious', label: 'חרדתי/ת' },
  { value: 'energetic', label: 'אנרגטי/ת' },
  { value: 'calm', label: 'רגוע/ה' },
]

export const PARENTING_STYLES = [
  { value: 'authoritative', label: 'סמכותי (Authoritative)' },
  { value: 'permissive', label: 'מתירני (Permissive)' },
  { value: 'authoritarian', label: 'סמכותני/קפדני (Authoritarian)' },
  { value: 'uninvolved', label: 'לא מעורב (Uninvolved)' },
  { value: 'unsure', label: 'לא בטוח/ה' },
]

export function formatTime(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

export function calculateAge(birthDate) {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) { years--; months += 12 }
  if (years < 1) return `${months} חודשים`
  if (years === 1 && months === 0) return 'שנה'
  if (years === 1) return `שנה ו-${months} חודשים`
  if (months === 0) return `${years} שנים`
  return `${years} שנים ו-${months} חודשים`
}

export function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Child selector buttons
    .replace(/\[\[child:(.*?)\]\]/g, '<button class="child-select-btn" data-child="$1">$1</button>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-text-main">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s+(.+)$/gm, '<li class="flex items-start gap-2"><span class="text-primary mt-1.5 text-xs">●</span><span>$1</span></li>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li class="flex items-start gap-3"><span class="flex-shrink-0 size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">$1</span><span>$2</span></li>')
    .replace(/((?:<li.*?<\/li>\n?)+)/g, '<ul class="space-y-2 my-3 list-none p-0">$1</ul>')
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, '<br>')
}
