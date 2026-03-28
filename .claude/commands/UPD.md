Stage all changes, commit with an auto-generated message summarizing the changes, and push to the remote repository.

Steps:
1. Run `git status` to see what changed
2. Run `git diff --staged` and `git diff` to understand the changes
3. Run `git log --oneline -5` to match the commit message style
4. Stage all relevant files with `git add` (specific files, not -A)
5. Create a concise Hebrew commit message that describes what changed
6. Commit with the message (include Co-Authored-By line)
7. Push to the remote with `git push`
8. Report the result to the user
