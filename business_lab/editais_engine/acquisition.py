import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List

from models import RawNotice


@dataclass
class SourceConfig:
    name: str
    listing_url: str
    strategy: str
    enabled: bool = True
    metadata: Dict[str, str] = field(default_factory=dict)


@dataclass
class CollectionRun:
    source_name: str
    collected_count: int
    source_fingerprint: str
    layout_changed: bool
    collected_at: str


def compute_source_fingerprint(html: str) -> str:
    normalized = re.sub(r"\s+", " ", html.strip().lower())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def detect_layout_change(previous_fingerprint: str, current_fingerprint: str) -> bool:
    if not previous_fingerprint:
        return False
    return previous_fingerprint != current_fingerprint


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def fetch_remote_payload(url: str, timeout_seconds: int = 20) -> str:
    parsed = urlparse(url)
    if parsed.scheme in {"http", "https"}:
        request = Request(
            url,
            headers={
                "User-Agent": "EditaisEngine/1.0 (+operacao deterministica)",
                "Accept": "application/json,text/html;q=0.9,*/*;q=0.8",
            },
        )
        with urlopen(request, timeout=timeout_seconds) as response:
            return response.read().decode("utf-8", errors="ignore")

    if parsed.scheme == "file":
        file_path = parsed.path
        if re.match(r"^/[A-Za-z]:", file_path):
            file_path = file_path[1:]
        return Path(file_path).read_text(encoding="utf-8")

    raise ValueError(f"Esquema não suportado para coleta remota: {parsed.scheme or 'vazio'}")


def _extract_items(data: dict, items_key: str) -> List[dict]:
    current = data
    for chunk in [part for part in items_key.split(".") if part]:
        current = current.get(chunk, {})
    if isinstance(current, list):
        return current
    return []


def collect_from_json_payload(config: SourceConfig, payload: str) -> List[RawNotice]:
    data = json.loads(payload or "{}")
    items_key = config.metadata.get("items_key", "items")
    items = _extract_items(data, items_key) if isinstance(data, dict) else []
    notices: List[RawNotice] = []

    field_map = {
        "id": config.metadata.get("field_id", "id"),
        "title": config.metadata.get("field_title", "title"),
        "body": config.metadata.get("field_body", "body"),
        "deadline_days": config.metadata.get("field_deadline", "deadline_days"),
        "buyer": config.metadata.get("field_buyer", "buyer"),
    }

    for item in items:
        metadata = {
            "deadline_days": str(item.get(field_map["deadline_days"], 0)),
            "listing_url": config.listing_url,
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "buyer": item.get(field_map["buyer"], ""),
            "source_format": "json",
        }
        notices.append(
            RawNotice(
                source=config.name,
                source_id=str(item.get(field_map["id"], "")).strip(),
                title=str(item.get(field_map["title"], "")).strip(),
                body=str(item.get(field_map["body"], "")).strip(),
                metadata=metadata,
            )
        )

    return [notice for notice in notices if notice.source_id and notice.title]


def collect_from_remote_json(config: SourceConfig) -> List[RawNotice]:
    remote_url = config.metadata.get("remote_url") or config.listing_url
    payload = fetch_remote_payload(remote_url)
    return collect_from_json_payload(config, payload)


def collect_from_html(config: SourceConfig, html: str) -> List[RawNotice]:
    if config.strategy != "mock_portal_v1":
        raise ValueError(f"Estratégia não suportada: {config.strategy}")

    notices: List[RawNotice] = []
    pattern = re.compile(
        r'<article\s+data-id="(?P<id>[^"]+)">\s*<h2>(?P<title>.*?)</h2>\s*<p>(?P<body>.*?)</p>\s*<span\s+class="deadline">(?P<deadline>\d+)</span>',
        flags=re.IGNORECASE | re.DOTALL,
    )

    for match in pattern.finditer(html):
        notices.append(
            RawNotice(
                source=config.name,
                source_id=match.group("id"),
                title=_strip_html(match.group("title")),
                body=_strip_html(match.group("body")),
                metadata={
                    "deadline_days": match.group("deadline"),
                    "listing_url": config.listing_url,
                    "captured_at": datetime.now(timezone.utc).isoformat(),
                },
            )
        )

    return notices


def run_collection_cycle(
    configs: List[SourceConfig],
    html_by_source: Dict[str, str],
    previous_fingerprints: Dict[str, str] | None = None,
) -> tuple[List[RawNotice], List[CollectionRun]]:
    previous_fingerprints = previous_fingerprints or {}
    collected_notices: List[RawNotice] = []
    runs: List[CollectionRun] = []

    for config in configs:
        if not config.enabled:
            continue

        html = html_by_source.get(config.name, "")
        fingerprint = compute_source_fingerprint(html)
        layout_changed = detect_layout_change(previous_fingerprints.get(config.name, ""), fingerprint)
        if config.strategy == "mock_portal_v1":
            notices = collect_from_html(config, html)
        elif config.strategy == "mock_json_api_v1":
            notices = collect_from_json_payload(config, html)
        elif config.strategy == "http_json_v1":
            remote_url = config.metadata.get("remote_url") or config.listing_url
            payload = fetch_remote_payload(remote_url)
            fingerprint = compute_source_fingerprint(payload)
            layout_changed = detect_layout_change(previous_fingerprints.get(config.name, ""), fingerprint)
            notices = collect_from_json_payload(config, payload)
        else:
            raise ValueError(f"Estratégia não suportada: {config.strategy}")
        collected_notices.extend(notices)

        runs.append(
            CollectionRun(
                source_name=config.name,
                collected_count=len(notices),
                source_fingerprint=fingerprint,
                layout_changed=layout_changed,
                collected_at=datetime.now(timezone.utc).isoformat(),
            )
        )

    return collected_notices, runs