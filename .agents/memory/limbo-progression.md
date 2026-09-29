---
name: Limbo progression
description: Persistent Limbo pattern rules for account-specific gameplay.
---

Each authenticated account has six durable wrong-color slots and one center activation. A new distinct wrong color fills the next stable slot; correct attempts activate the center without changing the outer pattern. Six filled slots open the final white-room scene.

**Why:** The Limbo experience is intended to remember each account's pattern and distinguish new wrong colors from repeated attempts.

**How to apply:** Keep the server as the source of truth for authenticated progression; local storage is only a guest fallback.