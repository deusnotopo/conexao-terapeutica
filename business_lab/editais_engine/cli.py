import argparse
import json
from pathlib import Path

from acquisition import SourceConfig, run_collection_cycle
from document_ingestion import ingest_file
from exporter import export_rows_to_csv, export_rows_to_json
from persistence import (
    get_connection,
    get_latest_pipeline_events,
    get_latest_pipeline_runs,
    get_latest_rankings,
    get_notice_version_summary,
    get_operation_job_summary,
    get_recent_operation_jobs,
    save_pipeline_run,
    save_collection_runs,
    save_pipeline_event,
    upsert_notices,
)
from profiles import load_profile_registry
from sample_run import main as run_demo


def command_demo(_: argparse.Namespace) -> int:
    run_demo()
    return 0


def command_cron(args: argparse.Namespace) -> int:
    summary = run_demo()
    conn = get_connection(args.db)
    save_pipeline_run(conn, run_type="cron", status="success", summary=summary)
    save_pipeline_event(conn, "cron", "info", "Ciclo cron executado com sucesso", summary)
    export_target = export_rows_to_json([summary], str(Path(args.db).parent / "out" / "last_run.json"))
    save_pipeline_event(conn, "cron_export", "info", f"Resumo operacional exportado em {export_target}", {"path": export_target})
    print("=== CRON EXECUTADO ===")
    print(json.dumps(summary, ensure_ascii=False))
    conn.close()
    return 0


def command_status(args: argparse.Namespace) -> int:
    conn = get_connection(args.db)
    summary = get_operation_job_summary(conn)
    jobs = get_recent_operation_jobs(conn, limit=args.limit)

    print("=== STATUS OPERACIONAL ===")
    print(
        f"pending={summary['pending']} completed={summary['completed']} dead_letter={summary['dead_letter']}"
    )
    print("\nÚltimos jobs:")
    for row in jobs:
        error = row[4] or "-"
        print(
            f"- {row[0]} | tipo={row[1]} | attempts={row[2]} | status={row[3]} | erro={error}"
        )

    conn.close()
    return 0


def command_report(args: argparse.Namespace) -> int:
    conn = get_connection(args.db)
    rankings = get_latest_rankings(conn, limit=args.limit)

    print("=== RELATORIO DE PRIORIZACAO ===")
    for row in rankings:
        print(
            f"- {row['source_id']} | bucket={row['priority_bucket']} | score={row['final_score']} | titulo={row['title']}"
        )

    conn.close()
    return 0


def command_runs(args: argparse.Namespace) -> int:
    conn = get_connection(args.db)
    runs = get_latest_pipeline_runs(conn, limit=args.limit)

    print("=== HISTORICO DE RUNS ===")
    for row in runs:
        print(f"- tipo={row['run_type']} | status={row['status']} | created_at={row['created_at']}")
        print(f"  summary={row['summary_json']}")

    conn.close()
    return 0


def command_collect_live(args: argparse.Namespace) -> int:
    config = SourceConfig(
        name=args.source_name,
        listing_url=args.url,
        strategy="http_json_v1",
        metadata={
            "remote_url": args.url,
            "items_key": args.items_key,
            "field_id": args.field_id,
            "field_title": args.field_title,
            "field_body": args.field_body,
            "field_deadline": args.field_deadline,
            "field_buyer": args.field_buyer,
        },
    )
    notices, runs = run_collection_cycle([config], {})
    conn = get_connection(args.db)
    save_collection_runs(conn, runs)
    upsert_notices(conn, notices)
    save_pipeline_event(
        conn,
        "collect_live",
        "info",
        f"Coleta live executada para {args.source_name}",
        {"source": args.source_name, "notices": len(notices), "fingerprint": runs[0].source_fingerprint},
    )

    print("=== COLETA REAL JSON ===")
    print(f"source={args.source_name} notices={len(notices)} fingerprint={runs[0].source_fingerprint}")
    for notice in notices[: args.limit]:
        print(f"- {notice.source_id} | {notice.title}")

    conn.close()
    return 0


def command_export(args: argparse.Namespace) -> int:
    conn = get_connection(args.db)
    rankings = get_latest_rankings(conn, limit=args.limit)
    rows = [
        {
            "source_id": row["source_id"],
            "title": row["title"],
            "final_score": row["final_score"],
            "priority_bucket": row["priority_bucket"],
            "created_at": row["created_at"],
        }
        for row in rankings
    ]
    if args.format == "json":
        target = export_rows_to_json(rows, args.output)
    else:
        target = export_rows_to_csv(rows, args.output)
    save_pipeline_event(conn, "export", "info", f"Export gerado em {target}", {"format": args.format})
    print(f"EXPORT_OK {target}")
    conn.close()
    return 0


def command_events(args: argparse.Namespace) -> int:
    conn = get_connection(args.db)
    events = get_latest_pipeline_events(conn, limit=args.limit)
    print("=== EVENTOS DO PIPELINE ===")
    for row in events:
        print(f"- {row['created_at']} | {row['level']} | {row['event_type']} | {row['message']}")
    conn.close()
    return 0


def command_versions(args: argparse.Namespace) -> int:
    conn = get_connection(args.db)
    rows = get_notice_version_summary(conn, limit=args.limit)
    print("=== VERSOES DE NOTICE ===")
    for row in rows:
        print(f"- {row['source']} | {row['source_id']} | versions={row['versions']} | last_seen={row['last_seen']}")
    conn.close()
    return 0


