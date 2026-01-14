# CVstomize Design Principles

> **"Simple yet robust."** — Guiding philosophy for all UI/UX decisions.

## The Problem with "More Options"

People _think_ they want tons of options, but research shows:

- **Choice overload** leads to decision paralysis
- Users with fewer options convert at higher rates
- Anxiety increases with every additional button/link on screen
- "Power features" intimidate casual users

CVstomize solves this by being **opinionated by default** with escape hatches for advanced users.

---

## Core Design Principles

### 1. One Primary Action Per Screen

Every page should answer: "What is the ONE thing the user should do here?"

```
✅ Good: "Start Building Your Resume" button dominates the page
❌ Bad: 5 equal-sized cards asking user to choose a path
```

### 2. Progressive Disclosure

Show the minimum viable UI. Reveal complexity only when requested.

```
✅ Good: "More options ▼" expands advanced settings
❌ Bad: 15 form fields visible on first load
```

### 3. Conversational Flow > Form Dumping

Instead of presenting a massive form, guide users through questions one at a time.

```
✅ Good: AI asks "What achievement are you most proud of?"
❌ Bad: "Fill out all 8 sections of your work history"
```

### 4. Smart Defaults

Pre-fill everything possible. Let users change if needed, not build from scratch.

```
✅ Good: Template auto-selected based on industry
❌ Bad: "Choose from 47 resume templates"
```

### 5. Visual Hierarchy

- Primary CTA: Bold, colored, impossible to miss
- Secondary actions: Muted, smaller, text-style
- Tertiary/destructive: Hidden in menus or behind confirmations

### 6. Mobile-First Ruthlessness

If a design doesn't work on a phone screen, simplify until it does. Desktop gets the same clean design with more whitespace.

### 7. App-Store Ready Architecture

CVstomize will eventually deploy to **iOS App Store** and **Google Play Store**. Every design decision must consider this migration path.

---

## 📱 Mobile App Migration Strategy

### Target Deployment

- **Phase 1 (Current):** Progressive Web App (PWA) — works on all devices via browser
- **Phase 2:** Capacitor wrapper — same React codebase, native app stores
- **Phase 3 (Optional):** React Native rewrite for fully native performance

### Design Requirements for App Stores

| Requirement          | Why                             | Implementation                            |
| -------------------- | ------------------------------- | ----------------------------------------- |
| Touch targets ≥44px  | Apple HIG / Material spec       | All buttons, links use `minHeight: 44`    |
| No hover-only states | Touch devices have no hover     | Use `:active` states, visible affordances |
| Bottom navigation    | Thumb-friendly, native pattern  | Implement bottom tabs for main nav        |
| Swipe gestures       | Expected in native apps         | Support swipe-to-go-back, pull-to-refresh |
| Offline mode         | App Store expectation           | Queue actions, show connectivity status   |
| Deep linking         | Required for app store approval | Use React Router with path-based URLs     |
| Safe area insets     | iPhone notch, Android nav bar   | Use `env(safe-area-inset-*)` CSS          |

### What to Avoid (Breaks Native Feel)

❌ `window.print()` — Use PDF generation API instead
❌ `window.open()` for new tabs — Use in-app navigation
❌ Hover tooltips without tap alternative
❌ Right-click menus — Use long-press or visible buttons
❌ Browser-specific features (`localStorage` is fine, `IndexedDB` preferred)
❌ Fixed headers that don't respect safe areas

### Camera & File Handling

```javascript
// ✅ Good: Standard file input (Capacitor can bridge)
<input type="file" accept="image/*,.pdf" capture="environment" />;

// ❌ Bad: Browser-only API
navigator.mediaDevices.getUserMedia();
```

### Navigation Patterns

```
Web (current):     Top navbar with hamburger menu
Mobile App:        Bottom tab bar + stack navigation

Both should use the same route structure:
  /dashboard → Home tab
  /profile → Profile tab
  /resumes → My Resumes tab
  /create → Modal or full-screen flow
```

### Firebase Integration (Already App-Ready)

- ✅ Firebase Auth — Works in Capacitor/React Native
- ✅ Firestore — Works everywhere
- ✅ Cloud Messaging — Push notifications ready
- ✅ Analytics — Automatic in native apps

---

## Implementation Guidelines

### Button Limits

| Screen Type  | Max Primary CTAs | Max Secondary Actions |
| ------------ | ---------------- | --------------------- |
| Landing page | 1-2              | 2-3 in nav            |
| Dashboard    | 1                | 3-4 card options      |
| Form/Wizard  | 1 (Next/Submit)  | 1 (Back/Cancel)       |
| Modal        | 1                | 1 (Cancel)            |

### Color Usage

- **Primary action:** Brand color (teal `#00897B`)
- **Secondary action:** Grey or outlined
- **Destructive:** Red, always requires confirmation
- **Disabled:** Greyed out with tooltip explaining why

### Copy Guidelines

- Headlines: 3-7 words
- Descriptions: 1-2 sentences max
- Button text: 2-3 words, action-oriented ("Get Started", not "Click here to begin the process")
- Error messages: Tell user what to do, not just what went wrong

---

## Anti-Patterns Blacklist

### Never Do These:

1. **Option grids** — 6+ equal choices overwhelm users
2. **Dense settings pages** — Break into categories or use progressive disclosure
3. **Multiple modals** — One modal at a time, ever
4. **Competing CTAs** — If two buttons look equally important, redesign
5. **Unexplained icons** — Always pair with text or tooltips
6. **Walls of text** — Use bullet points, visuals, or accordions
7. **Required asterisks everywhere** — Make most fields optional or use smart defaults
8. **Confirmation dialogs for non-destructive actions** — Just do it

---

## Examples from CVstomize

### ✅ Good: Landing Page

- One hero CTA: "Try Free Demo"
- Secondary: "Sign In" in nav (muted)
- Clear value prop in 6 words

### ✅ Good: Demo Experience

- One question at a time
- Clear progress indicator
- Single "Next" button

### ❌ Would Be Bad: Resume Builder

- Showing all sections at once with edit buttons
- Asking user to "choose a template" from 20 options
- Multi-column layout with skills, experience, education all editable simultaneously

---

## Decision Framework

When adding a new feature or screen, ask:

1. **Is this essential for the core user journey?**

   - Yes → Make it prominent
   - No → Hide it or cut it

2. **Can this be automated or defaulted?**

   - Yes → Do it automatically, let user override
   - No → Guide through conversation

3. **Does this add cognitive load?**

   - Yes → Find a simpler approach or defer to later
   - No → Proceed

4. **Would a first-time user understand this in 3 seconds?**
   - Yes → Ship it
   - No → Simplify or add progressive disclosure

---

## Measuring Success

- **Task completion rate** > 90% for core flows
- **Time to first resume** < 10 minutes
- **User-reported confusion** → 0 support tickets about "where to click"
- **Mobile completion rate** within 10% of desktop
- **App Store rating** ≥ 4.5 stars (post-launch)
- **Crash-free sessions** > 99.5%

---

## App Store Submission Checklist (Future)

- [ ] All screens work without network (graceful offline)
- [ ] Touch targets meet 44px minimum
- [ ] No web-only features (print dialogs, hover-only)
- [ ] Deep links work for all routes
- [ ] Safe area insets respected on all screens
- [ ] App icons and splash screens at all required sizes
- [ ] Privacy policy URL in app and store listing
- [ ] Screenshots for all device sizes

---

_Last updated: January 2026_
