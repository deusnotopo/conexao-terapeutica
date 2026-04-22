from dataclasses import dataclass, field
from datetime import datetime, timezone
import json
import sqlite3
from typing import Callable, Dict, List, Optional


@dataclass
class Job:
    job_id: str
    job_type: str
    payload: Dict[str, str]
    attempts: int = 0
    max_attempts: int = 3
    status: str = "queued"
    last_error: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class JobResult:
    job_id: str
    success: bool
    message: str


class InMemoryJobQueue:
    def __init__(self) -> None:
        self.pending: List[Job] = []
        self.completed: List[Job] = []
        self.dead_letter: List[Job] = []

    def enqueue(self, job: Job) -> None:
        self.pending.append(job)

    def process(self, handlers: Dict[str, Callable[[Job], None]]) -> List[JobResult]:
        results: List[JobResult] = []
        remaining: List[Job] = []

        for job in self.pending:
            handler = handlers.get(job.job_type)
            if handler is None:
                job.status = "dead_letter"
                job.last_error = f"handler ausente para {job.job_type}"
                job.updated_at = datetime.now(timezone.utc).isoformat()
                self.dead_letter.append(job)
                results.append(JobResult(job.job_id, False, job.last_error))
                continue

            try:
                job.attempts += 1
                handler(job)
                job.status = "completed"
                job.updated_at = datetime.now(timezone.utc).isoformat()
                self.completed.append(job)
                results.append(JobResult(job.job_id, True, "processado com sucesso"))
            except Exception as exc:  # noqa: BLE001
                job.last_error = str(exc)
                job.updated_at = datetime.now(timezone.utc).isoformat()
                if job.attempts >= job.max_attempts:
                    job.status = "dead_letter"
                    self.dead_letter.append(job)
                    results.append(JobResult(job.job_id, False, f"falha terminal: {exc}"))
                else:
                    job.status = "retry"
                    remaining.append(job)
                    results.append(JobResult(job.job_id, False, f"retry agendado: {exc}"))

        self.pending = remaining
        return results


class SQLiteJobQueue:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS operation_jobs (
                job_id TEXT PRIMARY KEY,
                job_type TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                max_attempts INTEGER NOT NULL DEFAULT 3,
                status TEXT NOT NULL,
                last_error TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        self.conn.commit()

    def enqueue(self, job: Job) -> None:
        self.conn.execute(
            """
            INSERT OR REPLACE INTO operation_jobs (
                job_id, job_type, payload_json, attempts, max_attempts, status, last_error, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                job.job_id,
                job.job_type,
                json.dumps(job.payload, ensure_ascii=False),
                job.attempts,
                job.max_attempts,
                job.status,
                job.last_error,
                job.created_at,
                job.updated_at,
            ),
        )
        self.conn.commit()

    def _load_pending(self) -> List[Job]:
        rows = self.conn.execute(
            """
            SELECT job_id, job_type, payload_json, attempts, max_attempts, status, last_error, created_at, updated_at
            FROM operation_jobs
            WHERE status IN ('queued', 'retry')
            ORDER BY created_at ASC
            """
        ).fetchall()
        return [
            Job(
                job_id=row[0],
                job_type=row[1],
                payload=json.loads(row[2]),
                attempts=row[3],
                max_attempts=row[4],
                status=row[5],
                last_error=row[6],
                created_at=row[7],
                updated_at=row[8],
            )
            for row in rows
        ]

    def process(self, handlers: Dict[str, Callable[[Job], None]]) -> List[JobResult]:
        results: List[JobResult] = []
        for job in self._load_pending():
            handler = handlers.get(job.job_type)
            if handler is None:
                job.status = "dead_letter"
                job.last_error = f"handler ausente para {job.job_type}"
                job.updated_at = datetime.now(timezone.utc).isoformat()
                self._persist_job(job)
                results.append(JobResult(job.job_id, False, job.last_error))
                continue

            try:
                job.attempts += 1
                handler(job)
                job.status = "completed"
                job.last_error = ""
                job.updated_at = datetime.now(timezone.utc).isoformat()
                self._persist_job(job)
                results.append(JobResult(job.job_id, True, "processado com sucesso"))
            except Exception as exc:  # noqa: BLE001
                job.last_error = str(exc)
                job.updated_at = datetime.now(timezone.utc).isoformat()
                job.status = "dead_letter" if job.attempts >= job.max_attempts else "retry"
                self._persist_job(job)
                message = f"falha terminal: {exc}" if job.status == "dead_letter" else f"retry agendado: {exc}"
                results.append(JobResult(job.job_id, False, message))
        return results

    def summarize(self) -> Dict[str, int]:
        rows = self.conn.execute(
            "SELECT status, COUNT(*) FROM operation_jobs GROUP BY status"
        ).fetchall()
        summary = {"pending": 0, "completed": 0, "dead_letter": 0}
        for status, total in rows:
            if status in {"queued", "retry"}:
                summary["pending"] += total
            elif status == "completed":
                summary["completed"] += total
            elif status == "dead_letter":
                summary["dead_letter"] += total
        return summary

    def _persist_job(self, job: Job) -> None:
        self.conn.execute(
            """
            UPDATE operation_jobs
            SET attempts = ?, status = ?, last_error = ?, updated_at = ?, payload_json = ?
            WHERE job_id = ?
            """,
            (
                job.attempts,
                job.status,
                job.last_error,
                job.updated_at,
                json.dumps(job.payload, ensure_ascii=False),
                job.job_id,
            ),
        )
        self.conn.commit()


def build_default_handlers() -> Dict[str, Callable[[Job], None]]:
    def collect_handler(job: Job) -> None:
        if job.payload.get("simulate_failure") == "true":
            raise RuntimeError("fonte indisponível")

    def parse_handler(job: Job) -> None:
        if not job.payload.get("notice_id"):
            raise RuntimeError("notice_id ausente")

    def score_handler(job: Job) -> None:
        if job.payload.get("simulate_failure") == "true":
            raise RuntimeError("perfil não carregado")

    return {
        "collect_notice": collect_handler,
        "parse_notice": parse_handler,
        "score_notice": score_handler,
    }


def summarize_queue(queue: InMemoryJobQueue) -> Dict[str, int]:
    return {
        "pending": len(queue.pending),
        "completed": len(queue.completed),
        "dead_letter": len(queue.dead_letter),
    }