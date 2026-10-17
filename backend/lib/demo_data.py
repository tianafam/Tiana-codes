"""Fictional reference data for the VisitReady demo. Nothing here is real."""

from datetime import date, timedelta

from lib.dates import today_iso

VISIT_ID = "visit-alex-001"

PATIENT = {"name": "Alex Turner", "age": 32, "pronouns": "they/them", "suburb": "Carlton VIC 3053"}

SERVICES = [
    {"id": "gp", "name": "General Practice (GP)", "description": "Everyday health concerns, check-ups, referrals and ongoing care."},
    {"id": "telehealth", "name": "Telehealth GP", "description": "A video or phone consult with a GP from home."},
    {"id": "physio", "name": "Physiotherapy", "description": "Muscle, joint and movement concerns."},
    {"id": "psychology", "name": "Psychology", "description": "Support for mood, stress, anxiety and wellbeing."},
    {"id": "skin", "name": "Skin Check", "description": "Mole and skin spot checks with a skin-focused GP."},
    {"id": "dental", "name": "Dental", "description": "Teeth, gums and oral health."},
]

IMG_CLINIC_1 = "https://images.unsplash.com/photo-1505410603994-c3ac6269711f?crop=entropy&cs=srgb&fm=jpg&w=900&q=70"
IMG_CLINIC_2 = "https://images.unsplash.com/photo-1510414890190-f33e404300b6?crop=entropy&cs=srgb&fm=jpg&w=900&q=70"
IMG_CLINIC_3 = "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?crop=entropy&cs=srgb&fm=jpg&w=900&q=70"
IMG_CLINIC_4 = "https://images.unsplash.com/photo-1758691461990-03b49d969495?crop=entropy&cs=srgb&fm=jpg&w=900&q=70"

_CLINICS = [
    {
        "id": "carlton-family",
        "name": "Carlton Family Medical",
        "suburb": "Carlton VIC 3053",
        "address": "112 Lygon Street, Carlton VIC 3053",
        "image": IMG_CLINIC_1,
        "bulk_billing": True,
        "rating": 4.8,
        "distance_km": 0.6,
        "services": ["gp", "skin", "telehealth"],
        "blurb": "A warm neighbourhood practice with long appointments available and an on-site nurse.",
        "practitioners": [
            {"id": "dr-lin", "name": "Dr Sarah Lin", "role": "General Practitioner", "bio": "Interests in respiratory health, asthma and preventive care.", "languages": ["English", "Mandarin"]},
            {"id": "dr-vance", "name": "Dr Marcus Vance", "role": "General Practitioner", "bio": "Family medicine, men's health and skin checks.", "languages": ["English"]},
        ],
    },
    {
        "id": "fitzroy-health",
        "name": "Fitzroy North Health Centre",
        "suburb": "Fitzroy North VIC 3068",
        "address": "48 St Georges Road, Fitzroy North VIC 3068",
        "image": IMG_CLINIC_2,
        "bulk_billing": False,
        "rating": 4.6,
        "distance_km": 2.4,
        "services": ["gp", "physio", "psychology"],
        "blurb": "Multidisciplinary centre with GPs, physiotherapists and psychologists under one roof.",
        "practitioners": [
            {"id": "dr-okafor", "name": "Dr Amara Okafor", "role": "General Practitioner", "bio": "Women's health, mental health care plans and chronic conditions.", "languages": ["English", "Igbo"]},
            {"id": "jo-harris", "name": "Jo Harris", "role": "Physiotherapist", "bio": "Sports injuries and back pain rehabilitation.", "languages": ["English"]},
        ],
    },
    {
        "id": "melbourne-telehealth",
        "name": "Melbourne Telehealth Hub",
        "suburb": "Online · Victoria",
        "address": "Video and phone consults across Victoria",
        "image": IMG_CLINIC_3,
        "bulk_billing": True,
        "rating": 4.5,
        "distance_km": 0.0,
        "services": ["telehealth", "gp", "psychology"],
        "blurb": "Same-day video consults with GPs from home.",
        "practitioners": [
            {"id": "dr-patel", "name": "Dr Ravi Patel", "role": "General Practitioner", "bio": "Telehealth-first GP focused on acute and everyday care.", "languages": ["English", "Hindi"]},
        ],
    },
    {
        "id": "brunswick-dental",
        "name": "Brunswick Smile Studio",
        "suburb": "Brunswick VIC 3056",
        "address": "301 Sydney Road, Brunswick VIC 3056",
        "image": IMG_CLINIC_4,
        "bulk_billing": False,
        "rating": 4.7,
        "distance_km": 3.1,
        "services": ["dental"],
        "blurb": "General and preventive dentistry.",
        "practitioners": [
            {"id": "dr-nguyen", "name": "Dr Linh Nguyen", "role": "Dentist", "bio": "Gentle general dentistry and check-ups.", "languages": ["English", "Vietnamese"]},
        ],
    },
]

