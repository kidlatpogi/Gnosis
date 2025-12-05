ISSUES TO CREATE
================

1) Randomize not working

Description:
The card orientation randomization did not appear to be applied per-card because the `StudyCard` component was re-used without reinitializing the random orientation. Although a fix was applied (useEffect that re-randomizes on `card.id` change), confirm on QA that orientation is different each card. If any components reuse prevents re-render, consider keying `StudyCard` by `card.id` in `Study.jsx` or moving orientation calculation to parent when building `dueCards`.

Steps to reproduce:
- Start a study session with multiple cards.
- Observe whether multiple cards start with mixed front/back or all the same.

Expected behavior:
- Each card should randomly start question-first or answer-first.

Notes:
- Implemented useEffect in `src/components/StudyCard.jsx` to reset orientation when `card.id` changes. Verify in QA.

---

2) Typed -> Multiple choice mode persistence bug

Description:
When answering a card using `Type Answer` mode, the next card may switch to `Multiple Choice` (or vice versa) unexpectedly. The expected behavior is that if a user selects a study mode (e.g., Multiple Choice), the following cards in the same session should remain in that study mode until the user changes it. Current behavior resets to flashcard mode in some flows.

Steps to reproduce:
- Start a study session
- Switch to `Type Answer` mode and answer a card
- Observe the mode of the next card; sometimes it resets to `flashcard` instead of staying in `type-answer` or `multiple-choice`

Expected behavior:
- The chosen study mode should persist across cards within the session until changed by the user.

Possible causes:
- `StudyCard` local state is reset on card change (we reset a number of local states when `card.id` changes). Ensure `studyMode` is preserved across cards by lifting mode state to the parent `Study.jsx` and passing it down, or avoid resetting `studyMode` in the `useEffect` that resets per-card state.

Notes:
- Quick fix: Move `studyMode` state to `Study.jsx` and pass `studyMode` + `setStudyMode` to `StudyCard` so it persists across cards.

---

(If you want, I can open GitHub issues for you automatically — I need a repository token/permissions — otherwise these items are saved here and will be committed to the branch.)
