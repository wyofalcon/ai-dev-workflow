# 🚀 CVstomize MVP Master Launch List

> **Last Updated:** 2026-01-12  
> **Branch:** TimeMachine1  
> **Strategic Focus:** Data collection platform — user profiles & analytics are primary value

---

## 🏷️ Tags

| Tag | Meaning |
|-----|---------|
| `MVP` | **Must complete before launch** |
| `NON-MVP` | Deferred — do not work on until MVP ships |
| `DONE` | Completed |
| `BLOCKED` | Waiting on another issue |
| `INFRA` | Infrastructure / Build / Config |
| `DATA` | Database / Schema / Persistence |
| `UX` | User Experience / Flow |
| `SECURITY` | Security / Auth / Secrets |
| `VERIFY` | Needs manual testing to confirm |

---

## ✅ DONE

| ID | Task | Tags | GitHub Issue |
|----|------|------|--------------|
| D1 | Legacy Baseline Restored | `DONE` `INFRA` | — |
| D2 | Vertex AI Backend | `DONE` `INFRA` | — |
| D3 | Quick Tailor Extension UI | `DONE` `UX` | #22 (partial) |
| D4 | Mock Mode Infrastructure | `DONE` `INFRA` | — |
| D5 | WebLLM Bridge | `DONE` `INFRA` | #49 (partial) |
| D6 | API Key Redaction | `DONE` `SECURITY` | — |

---

## 🔴 MVP — Launch Blockers (In Order)

### 1️⃣ Build & Deploy (Fix First — Can't Launch If It Doesn't Build)

| ID | Task | Tags | Status | GitHub Issue |
|----|------|------|--------|--------------|
| M1 | **Fix Production Build** | `MVP` `INFRA` | ✅ Done | — (Fixed with FAST_REFRESH=false) |
| M2 | **Fix Test Configuration** | `MVP` `INFRA` | 🔴 Open | — (SESSION.md blocker) |

### 2️⃣ Dependencies (Required: No Deprecated Code)

