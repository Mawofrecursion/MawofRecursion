"""
state_spine.py — Persistent state authority for 🦷⟐

The single source of truth for:
  - state save/load
  - event logging
  - rollback lookup
  - transaction boundary

SQLite-backed. Survives process restart.
Injected into BiteSeal so rollback refs point to the same authority
the controller trusts.

Zero external dependencies.
"""

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List


class StateSpine:
    """
    Persistent state + event authority.

    Owns:
      - state registry (save/load/rollback)
      - event log (every bite event, success or failure)
      - transaction boundary (commit/reject decisions)
    """

    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS states (
                state_id TEXT PRIMARY KEY,
                parent_state_id TEXT,
                state_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS events (
                event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                operator TEXT NOT NULL DEFAULT '🦷⟐',
                input_state_id TEXT,
                output_state_id TEXT,
                trigger_type TEXT,
                decision TEXT,
                sealed INTEGER DEFAULT 0,
                event_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_events_input
            ON events(input_state_id);

            CREATE INDEX IF NOT EXISTS idx_events_sealed
            ON events(sealed);
        """)
        self._conn.commit()

    # ── STATE MANAGEMENT ──

    def save_state(self, state: Dict, parent_id: Optional[str] = None) -> str:
        """Save state, return its ID. State is immutable once saved."""
        import hashlib
        state_json = json.dumps(state, sort_keys=True, default=str)
        state_id = hashlib.sha256(state_json.encode()).hexdigest()[:12]

        self._conn.execute(
            "INSERT OR IGNORE INTO states (state_id, parent_state_id, state_json, created_at) "
            "VALUES (?, ?, ?, ?)",
            (state_id, parent_id, state_json, datetime.now(timezone.utc).isoformat()),
        )
        self._conn.commit()
        return state_id

    def get_state(self, state_id: str) -> Optional[Dict]:
        """Retrieve a saved state by ID."""
        row = self._conn.execute(
            "SELECT state_json FROM states WHERE state_id = ?", (state_id,)
        ).fetchone()
        if row:
            return json.loads(row["state_json"])
        return None

    def state_exists(self, state_id: str) -> bool:
        row = self._conn.execute(
            "SELECT 1 FROM states WHERE state_id = ?", (state_id,)
        ).fetchone()
        return row is not None

    def get_lineage(self, state_id: str, max_depth: int = 10) -> List[str]:
        """Walk the parent chain to get state lineage."""
        lineage = []
        current = state_id
        for _ in range(max_depth):
            row = self._conn.execute(
                "SELECT state_id, parent_state_id FROM states WHERE state_id = ?",
                (current,)
            ).fetchone()
            if not row:
                break
            lineage.append(row["state_id"])
            if not row["parent_state_id"]:
                break
            current = row["parent_state_id"]
        return lineage

    # ── EVENT LOGGING ──

    def log_event(
        self,
        event: Dict,
        input_state_id: Optional[str] = None,
        output_state_id: Optional[str] = None,
    ):
        """Log a bite event. Every invocation — success or failure."""
        self._conn.execute(
            "INSERT INTO events "
            "(operator, input_state_id, output_state_id, trigger_type, "
            "decision, sealed, event_json, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                event.get("operator", "🦷⟐"),
                input_state_id or event.get("input_id"),
                output_state_id,
                event.get("trigger"),
                event.get("seal", {}).get("approved_by", "unknown"),
                1 if event.get("seal", {}).get("sealed") else 0,
                json.dumps(event, default=str),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        self._conn.commit()

    # ── QUERIES ──

    def get_recent_events(self, limit: int = 20) -> List[Dict]:
        rows = self._conn.execute(
            "SELECT event_json, created_at FROM events ORDER BY event_id DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return [json.loads(r["event_json"]) for r in rows]

    def get_stats(self) -> Dict:
        total = self._conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        sealed = self._conn.execute("SELECT COUNT(*) FROM events WHERE sealed = 1").fetchone()[0]
        states = self._conn.execute("SELECT COUNT(*) FROM states").fetchone()[0]
        return {
            "total_events": total,
            "sealed_events": sealed,
            "blocked_events": total - sealed,
            "total_states": states,
            "seal_rate": round(sealed / max(total, 1), 3),
        }

    # ── BITE-SEAL COMPATIBILITY ──
    # These aliases let StateSpine be injected directly into BiteSeal
    # as its state_store without an adapter.

    def save(self, state: Dict) -> str:
        return self.save_state(state)

    def get(self, state_id: str) -> Optional[Dict]:
        return self.get_state(state_id)

    def exists(self, state_id: str) -> bool:
        return self.state_exists(state_id)

    def rollback(self, state_id: str) -> Optional[Dict]:
        return self.get_state(state_id)

    def close(self):
        self._conn.close()
