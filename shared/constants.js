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
  { value: 'authoritative', label: 'סמכותי' },
  { value: 'permissive', label: 'מתירני' },
  { value: 'authoritarian', label: 'סמכותני/קפדני' },
  { value: 'uninvolved', label: 'לא מעורב' },
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

// Extract followup questions from AI response text
export function extractFollowups(text) {
  if (!text) return []
  const matches = [...text.matchAll(/\[\[followup:([^\]]+)\]\]/g)]
  return matches.map(m => m[1].trim())
}

// Extract add_child data from AI response text
export function extractAddChildData(text) {
  if (!text) return null
  const match = text.match(/\[\[add_child:([^:\]]+):([^:\]]+):([^\]]+)\]\]/)
  if (!match) return null
  return {
    name: match[1].trim(),
    age: match[2].trim(),
    personality: match[3].trim(),
  }
}

// Extract update_child data from AI response text
export function extractUpdateChildData(text) {
  if (!text) return null
  const match = text.match(/\[\[update_child:([^:\]]+):(\w+)=([^\]]+)\]\]/)
  if (!match) return null
  return {
    name: match[1].trim(),
    field: match[2].trim(),
    value: match[3].trim(),
  }
}

export function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Child selector buttons: [[child:name:personality:gender]]
    .replace(/\[\[child:([^:\]]+):?([^:\]]*):?([^\]]*)\]\]/g, (_, name, personality, gender) => {
      const p = (personality || 'calm').trim()
      const g = (gender || 'boy').trim()
      const personalityLabels = { sensitive: 'רגיש/ה', stubborn: 'עקשן/ית', anxious: 'חרדתי/ת', energetic: 'אנרגטי/ת', calm: 'רגוע/ה' }
      const pLabel = personalityLabels[p] || p
      return `<button class="child-select-btn child-${p}-${g}" data-child="${name}"><span class="child-btn-name">${name}</span><span class="child-btn-personality">${pLabel}</span></button>`
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-text-main">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s+(.+)$/gm, '<li class="flex items-start gap-2"><span class="text-primary mt-1.5 text-xs">●</span><span>$1</span></li>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li class="flex items-start gap-3"><span class="flex-shrink-0 size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">$1</span><span>$2</span></li>')
    .replace(/((?:<li.*?<\/li>\n?)+)/g, '<ul class="space-y-2 my-3 list-none p-0">$1</ul>')
    .replace(/\s*\[\[memory:[^\]]+\]\]/g, '')
    .replace(/\s*\[\[confidence:\d+\]\]/g, '')
    // Add/update child tags - cleaned from display, handled by React popup
    .replace(/\s*\[\[add_child:[^\]]+\]\]/g, '')
    .replace(/\s*\[\[update_child:[^\]]+\]\]/g, '')
    // Follow-up tags - cleaned from display, rendered as React component outside bubble
    .replace(/\s*\[\[followup:[^\]]+\]\]/g, '')
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, '<br>')
}
