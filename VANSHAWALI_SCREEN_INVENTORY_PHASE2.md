# Vanshawali Screen Inventory (Phase 2)

Date: 2026-08-03
Scope: Frontend screen inventory and implementation baseline using existing backend only.
Status key:
- Existing: already present in codebase
- Partial: present but not production-ready for target behavior
- Missing: not found as dedicated production screen

## Inventory Fields
Each screen entry includes:
- Purpose
- Persona
- Business Goal
- Permissions
- Data Sources and APIs
- Existing Widgets
- Missing Widgets
- Entry Points
- Layout Rules (Mobile/Tablet/Desktop)
- Empty/Error/Loading/Skeleton
- Accessibility Notes
- Current Status

---

## A) Authentication Domain

### Splash
- Purpose: brand entry and app capability overview
- Persona: guest
- Goal: orient and drive auth conversion
- Permissions: public
- Data/APIs: static content
- Existing Widgets: hero card, feature grid
- Missing Widgets: branded splash animation widget
- Entry: /
- Layout: single-column mobile, centered tablet/desktop
- States: loading none, empty none, error none
- A11y: heading hierarchy, reduced motion support
- Status: Partial

### Welcome
- Purpose: explain Vanshawali value proposition
- Persona: guest
- Goal: funnel to login/signup
- Permissions: public
- Data/APIs: static + optional feature feed
- Existing Widgets: hero, badge chips, CTA
- Missing Widgets: content localization widget
- Entry: /
- Layout: responsive cards
- States: no data fallback to static cards
- A11y: button labels and tab order required
- Status: Existing

### Login
- Purpose: user authentication
- Persona: returning user
- Goal: authorized session creation
- Permissions: public
- Data/APIs: /api/auth/login
- Existing Widgets: auth_form (current App shell)
- Missing Widgets: otp handoff widget
- Entry: /, /login
- Layout: centered form
- States: loading submit, error banner, retry
- A11y: error announcement region needed
- Status: Existing

### Register
- Purpose: create account
- Persona: new user
- Goal: account onboarding entry
- Permissions: public
- Data/APIs: /api/auth/signup
- Existing Widgets: auth_form
- Missing Widgets: password strength meter
- Entry: / -> Signup CTA
- Layout: stacked form
- States: loading, validation errors, success handoff
- A11y: field-level error mapping needed
- Status: Existing

### OTP
- Purpose: second factor verification
- Persona: user with OTP flow
- Goal: secure login completion
- Permissions: public pre-auth
- Data/APIs: auth otp endpoints via existing auth stack
- Existing Widgets: none canonical
- Missing Widgets: otp input widget
- Entry: login flow
- Layout: compact card
- States: resend timer, invalid code
- A11y: digit group label support
- Status: Missing

### Forgot Password
- Purpose: recovery initiation
- Persona: locked-out user
- Goal: account recovery
- Permissions: public
- Data/APIs: existing auth recover endpoint family
- Existing Widgets: partial in login.js legacy form
- Missing Widgets: standalone recover widget
- Entry: login screen
- Layout: single card
- States: submit loading, mail sent, error
- A11y: clear status messaging
- Status: Partial

### Reset Password
- Purpose: set new password
- Persona: recovery user
- Goal: restore account access
- Permissions: token based
- Data/APIs: reset endpoint in auth service
- Existing Widgets: partial
- Missing Widgets: reset form widget with token validation
- Entry: forgot flow
- Layout: compact
- States: expired token, success redirect
- A11y: password criteria hints
- Status: Partial

### Profile Setup
- Purpose: first-time profile completion
- Persona: new authenticated user
- Goal: complete required profile metadata
- Permissions: authenticated
- Data/APIs: onboarding profile save endpoints
- Existing Widgets: ProfileOnboarding modal flow
- Missing Widgets: reusable onboarding_chat widget model binding
- Entry: post-login onboarding
- Layout: modal/fullscreen responsive
- States: step loading, save pending, exit/close
- A11y: focus trap and close controls required
- Status: Partial

---

## B) Home and Dashboard Domain

### Home
- Purpose: authenticated hub and context launcher
- Persona: family member
- Goal: drive to family operations and content
- Permissions: authenticated
- Data/APIs: dashboard summaries and quick metrics
- Existing Widgets: default tab shell
- Missing Widgets: quick action rail widget
- Entry: post-login
- Layout: dashboard cards and tabs
- States: skeleton cards required
- A11y: landmarks and keyboard tab nav
- Status: Partial

### Dashboard
- Purpose: operational control center
- Persona: member/admin
- Goal: overview of family, posts, dravyam, profile, pose wall
- Permissions: authenticated + role flags
- Data/APIs: kernel/ui + vanshawali + dashboard endpoints
- Existing Widgets: tabs, VanshawaliDisplay, summary cards
- Missing Widgets: unified activity feed and wallet transaction widgets
- Entry: /dashboard
- Layout: tabbed responsive
- States: per-tab loading and fallback
- A11y: tab role attributes needed
- Status: Partial

