# Pending Issues for Session 35

Below are the issues identified from the current project state, specifically related to the Session 35 handoff and recent bug fixes.

## 1. [Bug] Fix Firebase Initialization for Application Default Credentials
**Priority:** High
**Status:** ✅ Fixed Locally (needs commit)
**Description:**
The backend failed to start in the local development environment because `api/config/firebase.js` strictly expected a Service Account key structure (with `project_id`). When using Application Default Credentials (ADC) via `gcloud auth application-default login`, the JSON structure differs.
**Action:** Update `initializeFromLocalFile` to handle both Service Account keys and ADC.

## 2. [Task] Review and Merge PR #23: Auto-Skip Personality Assessment
**Priority:** High
**Context:** Session 35 Handoff
**Description:**
Review the changes in `feature/35-fix-redundant-assessment`.
- **Goal:** Prevent users from having to retake the 35-question assessment if they have already completed it.
- **Verification:** Ensure `GoldStandardWizard` checks profile status on mount.

## 3. [Task] Review and Merge PR #24: Resume Context Integration
**Priority:** High
**Context:** Session 35 Handoff
**Description:**
Review the changes in `feature/35-resume-context-integration`.
- **Goal:** Use data from the user's previous resumes (uploaded or generated) to improve the context for new resume generation.
- **Verification:** Check `resumeContextAggregator.js` logic and integration in `resume.js`.

## 4. [Task] Deploy Session 35 Features to Production
**Priority:** High (after PRs are merged)
**Context:** Session 35 Handoff
**Description:**
Once PRs #23 and #24 are merged to `dev` and verified:
1. Deploy API: `gcloud run deploy cvstomize-api ...`
2. Deploy Frontend: `gcloud run deploy cvstomize-frontend ...`
3. Verify production health.

## 5. [Feature] Implement Profile Management UI
**Priority:** Medium (Optional/Enhancement)
**Context:** Roadmap (Session 35)
**Description:**
Create a user interface to view personality insights.
- **Features:**
  - View OCEAN scores.
  - View assessment completion date.
  - "Retake Assessment" button.
- **Files:** `src/components/UserProfilePage.js`