_TIMES = ["08:45", "10:15", "13:30", "16:00"]


def clinics() -> list[dict]:
    """Clinics with slots for the next three days, anchored on the server's today."""
    start = date.fromisoformat(today_iso()) + timedelta(days=1)
    out = []
    for c in _CLINICS:
        slots = []
        for d in range(3):
            day = (start + timedelta(days=d)).isoformat()
            for pi, p in enumerate(c["practitioners"]):
                for ti, t in enumerate(_TIMES):
                    if (ti + pi + d) % 3 == 2:  # leave gaps so the calendar looks realistic
                        continue
                    mode = "telehealth" if c["id"] == "melbourne-telehealth" else "in_person"
                    slots.append({"id": f"{c['id']}_{p['id']}_{day}_{t}", "practitioner_id": p["id"], "date": day, "time": t, "mode": mode})
        out.append({**c, "slots": slots})
    return out


RED_FLAGS = [
    "chest pain", "can't breathe", "cannot breathe", "difficulty breathing", "short of breath", "shortness of breath",
    "coughing blood", "coughing up blood", "unconscious", "fainting", "stroke", "severe bleeding", "suicidal", "blue lips",
]

_PATHWAYS = [
    (["skin", "mole", "rash", "spot", "freckle"], "skin"),
    (["back", "knee", "shoulder", "joint", "sprain", "ankle", "neck pain"], "physio"),
    (["anxious", "anxiety", "stress", "mood", "depress", "panic", "sleep"], "psychology"),
    (["tooth", "teeth", "gum", "dental", "jaw"], "dental"),
]


def suggest_pathway(q: dict) -> dict:
    """Predefined, rule-based service suggestion. Explicitly NOT a diagnosis or triage decision."""
    text = f"{q['main_concern']} {q.get('referral', '')}".lower()
    emergency = any(flag in text for flag in RED_FLAGS)
    service_id = "gp"
    for words, sid in _PATHWAYS:
        if any(w in text for w in words):
            service_id = sid
            break
    if service_id == "gp" and q.get("preference") == "telehealth":
        service_id = "telehealth"
    names = {s["id"]: s["name"] for s in SERVICES}

    reasons = [f"You described: \u201c{q['main_concern'].strip()}\u201d"]
    reasons.append(f"It has been going on for {q['duration']}.")
    if q["consulted_before"] == "no":
        reasons.append("You haven't seen a health professional about this yet \u2014 a GP is a common first stop.")
    else:
        reasons.append("You've already seen someone \u2014 a GP can review progress and coordinate next steps.")
    if q.get("referral"):
        reasons.append(f"Referral noted: {q['referral']}. Bring it to your appointment.")

    explanations = {
        "gp": "Many people with concerns like this start with a General Practitioner, who can assess you in person, arrange tests and refer you on if needed.",
        "telehealth": "A telehealth GP can talk through your concern from home and arrange an in-person visit or tests if needed.",
        "skin": "Skin-focused GPs can look at spots and changes and refer you to a dermatologist if needed.",
        "physio": "A physiotherapist can assess movement concerns. A GP is also a good option if you're unsure.",
        "psychology": "A GP can create a Mental Health Treatment Plan, and psychologists offer ongoing support.",
        "dental": "A dentist is the right place to start for teeth and gum concerns.",
    }
    alternatives = [s for s in ["gp", "telehealth"] if s != service_id][:2]
    return {
        "service_id": service_id,
        "service_name": names[service_id],
        "headline": f"People with similar concerns often explore {names[service_id]}",
        "explanation": explanations[service_id],
        "reasons": reasons,
        "alternatives": alternatives,
        "emergency": emergency,
    }