### Admin Dashboard
- Purpose: governance and moderation controls
- Persona: admin/moderator
- Goal: policy, audit, analytics operations
- Permissions: admin
- Data/APIs: /api/admin/* + reports
- Existing Widgets: AdminCustomizationPanel (legacy)
- Missing Widgets: admin overview grid
- Entry: admin route
- Layout: two-column desktop
- States: permission denied panel
- A11y: high contrast tables
- Status: Partial

---

## C) Family and Lineage Domain

### My Family, Family Tree, Family Members, Member Profile, Relationship Editor, Ancestor View, Descendant View, Generation View
- Purpose: lineage graph and member relationship management
- Persona: family member, curator
- Goal: maintain accurate genealogy graph
- Permissions: authenticated, relationship edit permission
- Data/APIs: /api/vanshawali/user-lineage, /api/vanshawali/family-tree, search
- Existing Widgets: VanshawaliDisplay base
- Missing Widgets: relationship_graph, member_card, generation_lanes, editor_drawer
- Entry: dashboard family tab
- Layout: tree canvas desktop, stacked cards mobile
- States: no lineage empty state, lineage load skeleton, save error/retry
- A11y: graph alternative list view required
- Status: Partial

---

## D) Timeline and Memories Domain

### Family Timeline, Life Timeline, Memories, Stories, Posts, Comments, Albums, Photos, Videos, Voice Memories, Documents, Certificates
- Purpose: family memory and content timeline
- Persona: all family members
- Goal: preserve and engage with family history
- Permissions: authenticated with content scope
- Data/APIs: post/media/comment endpoints + storage service APIs already present
- Existing Widgets: basic posts placeholder cards in new shell
- Missing Widgets: timeline_feed, media_gallery, document_viewer, comments_thread
- Entry: posts and pose wall tabs
- Layout: feed + sidebar desktop, single feed mobile
- States: empty feed prompt, upload progress, media errors
- A11y: media alt captions and transcript support needed
- Status: Partial

---

## E) Events and Notification Domain

### Events, Birthdays, Anniversaries, Invitations, Notifications
- Purpose: event coordination and reminders
- Persona: family organizer/member
- Goal: improve participation and awareness
- Permissions: authenticated
- Data/APIs: calendar/events/notification APIs in backend route suite
- Existing Widgets: none dedicated
- Missing Widgets: calendar_widget, reminder_list, invitation_response
- Entry: activity tab and nav
- Layout: month grid desktop, agenda mobile
- States: no events empty card, retry on sync failure
- A11y: keyboard calendar navigation required
- Status: Missing

---

## F) Search and Map Domain

### Search, Global Search, Advanced Search, Map, Ancestral Village, Migration, Nearby Family
- Purpose: find members, records, places
- Persona: researcher/member
- Goal: discoverability and context
- Permissions: authenticated, scoped by visibility
- Data/APIs: vanshawali search + node/location endpoints
- Existing Widgets: search hooks in VanshawaliDisplay partial
- Missing Widgets: global_search, map_widget, migration_path
- Entry: top nav search actions
- Layout: search panel + results list
- States: no results, loading shimmer, API error
- A11y: search input announcements
- Status: Partial

---

## G) Communication Domain

### Chat, Voice Call, Video Call, Communities, Circles, Groups
- Purpose: collaboration and communication
- Persona: members and moderators
- Goal: increase engagement
- Permissions: authenticated, group membership
- Data/APIs: chat/realtime/socket endpoints + group routes
- Existing Widgets: FloatingChat variants
- Missing Widgets: unified_chat_widget, call_controls, group_hub
- Entry: floating assistant and communication nav
- Layout: split panel desktop, fullscreen mobile
- States: disconnected state, reconnect strategy
- A11y: call control labeling and keyboard support
- Status: Partial

---

## H) Settings and Account Domain

### Settings, Theme, Language, Privacy, Permissions, Security, Devices, Subscription, Help, Feedback
- Purpose: user and policy management
- Persona: authenticated user
- Goal: personalization and trust
- Permissions: authenticated/admin for some panels
- Data/APIs: profile/settings/permission endpoints + auth devices
- Existing Widgets: fragmented controls in legacy components
- Missing Widgets: settings_tabs, permission_matrix, device_session_list, support_ticket
- Entry: profile/settings nav
- Layout: tabbed settings page
- States: save progress and rollback on failure
- A11y: form labels and group semantics
- Status: Partial

---

## I) AI and Governance Domain

### AI Assistant, Moderation, Audit Logs, Reports, Analytics
- Purpose: assistant workflows and governance
- Persona: member/admin
- Goal: automation with traceability
- Permissions: role scoped
- Data/APIs: kernel execute, admin routes, analytics endpoints
- Existing Widgets: floating chat partial
- Missing Widgets: ai_command_panel, moderation_queue, audit_table, reports_charts
- Entry: dashboard tools/admin
- Layout: cards + data table
- States: no logs empty state, export loading
- A11y: table semantics and filters keyboard flow
- Status: Partial

---

## Cross-Screen Responsive Rules Baseline
- Mobile: single-column stack, off-canvas nav/drawer, sticky action bar
- Tablet: 2-column adaptive grid for dashboard and settings
- Desktop: 3-column summary + content split where applicable

## Cross-Screen State Strategy Baseline
- Loading: skeleton first, spinner fallback
- Empty: guidance text + CTA
- Error: non-blocking error panel + retry
- Permission failure: dedicated access denied widget

## Phase 2 Output Completion
- Full requested screen list is inventoried and mapped to current status.
- Next phase: Phase 3 end-to-end user journeys with screen sequence, APIs, permissions, widget interactions, success/failure states.
