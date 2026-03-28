---
name: UPD
description: עדכון הריפו - git add, commit, push. מבצע stage, commit עם הודעה אוטומטית בעברית, ו-push ל-remote.
---

בצע עדכון מלא של הריפו:

1. הרץ `git status` לראות מה השתנה
2. הרץ `git diff --stat` להבין את היקף השינויים
3. הרץ `git log --oneline -3` להתאים לסגנון הקומיטים
4. עשה `git add` לכל הקבצים הרלוונטיים (ספציפית, לא -A)
5. צור הודעת commit תמציתית בעברית שמתארת מה השתנה
6. בצע commit עם ההודעה (כולל שורת Co-Authored-By)
7. בצע `git push` ל-remote
8. דווח למשתמש על התוצאה
