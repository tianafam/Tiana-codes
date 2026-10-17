# VisitReady — SPEC

AI-assisted healthcare journey demo (fictional). One visit doc (`id: visit-alex-001`, Mongo `visits`) links all four stages for patient Alex Turner.

## Roles
No login. Header toggle: Patient (→ /journey) / Clinician (→ /clinician). "Reset demo" (header) → POST /api/visit/reset clears the visit.

## Flows / pages
- `/` home: direct search (→ /clinics?q=) or guided (→ /navigate). Service chips → /clinics?service=id.
- `/navigate`: 4-step questionnaire (concern, duration, consulted before + referral, location + preference + consent_reuse). "Fill Alex's demo answers" button. POST /api/visit/questionnaire → rule-based pathway (lib/demo_data.suggest_pathway; red-flag words → emergency banner). Not a diagnosis.
- `/clinics`: fictional clinics (static, slots for next 3 days from server today). POST /api/visit/booking {clinic_id, slot_id, service_id}.
- `/prep`: requires booking. Form prefilled from questionnaire only if consent_reuse. POST /api/visit/brief/generate {prep, use_fallback} → GPT-5.2 (emergent key) or fallback; each point has source_field + source_text. PUT /api/visit/brief {points, shared} → status saved. Clinician sees brief only if shared && saved.
- `/clinician`: load sample transcript (GET /api/demo/transcript), POST /api/visit/consult/generate → status draft. PUT /api/visit/consult (edits, draft only). POST /api/visit/consult/approve {notes, instructions, reviewed:true} → approved, locked, tasks created (status suggested) from instructions verbatim.
- `/actions`: locked until approved. Confirm suggested tasks (POST /api/visit/tasks/confirm) → todo. PATCH /api/visit/tasks/{id} {status: todo|in_progress|completed} (409 if still suggested).
- `/journey`: dashboard of 4 stages.

## Business rules enforced server-side
409 for: brief without booking, notes without booking, edits after approval, confirming tasks before approval, status change on unconfirmed task. 422 approve without reviewed.

## AI
lib/ai.py — OpenAI gpt-5.2 via emergentintegrations, JSON parsed from streamed text; any failure → labelled fallback (`ai_source: "fallback"`).