def command_profiles(_: argparse.Namespace) -> int:
    registry = load_profile_registry()
    print("=== PERFIS DISPONIVEIS ===")
    for name, profile in registry.items():
        print(f"- {name} | regioes={','.join(profile.target_regions)} | prazo_min={profile.minimum_deadline_days}")
    return 0


def command_scheduler(_: argparse.Namespace) -> int:
    script = 'schtasks /Create /SC DAILY /TN "EditaisEngineCron" /TR "python D:\\business_lab\\editais_engine\\cli.py cron --db D:\\business_lab\\editais_engine\\editais.db" /ST 07:00'
    print("=== TASK SCHEDULER ===")
    print(script)
    return 0


def command_ingest_file(args: argparse.Namespace) -> int:
    document = ingest_file(args.path)
    result = {
        "file_name": document.file_name,
        "doc_type": document.doc_type,
        "source_type": document.source_type,
        "warnings": document.warnings,
        "table_count": len(document.tables),
        "text_preview": document.extracted_text[:300],
    }
    print("=== INGEST FILE ===")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="CLI operacional do Editais Engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    demo_parser = subparsers.add_parser("demo", help="Executa o fluxo demonstrativo completo")
    demo_parser.set_defaults(func=command_demo)

    cron_parser = subparsers.add_parser("cron", help="Executa um ciclo e registra histórico operacional")
    cron_parser.add_argument(
        "--db",
        default=str(Path("business_lab/editais_engine/editais.db")),
        help="Caminho do banco SQLite",
    )
    cron_parser.set_defaults(func=command_cron)

    status_parser = subparsers.add_parser("status", help="Exibe resumo operacional da fila persistida")
    status_parser.add_argument(
        "--db",
        default=str(Path("business_lab/editais_engine/editais.db")),
        help="Caminho do banco SQLite",
    )
    status_parser.add_argument("--limit", type=int, default=10, help="Quantidade de jobs no relatório")
    status_parser.set_defaults(func=command_status)

    report_parser = subparsers.add_parser("report", help="Exibe os últimos rankings operacionais")
    report_parser.add_argument(
        "--db",
        default=str(Path("business_lab/editais_engine/editais.db")),
        help="Caminho do banco SQLite",
    )
    report_parser.add_argument("--limit", type=int, default=10, help="Quantidade de rankings no relatório")
    report_parser.set_defaults(func=command_report)

    runs_parser = subparsers.add_parser("runs", help="Exibe histórico de execuções do pipeline")
    runs_parser.add_argument(
        "--db",
        default=str(Path("business_lab/editais_engine/editais.db")),
        help="Caminho do banco SQLite",
    )
    runs_parser.add_argument("--limit", type=int, default=10, help="Quantidade de runs no relatório")
    runs_parser.set_defaults(func=command_runs)

    live_parser = subparsers.add_parser("collect-live", help="Coleta real de um endpoint JSON")
    live_parser.add_argument("--url", required=True, help="URL http(s) ou file:// da fonte JSON")
    live_parser.add_argument("--source-name", default="fonte_real", help="Nome lógico da fonte")
    live_parser.add_argument("--db", default=str(Path("business_lab/editais_engine/editais.db")), help="Caminho do banco SQLite")
    live_parser.add_argument("--items-key", default="items", help="Caminho do array no JSON, ex: data.items")
    live_parser.add_argument("--field-id", default="id")
    live_parser.add_argument("--field-title", default="title")
    live_parser.add_argument("--field-body", default="body")
    live_parser.add_argument("--field-deadline", default="deadline_days")
    live_parser.add_argument("--field-buyer", default="buyer")
    live_parser.add_argument("--limit", type=int, default=10)
    live_parser.set_defaults(func=command_collect_live)

    export_parser = subparsers.add_parser("export", help="Exporta ranking operacional para CSV ou JSON")
    export_parser.add_argument("--db", default=str(Path("business_lab/editais_engine/editais.db")))
    export_parser.add_argument("--format", choices=["csv", "json"], default="json")
    export_parser.add_argument("--output", required=True)
    export_parser.add_argument("--limit", type=int, default=50)
    export_parser.set_defaults(func=command_export)

    events_parser = subparsers.add_parser("events", help="Exibe eventos/auditoria do pipeline")
    events_parser.add_argument("--db", default=str(Path("business_lab/editais_engine/editais.db")))
    events_parser.add_argument("--limit", type=int, default=20)
    events_parser.set_defaults(func=command_events)

    versions_parser = subparsers.add_parser("versions", help="Resumo de versionamento/deduplicação dos notices")
    versions_parser.add_argument("--db", default=str(Path("business_lab/editais_engine/editais.db")))
    versions_parser.add_argument("--limit", type=int, default=20)
    versions_parser.set_defaults(func=command_versions)

    profiles_parser = subparsers.add_parser("profiles", help="Lista perfis operacionais por vertical")
    profiles_parser.set_defaults(func=command_profiles)

    scheduler_parser = subparsers.add_parser("scheduler", help="Imprime comando oficial para Windows Task Scheduler")
    scheduler_parser.set_defaults(func=command_scheduler)

    ingest_parser = subparsers.add_parser("ingest-file", help="Testa ingestão real de PDF/planilha/anexo")
    ingest_parser.add_argument("--path", required=True)
    ingest_parser.set_defaults(func=command_ingest_file)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())