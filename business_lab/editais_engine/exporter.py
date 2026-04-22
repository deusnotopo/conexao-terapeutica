import csv
import json
from pathlib import Path
from typing import Iterable


def export_rows_to_json(rows: Iterable[dict], output_path: str) -> str:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = list(rows)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(path)


def export_rows_to_csv(rows: Iterable[dict], output_path: str) -> str:
    payload = list(rows)
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    if not payload:
        path.write_text("", encoding="utf-8")
        return str(path)

    fieldnames = list(payload[0].keys())
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(payload)
    return str(path)