SAMPLE_TRANSCRIPT_TITLE = "Fictional consult \u2014 Dr Sarah Lin & Alex Turner (6 min)"
SAMPLE_TRANSCRIPT = """Dr Lin: Hi Alex, come on in. I've had a look at the notes you shared before today \u2014 thank you, that's really helpful. Tell me about this cough.
Alex: It started after a cold about three weeks ago. The cold went away but the cough just hasn't. It's dry, and it's worst at night \u2014 it's keeping me up.
Dr Lin: Any fever, chills, or coughing anything up?
Alex: No fever for the last two weeks. Nothing coming up, it's just dry and tickly.
Dr Lin: Any shortness of breath, chest pain, or wheezing?
Alex: Maybe a little wheezy when I go for a run, but no chest pain.
Dr Lin: Do you smoke or vape? Any asthma history?
Alex: I don't smoke. I had mild asthma as a kid but haven't needed a puffer in years.
Dr Lin: What have you tried so far?
Alex: Honey and lemon, and some lozenges from the chemist. They help a bit.
Dr Lin: OK. Let me have a listen to your chest. ... Your temperature is 36.8, oxygen saturation is 98 percent, and your chest sounds clear today with a very faint wheeze on forced breathing out. Throat looks normal.
Alex: Is it something serious? That's my main worry.
Dr Lin: It's a really common pattern after a viral infection \u2014 we call it a post-viral cough, and with your childhood asthma there may be some airway sensitivity. It usually settles, but because it's been three weeks I'd like a chest X-ray just to be thorough.
Alex: Sure.
Dr Lin: I'm also going to prescribe a preventer inhaler. Fluticasone 125 micrograms, two puffs twice a day for four weeks, and rinse your mouth with water after each use.
Alex: Got it.
Dr Lin: Please book a review appointment with me in two weeks so we can go over the X-ray and see how the inhaler is going. Keep up the honey and warm drinks, and try to avoid smoky environments.
Dr Lin: And importantly \u2014 if you become short of breath, have chest pain, or cough up blood, call 000 or go to the emergency department straight away.
Alex: Thanks, Dr Lin. That's reassuring."""

FALLBACK_NOTES = {
    "subjective": "32yo presenting with 3-week dry cough following a viral URTI. Cough worse at night, disturbing sleep. No fever for 2 weeks, non-productive. Mild exertional wheeze when running. No chest pain. Non-smoker, no vaping. Childhood mild asthma, no inhaler use in years. Tried honey/lemon and OTC lozenges with partial relief. Patient concerned about serious cause.",
    "objective": "Temp 36.8\u00b0C. SpO2 98% on room air. Chest clear on auscultation, faint end-expiratory wheeze on forced expiration. Throat NAD.",
    "assessment": "Likely post-viral cough with possible airway hyperreactivity given childhood asthma history. No red-flag features identified today.",
    "plan": "Chest X-ray given 3-week duration. Commence inhaled corticosteroid preventer. Review in 2 weeks with X-ray results. Supportive care. Safety-netting advice given re: SOB, chest pain, haemoptysis.",
}

FALLBACK_INSTRUCTIONS = [
    {"kind": "test", "text": "Have a chest X-ray at any radiology clinic using the request form from Dr Lin."},
    {"kind": "medication", "text": "Fluticasone 125 micrograms, two puffs twice a day for four weeks, and rinse your mouth with water after each use."},
    {"kind": "appointment", "text": "Book a review appointment with Dr Lin in two weeks to go over the X-ray and how the inhaler is going."},
    {"kind": "self_care", "text": "Keep up honey and warm drinks, and avoid smoky environments."},
    {"kind": "self_care", "text": "If you become short of breath, have chest pain, or cough up blood, call 000 or go to the emergency department straight away."},
]

TASK_TITLES = {
    "test": "Complete your test",
    "medication": "Take medication as prescribed",
    "appointment": "Book your follow-up appointment",
    "referral": "Arrange your referral",
    "self_care": "Self-care advice",
}

PREP_FIELD_LABELS = {
    "main_concern": "Main concern",
    "symptoms": "Symptoms",
    "duration": "Duration",
    "previous_care": "Previous care",
    "history": "Relevant history",
    "medications": "Current medications",
    "concerns": "Worries",
    "questions": "Questions",
}
