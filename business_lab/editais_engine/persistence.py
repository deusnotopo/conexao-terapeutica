import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Iterable, List

from acquisition import CollectionRun
from models import CompanyProfile, NoticeRanking, NoticeSnapshot, RawNotice


def get_connection(db_path: str = "business_lab/editais_engine/editais.db") -> sqlite3.Connection:
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS collection_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_name TEXT NOT NULL,
            collected_count INTEGER NOT NULL,
            source_fingerprint TEXT NOT NULL,
            layout_changed INTEGER NOT NULL,
            collected_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            source_id TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            metadata_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(source, source_id)
        );

        CREATE TABLE IF NOT EXISTS notice_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            source_id TEXT NOT NULL,
            version_id TEXT NOT NULL,
            captured_at TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            normalized_text TEXT NOT NULL,
            UNIQUE(source, source_id, version_id)
        );

        CREATE TABLE IF NOT EXISTS companies (
            company_id TEXT PRIMARY KEY,
            legal_name TEXT NOT NULL,
            target_regions_json TEXT NOT NULL,
            cnaes_json TEXT NOT NULL,
            capabilities_json TEXT NOT NULL,
            certificates_json TEXT NOT NULL,
            certificate_expirations_json TEXT NOT NULL,
            portfolio_keywords_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notice_rankings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL,
            title TEXT NOT NULL,
            final_score REAL NOT NULL,
            priority_bucket TEXT NOT NULL,
            reasons_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pipeline_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_type TEXT NOT NULL,
            status TEXT NOT NULL,
            summary_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notice_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            source_id TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            metadata_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(source, source_id, content_hash)
        );

        CREATE TABLE IF NOT EXISTS notice_feedback (
            source_id TEXT PRIMARY KEY,
            relevance_score INTEGER NOT NULL,
            comment TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    ranking_cols = {row["name"] for row in conn.execute("PRAGMA table_info(notice_rankings)").fetchall()}
    if "personal_fit" not in ranking_cols:
        conn.execute("ALTER TABLE notice_rankings ADD COLUMN personal_fit REAL NOT NULL DEFAULT 50")
    if "gemini_analysis" not in ranking_cols:
        conn.execute("ALTER TABLE notice_rankings ADD COLUMN gemini_analysis TEXT")

    version_cols = {row["name"] for row in conn.execute("PRAGMA table_info(notice_versions)").fetchall()}
    if "vault_path" not in version_cols:
        conn.execute("ALTER TABLE notice_versions ADD COLUMN vault_path TEXT")

    conn.commit()


def save_collection_runs(conn: sqlite3.Connection, runs: Iterable[CollectionRun]) -> None:
    conn.executemany(
        """
        INSERT INTO collection_runs (
            source_name, collected_count, source_fingerprint, layout_changed, collected_at
        ) VALUES (?, ?, ?, ?, ?)
        """,
        [
            (
                run.source_name,
                run.collected_count,
                run.source_fingerprint,
                1 if run.layout_changed else 0,
                run.collected_at,
            )
            for run in runs
        ],
    )
    conn.commit()


def upsert_notices(conn: sqlite3.Connection, notices: Iterable[RawNotice]) -> None:
    notices = list(notices)
    rows = [
        (
            notice.source,
            notice.source_id,
            notice.title,
            notice.body,
            json.dumps(notice.metadata, ensure_ascii=False),
            json.dumps(notice.metadata, ensure_ascii=False),
        )
        for notice in notices
    ]
    conn.executemany(
        """
        INSERT INTO notices (source, source_id, title, body, metadata_json, created_at)
        VALUES (?, ?, ?, ?, ?, COALESCE(json_extract(?, '$.captured_at'), CURRENT_TIMESTAMP))
        ON CONFLICT(source, source_id) DO UPDATE SET
            title=excluded.title,
            body=excluded.body,
            metadata_json=excluded.metadata_json
        """,
        rows,
    )
    conn.executemany(
        """
        INSERT OR IGNORE INTO notice_versions (
            source, source_id, content_hash, title, body, metadata_json, vault_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                notice.source,
                notice.source_id,
                hashlib.sha256(f"{notice.title} {notice.body}".encode("utf-8")).hexdigest()[:16],
                notice.title,
                notice.body,
                json.dumps(notice.metadata, ensure_ascii=False),
                notice.metadata.get("vault_path"),
            )
            for notice in notices
        ],
    )
    conn.commit()


def save_snapshots(conn: sqlite3.Connection, snapshots: Iterable[NoticeSnapshot]) -> None:
    conn.executemany(
        """
        INSERT OR REPLACE INTO notice_snapshots (
            source, source_id, version_id, captured_at, content_hash, normalized_text
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (
                snapshot.source,
                snapshot.source_id,
                snapshot.version_id,
                snapshot.captured_at,
                snapshot.content_hash,
                snapshot.normalized_text,
            )
            for snapshot in snapshots
        ],
    )
    conn.commit()


def get_counts(conn: sqlite3.Connection) -> dict:
    tables = ["collection_runs", "notices", "notice_snapshots", "companies"]
    counts = {}
    for table in tables:
        counts[table] = conn.execute(f"SELECT COUNT(*) AS total FROM {table}").fetchone()["total"]
    return counts


def get_latest_runs(conn: sqlite3.Connection, limit: int = 5) -> List[sqlite3.Row]:
    rows = conn.execute(
        """
        SELECT source_name, collected_count, source_fingerprint, layout_changed, collected_at
        FROM collection_runs
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return list(rows)


def upsert_company(conn: sqlite3.Connection, company: CompanyProfile) -> None:
    conn.execute(
        """
        INSERT INTO companies (
            company_id, legal_name, target_regions_json, cnaes_json, capabilities_json,
            certificates_json, certificate_expirations_json, portfolio_keywords_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(company_id) DO UPDATE SET
            legal_name=excluded.legal_name,
            target_regions_json=excluded.target_regions_json,
            cnaes_json=excluded.cnaes_json,
            capabilities_json=excluded.capabilities_json,
            certificates_json=excluded.certificates_json,
            certificate_expirations_json=excluded.certificate_expirations_json,
            portfolio_keywords_json=excluded.portfolio_keywords_json
        """,
        (
            company.company_id,
            company.legal_name,
            json.dumps(company.target_regions, ensure_ascii=False),
            json.dumps(company.cnaes, ensure_ascii=False),
            json.dumps(company.capabilities, ensure_ascii=False),
            json.dumps(company.certificates, ensure_ascii=False),
            json.dumps(company.certificate_expirations, ensure_ascii=False),
            json.dumps(company.portfolio_keywords, ensure_ascii=False),
        ),
    )
    conn.commit()


def save_notice_rankings(conn: sqlite3.Connection, rankings: Iterable[NoticeRanking]) -> None:
    conn.executemany(
        """
        INSERT INTO notice_rankings (
            source_id, title, final_score, priority_bucket, reasons_json, personal_fit, gemini_analysis
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                ranking.source_id,
                ranking.title,
                ranking.final_score,
                ranking.priority_bucket,
                json.dumps(ranking.reasons, ensure_ascii=False),
                ranking.personal_fit,
                ranking.gemini_analysis,
            )
            for ranking in rankings
        ],
    )
    conn.commit()


def get_operation_job_summary(conn: sqlite3.Connection) -> dict:
    rows = conn.execute(
        "SELECT status, COUNT(*) AS total FROM operation_jobs GROUP BY status"
    ).fetchall()
    summary = {"pending": 0, "completed": 0, "dead_letter": 0}
    for row in rows:
        status = row[0]
        total = row[1]
        if status in {"queued", "retry"}:
            summary["pending"] += total
        elif status == "completed":
            summary["completed"] += total
        elif status == "dead_letter":
            summary["dead_letter"] += total
    return summary


def get_recent_operation_jobs(conn: sqlite3.Connection, limit: int = 10) -> List[sqlite3.Row]:
    rows = conn.execute(
        """
        SELECT job_id, job_type, attempts, status, last_error, updated_at
        FROM operation_jobs
        ORDER BY updated_at DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return list(rows)


def get_latest_rankings(conn: sqlite3.Connection, limit: int = 10) -> List[sqlite3.Row]:
    rows = conn.execute(
        """
        SELECT source_id, title, final_score, personal_fit, priority_bucket, reasons_json, gemini_analysis, created_at
        FROM notice_rankings
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return list(rows)


def save_pipeline_run(conn: sqlite3.Connection, run_type: str, status: str, summary: dict) -> None:
    conn.execute(
        """
        INSERT INTO pipeline_runs (run_type, status, summary_json)
        VALUES (?, ?, ?)
        """,
        (run_type, status, json.dumps(summary, ensure_ascii=False)),
    )
    conn.commit()


def get_latest_pipeline_runs(conn: sqlite3.Connection, limit: int = 10) -> List[sqlite3.Row]:
    rows = conn.execute(
        """
        SELECT run_type, status, summary_json, created_at
        FROM pipeline_runs
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return list(rows)


def save_pipeline_event(conn: sqlite3.Connection, event_type: str, level: str, message: str, payload: dict | None = None) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS pipeline_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.execute(
        "INSERT INTO pipeline_events (event_type, level, message, payload_json) VALUES (?, ?, ?, ?)",
        (event_type, level, message, json.dumps(payload or {}, ensure_ascii=False)),
    )
    conn.commit()


def get_latest_pipeline_events(conn: sqlite3.Connection, limit: int = 20) -> List[sqlite3.Row]:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS pipeline_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    rows = conn.execute(
        "SELECT event_type, level, message, payload_json, created_at FROM pipeline_events ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return list(rows)


def get_notice_version_summary(conn: sqlite3.Connection, limit: int = 20) -> List[sqlite3.Row]:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS notice_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            source_id TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            metadata_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(source, source_id, content_hash)
        )
        """
    )
    rows = conn.execute(
        """
        SELECT source, source_id, COUNT(*) AS versions, MAX(created_at) AS last_seen
        FROM notice_versions
        GROUP BY source, source_id
        ORDER BY last_seen DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return list(rows)


def get_vault_paths_for_notices(conn: sqlite3.Connection, limit: int = 50) -> List[tuple]:
    rows = conn.execute(
        """
        SELECT source_id, vault_path
        FROM notice_versions
        WHERE vault_path IS NOT NULL
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [(row["source_id"], row["vault_path"]) for row in rows]


def save_notice_feedback(conn: sqlite3.Connection, source_id: str, relevance_score: int, comment: str = "") -> None:
    conn.execute(
        """
        INSERT INTO notice_feedback (source_id, relevance_score, comment)
        VALUES (?, ?, ?)
        ON CONFLICT(source_id) DO UPDATE SET
            relevance_score=excluded.relevance_score,
            comment=excluded.comment,
            created_at=CURRENT_TIMESTAMP
        """,
        (source_id, relevance_score, comment),
    )
    conn.commit()


def update_gemini_analysis(conn: sqlite3.Connection, source_id: str, analysis: str) -> None:
    conn.execute(
        "UPDATE notice_rankings SET gemini_analysis = ? WHERE source_id = ?",
        (analysis, source_id),
    )
    conn.commit()