| ID | Task | Tags | Status | GitHub Issue |
|----|------|------|--------|--------------|
| M3 | **Fix Deprecated Dependencies** | `MVP` `INFRA` `SECURITY` | 🔴 Open | [#50](https://github.com/wyofalcon/cvstomize/issues/50) |

### 3️⃣ Security (Required Before Any Public Access)

| ID | Task | Tags | Status | GitHub Issue |
|----|------|------|--------|--------------|
| M4 | **Security Audit** | `MVP` `SECURITY` | 🔴 Open | [#16](https://github.com/wyofalcon/cvstomize/issues/16) |

### 4️⃣ Core Data (Users Can't Use App If Data Doesn't Save)

| ID | Task | Tags | Status | GitHub Issue |
|----|------|------|--------|--------------|
| M5 | **Fix Profile Data Persistence** | `MVP` `DATA` | 🔴 Open | [#10](https://github.com/wyofalcon/cvstomize/issues/10), [#29](https://github.com/wyofalcon/cvstomize/issues/29) |
| M6 | **Replace In-Memory Sessions with DB** | `MVP` `DATA` `INFRA` | 🔴 Open | [#17](https://github.com/wyofalcon/cvstomize/issues/17) |

### 5️⃣ User Flow (Users Must Complete Onboarding)

| ID | Task | Tags | Status | GitHub Issue |
|----|------|------|--------|--------------|
| M7 | **Fix Onboarding Navigation** | `MVP` `UX` | 🔴 Open | — (from transcripts) |

### 6️⃣ Legal (Required for Launch)

| ID | Task | Tags | Status | GitHub Issue |
|----|------|------|--------|--------------|
| M8 | **Terms of Service & Privacy Policy** | `MVP` `SECURITY` | 🔴 Open | [#13](https://github.com/wyofalcon/cvstomize/issues/13) |

### 7️⃣ Pre-Launch Checklist

| ID | Task | Tags | Status | GitHub Issue |
|----|------|------|--------|--------------|
| M9 | **Complete Pre-Launch Checklist** | `MVP` | 🔴 Open | [#34](https://github.com/wyofalcon/cvstomize/issues/34) |

### 8️⃣ Verify Core Journeys (End-to-End Smoke Tests)

| ID | Task | Tags | Status | GitHub Issue |
|----|------|------|--------|--------------|
| M10 | **Verify: Login Flow** | `MVP` `VERIFY` | 🔄 Pending | — |
| M11 | **Verify: Resume Builder** | `MVP` `VERIFY` `BLOCKED:M5` | 🔄 Pending | — |
| M12 | **Verify: Quick Tailor** | `MVP` `VERIFY` `BLOCKED:M11` | 🔄 Pending | [#11](https://github.com/wyofalcon/cvstomize/issues/11) |

---

## 🟡 NICE-TO-HAVE — Pre-Launch Polish (Not Blocking)

| ID | Task | Tags | Status | GitHub Issue |
|----|------|------|--------|--------------|
| N1 | Personal Data Prompt Timing | `UX` | 🟡 Decision | — |
| N2 | Clear Instructions on Input Fields | `UX` | 🟡 Low | [#21](https://github.com/wyofalcon/cvstomize/issues/21) |

---

## ⏸️ NON-MVP — Deferred (Do NOT Work On Until Launch)

### Post-Launch Features
| GitHub Issue | Title | Tags | Reason Deferred |
|--------------|-------|------|-----------------|
| [#51](https://github.com/wyofalcon/cvstomize/issues/51) | Auto-Generate Portfolio Website | `NON-MVP` | Premium feature, not core |
| [#49](https://github.com/wyofalcon/cvstomize/issues/49) | Session 37: Local AI Setup | `NON-MVP` | Enhancement, not blocking |
| [#48](https://github.com/wyofalcon/cvstomize/issues/48) | Session 36: Conversational Onboarding | `NON-MVP` | Testing needed, not blocking |
| [#45](https://github.com/wyofalcon/cvstomize/issues/45) | Theme Toggle Dark/Light Mode | `NON-MVP` | Polish feature |
| [#43](https://github.com/wyofalcon/cvstomize/issues/43) | User Profile Enhancements | `NON-MVP` | Enhancement |
| [#42](https://github.com/wyofalcon/cvstomize/issues/42) | Role-Based Landing Page | `NON-MVP` | Enhancement |
| [#40](https://github.com/wyofalcon/cvstomize/issues/40) | Talent Pool Marketplace | `NON-MVP` | POST-LAUNCH: B2B feature |
| [#39](https://github.com/wyofalcon/cvstomize/issues/39) | Marketing Campaign | `NON-MVP` | POST-LAUNCH: Growth |
| [#38](https://github.com/wyofalcon/cvstomize/issues/38) | Comprehensive Analytics | `NON-MVP` | POST-LAUNCH: Metrics |
| [#37](https://github.com/wyofalcon/cvstomize/issues/37) | User Type Selector | `NON-MVP` | Enhancement |
| [#36](https://github.com/wyofalcon/cvstomize/issues/36) | Vertex Batch API | `NON-MVP` | POST-LAUNCH: Cost optimization |
| [#30](https://github.com/wyofalcon/cvstomize/issues/30) | Comprehensive Footer | `NON-MVP` | Polish |
| [#27](https://github.com/wyofalcon/cvstomize/issues/27) | Viral Referral System | `NON-MVP` | POST-LAUNCH: Growth |
| [#22](https://github.com/wyofalcon/cvstomize/issues/22) | Browser Extension Full | `NON-MVP` | POST-LAUNCH: Feature |
| [#19](https://github.com/wyofalcon/cvstomize/issues/19) | SEO Setup | `NON-MVP` | POST-LAUNCH: Discovery |
| [#18](https://github.com/wyofalcon/cvstomize/issues/18) | Production Monitoring | `NON-MVP` | Nice-to-have for launch |
| [#15](https://github.com/wyofalcon/cvstomize/issues/15) | Monetization (Stripe) | `NON-MVP` | DEFERRED: Launch free first |
| [#14](https://github.com/wyofalcon/cvstomize/issues/14) | Support Tools (Contact, Feedback) | `NON-MVP` | POST-LAUNCH |
| [#12](https://github.com/wyofalcon/cvstomize/issues/12) | Help Chatbot | `NON-MVP` | DEFERRED: Scope creep |
| [#9](https://github.com/wyofalcon/cvstomize/issues/9) | UI/UX Redesign | `NON-MVP` | Polish |
| [#7](https://github.com/wyofalcon/cvstomize/issues/7) | Automated Dependency Updates | `NON-MVP` | POST-LAUNCH: Maintenance |
| [#6](https://github.com/wyofalcon/cvstomize/issues/6) | Email Verification Enforcement | `NON-MVP` | Nice-to-have |

---

## 🚦 Launch Checklist

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: BUILD                                             │
- [x] **F11:** Career Portfolio Generator (AI-powered GitHub Pages deployment) - *Completed 2026-01-13*
- [ ] **M1:** Production build diagnosis
│  [ ] M2 - Fix Test Configuration                            │
├─────────────────────────────────────────────────────────────┤
│  PHASE 2: DEPENDENCIES                                      │
│  [ ] M3 - Fix Deprecated Dependencies (#50)                 │
├─────────────────────────────────────────────────────────────┤
│  PHASE 3: SECURITY                                          │
│  [ ] M4 - Security Audit (#16)                              │
├─────────────────────────────────────────────────────────────┤
│  PHASE 4: DATA                                              │
│  [ ] M5 - Fix Profile Data Persistence (#10, #29)           │
│  [ ] M6 - Replace In-Memory Sessions (#17)                  │
├─────────────────────────────────────────────────────────────┤
│  PHASE 5: UX                                                │
│  [ ] M7 - Fix Onboarding Navigation                         │
├─────────────────────────────────────────────────────────────┤
│  PHASE 6: LEGAL                                             │
│  [ ] M8 - Terms of Service & Privacy Policy (#13)           │
├─────────────────────────────────────────────────────────────┤
│  PHASE 7: PRE-LAUNCH                                        │
│  [ ] M9 - Complete Pre-Launch Checklist (#34)               │
├─────────────────────────────────────────────────────────────┤
│  PHASE 8: VERIFY                                            │
│  [ ] M10 - Login Flow                                       │
│  [ ] M11 - Resume Builder (blocked by M5)                   │
│  [ ] M12 - Quick Tailor (blocked by M11)                    │
├─────────────────────────────────────────────────────────────┤
│  🚀 LAUNCH                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 GitHub Issue Summary

### MVP Issues (12 items)
| Issue | Title | Priority |
|-------|-------|----------|
| #50 | Fix Deprecated Dependencies | 🔴 High |
| #16 | Security Hardening | 🔴 High |
| #10 | Fix Resume Upload Data Persistence | 🔴 Critical |
| #29 | Resume Upload Parsing & Persistence | 🔴 High |
| #17 | Replace In-Memory Sessions | 🔴 Critical |
| #13 | Terms of Service & Privacy Policy | 🔴 High |
| #34 | Pre-Launch Checklist | 🔴 Critical |
| #11 | Configure Quick Tailor Path | 🔴 High |

### NON-MVP Issues (22 items)
All other open issues tagged for post-launch.

---

## 📝 Notes

- **Total Open Issues:** 31
- **MVP Issues:** ~12 (including build/test blockers not in GitHub)
- **NON-MVP Issues:** ~22
- **Strategy:** Ship MVP first, iterate after user feedback. **PIVOT (2026-01-13):** Paused WebLLM/Local AI; using Vertex AI for all features (including Quick Tailor) to simplify launch and use credits.

---

*Update status as work progresses. Check off items in the Launch Checklist.*
