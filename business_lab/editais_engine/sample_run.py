from acquisition import SourceConfig, run_collection_cycle
from document_ingestion import ingest_text_content, merge_document_text
from engine import (
    assess_company_readiness,
    build_decision_packet,
    build_readiness_report,
    create_snapshot,
    diff_snapshots,
    parse_notice,
    rank_notice_for_operation,
    score_notice,
    simulate_bid_decision,
)
from models import RawNotice
from profiles import (
    DEFAULT_BID_POLICY,
    DEFAULT_OPERATIONAL_CONTEXT,
    ENGINEERING_COMPANY_PROFILE,
    ENGINEERING_SERVICES_PROFILE,
)
from persistence import (
    get_connection,
    get_counts,
    get_latest_rankings,
    get_latest_runs,
    init_db,
    save_collection_runs,
    save_notice_rankings,
    save_snapshots,
    upsert_company,
    upsert_notices,
)
from operations import Job, SQLiteJobQueue, build_default_handlers


def main():
    html_portal_v1 = """
    <section id="notices">
      <article data-id="edital-001">
        <h2>Contratação de serviços de manutenção predial e reforma de unidades administrativas</h2>
        <p>Edital para contratação de empresa de engenharia para manutenção predial, reforma e adequações. Valor estimado de R$ 780.000,00. Exige certidão fiscal, atestado técnico, capacidade operacional e balanço patrimonial. Execução no estado de SP.</p>
        <span class="deadline">12</span>
      </article>
      <article data-id="edital-002">
        <h2>Aquisição de medicamentos hospitalares</h2>
        <p>Compra emergencial de medicamentos. Execução no estado de RJ. Valor estimado de R$ 210.000,00.</p>
        <span class="deadline">4</span>
      </article>
    </section>
    """

    html_portal_v2 = """
    <section id="notices">
      <article data-id="edital-001">
        <h2>Retificação - Contratação de serviços de manutenção predial e reforma de unidades administrativas</h2>
        <p>Retificação do edital para contratação de empresa de engenharia para manutenção predial, reforma e adequações. Valor estimado de R$ 780.000,00. Exige certidão fiscal, atestado técnico, capacidade operacional e balanço patrimonial. Execução no estado de SP. Prazo em menor prazo por urgência administrativa.</p>
        <span class="deadline">5</span>
      </article>
    </section>
    """

    json_api_payload = """
    {
      "items": [
        {
          "id": "edital-003",
          "title": "Serviços de retrofit elétrico e adequação predial em campus público",
          "body": "Contratação de empresa de engenharia para retrofit elétrico, adequações prediais e atualização de infraestrutura crítica. Valor estimado de R$ 1.240.000,00. Exige certidão fiscal, atestado técnico, capacidade operacional e balanço patrimonial. Execução no estado de SP.",
          "deadline_days": 14,
          "buyer": "Universidade Pública Exemplo"
        }
      ]
    }
    """

    source = SourceConfig(
        name="portal_exemplo",
        listing_url="https://portal-exemplo.local/editais",
        strategy="mock_portal_v1",
    )
    json_source = SourceConfig(
        name="api_exemplo",
        listing_url="https://api-exemplo.local/notices",
        strategy="mock_json_api_v1",
    )

    collected_v1, runs_v1 = run_collection_cycle(
        [source, json_source],
        {"portal_exemplo": html_portal_v1, "api_exemplo": json_api_payload},
    )
    collected_v2, runs_v2 = run_collection_cycle(
        [source, json_source],
        {"portal_exemplo": html_portal_v2, "api_exemplo": json_api_payload},
        previous_fingerprints={"portal_exemplo": runs_v1[0].source_fingerprint},
    )

    raw_v1 = next(item for item in collected_v1 if item.source_id == "edital-001")
    raw_v2 = next(item for item in collected_v2 if item.source_id == "edital-001")

    edital_principal = ingest_text_content(
        "edital_principal.html",
        raw_v2.body,
        source_type="html",
    )
    termo_referencia = ingest_text_content(
        "termo_referencia.txt",
        "Termo de Referência;Prazo;5 dias\nPlanilha;Valor estimado;R$ 780.000,00\nExige certidão fiscal e atestado técnico.",
        source_type="txt",
    )
    anexo_scan = ingest_text_content(
        "anexo_escaneado.pdf",
        "Capacidade operacional e balanço patrimonial para habilitação.",
        source_type="pdf_scan",
    )
    merged_body = merge_document_text([edital_principal, termo_referencia, anexo_scan])
    raw_v2.body = merged_body

    snapshot_v1 = create_snapshot(raw_v1, version_id="v1")
    snapshot_v2 = create_snapshot(raw_v2, version_id="v2")
    diff = diff_snapshots(snapshot_v1, snapshot_v2)

    conn = get_connection()
    init_db(conn)
    save_collection_runs(conn, runs_v1 + runs_v2)
    upsert_notices(conn, collected_v1 + collected_v2)
    upsert_company(conn, ENGINEERING_COMPANY_PROFILE)
    save_snapshots(conn, [snapshot_v1, snapshot_v2])
    counts = get_counts(conn)
    latest_runs = get_latest_runs(conn)

    parsed = parse_notice(raw_v2)
    scored = score_notice(parsed, ENGINEERING_SERVICES_PROFILE)
    packet = build_decision_packet(scored)
    readiness = build_readiness_report(scored, ENGINEERING_SERVICES_PROFILE)
    company_status = assess_company_readiness(ENGINEERING_COMPANY_PROFILE, scored)
    bid_analysis = simulate_bid_decision(
        scored,
        readiness,
        company_status=company_status,
        policy=DEFAULT_BID_POLICY,
        ops=DEFAULT_OPERATIONAL_CONTEXT,
    )

    queue = SQLiteJobQueue(conn)
    queue.enqueue(Job(job_id="job-collect-001", job_type="collect_notice", payload={"source": "portal_exemplo"}))
    queue.enqueue(Job(job_id="job-parse-001", job_type="parse_notice", payload={"notice_id": raw_v2.source_id}))
    queue.enqueue(Job(job_id="job-score-001", job_type="score_notice", payload={"notice_id": raw_v2.source_id, "simulate_failure": "true"}))
    queue_results_first_pass = queue.process(build_default_handlers())
    queue_results_second_pass = queue.process(build_default_handlers())
    queue_results_third_pass = queue.process(build_default_handlers())
    queue_summary = queue.summarize()
    ranking = rank_notice_for_operation(scored, readiness, bid_analysis)
    save_notice_rankings(conn, [ranking])
    latest_rankings = get_latest_rankings(conn)

    print("=== EDITAIS ENGINE AKITA MODE ===")
    print(f"DB counts: runs={counts['collection_runs']} notices={counts['notices']} snapshots={counts['notice_snapshots']}")
    print(f"Coleta v1: {runs_v1[0].collected_count} editais | fingerprint: {runs_v1[0].source_fingerprint}")
    print(
        f"Coleta v2: {runs_v2[0].collected_count} editais | fingerprint: {runs_v2[0].source_fingerprint} | layout_changed: {runs_v2[0].layout_changed}"
    )
    print(
        f"Docs ingeridos: {edital_principal.doc_type}, {termo_referencia.doc_type}, {anexo_scan.doc_type} | tabelas={len(termo_referencia.tables)} | warnings_scan={len(anexo_scan.warnings)}"
    )
    print(f"Hash atual: {snapshot_v2.content_hash}")
    print(f"Título: {scored.parsed.title}")
    print(f"Região: {scored.parsed.region}")
    print(f"Valor estimado: R$ {scored.parsed.estimated_value:,.2f}")
    print(f"Prazo: {scored.parsed.deadline_days} dias")
    print(f"Tags: {', '.join(scored.parsed.tags) or 'nenhuma'}")
    print(f"Score: {scored.score}")
    print(f"Decisão: {scored.decision}")
    print(f"Resumo executivo: {packet.executive_summary}")
    print(f"Readiness: {readiness.readiness_level} ({readiness.readiness_score})")
    print(f"Empresa elegível: {company_status.eligible} | fit empresa: {company_status.capability_match_score}")
    print(f"Bid/no-bid: {bid_analysis.bid_decision}")
    print(f"Viabilidade: {bid_analysis.viability_score}")
    print(f"Ranking operacional: {ranking.priority_bucket} ({ranking.final_score})")
    print(f"Esforço estimado: {bid_analysis.estimated_effort_hours}h")
    print(f"Risco: {bid_analysis.risk_level}")
    print(f"Faixa de margem esperada: {bid_analysis.expected_margin_band}")
    print(f"Política: margem>={DEFAULT_BID_POLICY.minimum_margin_percent}% | esforço<={DEFAULT_BID_POLICY.maximum_effort_hours}h")
    print("\nMudanças detectadas:")
    print(f"- Campos alterados: {', '.join(diff.changed_fields) or 'nenhum'}")
    print(f"- Tokens adicionados: {', '.join(diff.added_tokens[:10]) or 'nenhum'}")
    print(f"- Tokens removidos: {', '.join(diff.removed_tokens[:10]) or 'nenhum'}")
    print("\nMotivos:")
    for item in scored.reasons:
        print(f"- {item}")
    print("\nChecklist:")
    for item in scored.checklist:
        print(f"- {item}")
    print("\nReadiness - pendências:")
    for item in readiness.missing_documents or ["nenhuma"]:
        print(f"- {item}")
    print("\nReadiness - ações recomendadas:")
    for item in readiness.recommended_actions:
        print(f"- {item}")
    print("\nEmpresa - bloqueios:")
    for item in company_status.blockers or ["nenhum"]:
        print(f"- {item}")
    print("\nEmpresa - certidões expiradas / vencendo:")
    for item in company_status.expired_certificates or ["nenhuma expirada"]:
        print(f"- {item}")
    for item in company_status.expiring_certificates or ["nenhuma vencendo"]:
        print(f"- {item}")
    print("\nContexto operacional:")
    print(f"- capacidade disponível: {DEFAULT_OPERATIONAL_CONTEXT.available_team_capacity_hours}h")
    print(f"- bids concorrentes: {DEFAULT_OPERATIONAL_CONTEXT.concurrent_bids}")
    print(f"- risco jurídico: {', '.join(DEFAULT_OPERATIONAL_CONTEXT.legal_risk_flags)}")
    print("\nCaminho crítico:")
    for item in packet.critical_path:
        print(f"- {item}")
    print("\nRacional bid/no-bid:")
    for item in bid_analysis.rationale:
        print(f"- {item}")
    print("\nRacional de ranking:")
    for item in ranking.reasons:
        print(f"- {item}")
    print("\nÚltimas coletas persistidas:")
    for row in latest_runs:
        print(
            f"- fonte={row['source_name']} itens={row['collected_count']} layout_changed={bool(row['layout_changed'])} fingerprint={row['source_fingerprint']}"
        )
    print("\nÚltimos rankings persistidos:")
    for row in latest_rankings:
        print(
            f"- {row['source_id']} | bucket={row['priority_bucket']} | score={row['final_score']} | titulo={row['title']}"
        )
    print("\nFila operacional:")
    for result in queue_results_first_pass + queue_results_second_pass + queue_results_third_pass:
        print(f"- {result.job_id}: success={result.success} | {result.message}")
    print(
        f"Resumo fila: pending={queue_summary['pending']} completed={queue_summary['completed']} dead_letter={queue_summary['dead_letter']}"
    )

    conn.close()
    return {
        "decision": scored.decision,
        "bid_decision": bid_analysis.bid_decision,
        "ranking_bucket": ranking.priority_bucket,
        "ranking_score": ranking.final_score,
        "queue_pending": queue_summary["pending"],
        "queue_completed": queue_summary["completed"],
        "queue_dead_letter": queue_summary["dead_letter"],
        "notice_id": scored.parsed.source_id,
    }


if __name__ == "__main__":
    main()