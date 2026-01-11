## Summary
Fixes the critical UX issue where Gold Standard users had to retake the 35-question personality assessment for every resume they generated.

## Issue
Session 35 - Priority 1: Redundant Personality Assessment (SESSION_34_HANDOFF.md)

**Problem:** 
- Users waste 20-30 minutes retaking assessment for each resume
- Time-to-resume: 25+ minutes instead of <5 minutes
- Assessment fatigue reduces data quality on retakes

**Root Cause:**
- Backend already supported profile completion check via `/api/gold-standard/start`
- Backend returns `status: 'already_complete'` if profile exists
- Frontend `GoldStandardWizard.js` didn't check this on mount

## Changes
**File Modified:** `src/components/GoldStandardWizard.js` (+65 lines, -14 lines)

### 1. Added Profile Completion Check
- New `checkingProfile` state variable to track loading state
- New `useEffect` hook (lines 245-281) that automatically:
  - Calls `/api/gold-standard/start` when wizard mounts
  - Checks if user has completed profile
  - If yes, calls `fetchResults()` to skip to results page
  - If no, shows "Start Assessment" button

### 2. Updated Start Screen UI
- Added loading spinner during profile check
- Shows "Checking your profile status..." message
- Graceful error handling - users can still manually click "Start Assessment" if check fails

## Testing
- [x] Frontend build passes (compiled with pre-existing warnings only)
- [x] Backend `/api/gold-standard/start` endpoint verified to return `already_complete` status
- [x] Manual testing required: Test with existing Gold user to verify auto-skip behavior

## Test Plan
1. **New User Flow (First Time):**
   - Login as user without personality profile
   - Navigate to Gold Standard wizard
   - Should see brief "Checking..." then "Start Assessment" button
   - Complete 35-question assessment normally

2. **Returning User Flow (Profile Exists):**
   - Login as user WITH completed personality profile
   - Navigate to Gold Standard wizard
   - Should see "Checking profile status..."
   - Should automatically redirect to results page (SKIP assessment)
   - Can proceed directly to resume generation

## Impact
- ✅ Time savings: 25+ minutes → <5 minutes for returning users
- ✅ Better UX: Assessment completed once only
- ✅ Prevents assessment fatigue
- ✅ Matches expected Gold Standard premium experience

## Screenshots
(If UI testing screenshots available, add here)

## Related
- Session 34: Critical bug fixes completed
- Session 35 Roadmap: Priority 1 (CRITICAL)
- Next: Priority 2 - Resume Context Integration

---

**Commit:** `feat(gold-standard): auto-skip completed personality assessment`
**Branch:** `feature/35-fix-redundant-assessment`
