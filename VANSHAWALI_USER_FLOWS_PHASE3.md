# Vanshawali User Journeys (Phase 3)

Date: 2026-08-03
Scope: End-to-end frontend journeys mapped to existing backend contracts.

## 1) Guest to Dashboard

Sequence:
1. Home feature overview
2. Login widget form
3. Optional OTP step
4. Session creation
5. Dashboard default tab: Family

Navigation:
- / -> Login CTA -> auth widget -> dashboard

APIs:
- POST /api/auth/login
- Optional OTP verification endpoint family
- Follow-up data pulls on dashboard tabs

Widget interactions:
- auth_form submit
- tab shell activation
- family widget load

Permission checks:
- authenticated user required for dashboard tabs

Loading:
- button-level loading + dashboard tab skeleton

Success:
- dashboard renders with family tab content

Failure:
- auth error panel + retry

Animation:
- section fade and tab transition

---

## 2) Family Creation / Lineage Setup

Sequence:
1. Dashboard family tab
2. Open lineage form
3. Save lineage
4. Refresh tree and summary

APIs:
- GET /api/vanshawali/user-lineage/:userId
- POST /api/vanshawali/create-lineage
- PUT /api/vanshawali/update-lineage/:userId
- GET /api/vanshawali/family-tree/:familyId

Widgets:
- family_tree_widget
- member_form_widget
- generation_summary_widget

Permission:
- authenticated + lineage edit permission

States:
- no lineage empty state
- save pending
- save fail error panel

---

## 3) Family Activity Timeline

Sequence:
1. Dashboard activity tab
2. Timeline widget load
3. Filter by date/member
4. Drill down event

APIs:
- activity feed endpoint family from existing backend route suite

Widgets:
- activity_feed_widget
- filter_bar_widget
- event_detail_widget

States:
- skeleton timeline
- no activity empty state
- network error retry

---

## 4) Media and Memories

Sequence:
1. Dashboard posts or pose wall tab
2. Open media upload
3. Upload and tag
4. View in feed/gallery

APIs:
- media upload and posts endpoints (existing backend route group)

Widgets:
- media_upload_widget
- posts_feed_widget
- media_gallery_widget

States:
- upload progress
- failed upload retry
- empty gallery prompt

---

## 5) Dravyam Wallet

Sequence:
1. Dashboard dravyam tab
2. Wallet summary load
3. Open transaction details

APIs:
- wallet and transaction endpoints in existing backend route suite

Widgets:
- wallet_summary_widget
- transaction_table_widget

States:
- summary skeleton
- no transactions state
- fetch error panel

---

## 6) Profile and Pose Wall

Sequence:
1. Profile tab
2. Edit profile fields
3. Save and refresh profile card
4. Pose wall tab for social posts

APIs:
- profile save/get endpoints
- posts/comments endpoints

Widgets:
- profile_overview_widget
- profile_form_widget
- pose_wall_widget

States:
- field validation errors
- optimistic save indicator

---

## 7) AI Assistant

Sequence:
1. Open assistant
2. Send prompt/voice
3. backend execute
4. response + optional UI updates

APIs:
- kernel execute pathways via existing kernel services

Widgets:
- ai_chat_widget
- voice_input_widget
- action_result_widget

Permission:
- action-level permission checks

Failure:
- backend error mapped to toast/error panel

---

## 8) Admin Governance

Sequence:
1. Admin dashboard
2. Moderation queue
3. Audit logs
4. Reports and analytics

APIs:
- /api/admin/* and analytics/report routes

Widgets:
- moderation_table_widget
- audit_log_widget
- report_chart_widget

Permission:
- admin role required

States:
- unauthorized state
- export loading

---

## Cross-Flow Standards

- All API calls through service layer only
- Widget-level loading, skeleton, empty, error states
- Permission checks before interaction
- Responsive behavior on all breakpoints
- Motion reduced when prefers-reduced-motion is enabled
