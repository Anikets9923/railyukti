# AI Priority Engine

Scores maintenance tasks 0–100 and assigns a tier (LOW/MEDIUM/HIGH/CRITICAL), based on asset criticality, defect severity, overdue duration, failure risk, and train traffic impact.

## How to run this

```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Once running, it listens at `http://localhost:8000`.

Test it interactively at: `http://localhost:8000/docs`

## What it expects (POST /score)

See `AI_SERVICE_CONTRACT_FOR_BACKEND.md` for the full request/response shape.

## Files

- `priority_score.py` — standalone script version (reads local JSON files, prints a table). Useful for quick testing without running a server.
- `app.py` — the live service version of the same logic, used by the backend.
- `data/` — sample JSON files for local testing.
