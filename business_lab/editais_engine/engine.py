import hashlib
import re
import unicodedata
from datetime import datetime, timezone
from typing import List

from models import (
    BidAnalysis,
    BidPolicy,
    CompanyProfile,
    CompanyReadinessStatus,
    DecisionPacket,
    OperationalContext,
    NoticeDiff,
    NoticeRanking,
    NoticeSnapshot,
    ParsedNotice,
    Profile,
    RawNotice,
    ReadinessReport,
    ScoredNotice,
)


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def create_snapshot(raw: RawNotice, version_id: str = "v1") -> NoticeSnapshot:
    normalized = normalize_text(f"{raw.title} {raw.body}")
    content_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]
    return NoticeSnapshot(
        source=raw.source,
        source_id=raw.source_id,
        version_id=version_id,
        captured_at=datetime.now(timezone.utc).isoformat(),
        content_hash=content_hash,
        normalized_text=normalized,
    )


def diff_snapshots(previous: NoticeSnapshot, current: NoticeSnapshot) -> NoticeDiff:
    previous_tokens = set(previous.normalized_text.split())
    current_tokens = set(current.normalized_text.split())
    added = sorted(current_tokens - previous_tokens)
    removed = sorted(previous_tokens - current_tokens)

    changed_fields = []
    if previous.content_hash != current.content_hash:
        changed_fields.append("content")

    return NoticeDiff(
        previous_version_id=previous.version_id,
        current_version_id=current.version_id,
        added_tokens=added[:25],
        removed_tokens=removed[:25],
        changed_fields=changed_fields,
    )


def _extract_region(text: str) -> str:
    text_upper = f" {normalize_text(text).upper()} "
    for region in ["SP", "RJ", "MG", "ES", "PR", "SC", "RS", "BA", "GO", "DF"]:
        if f" {region} " in text_upper or f"ESTADO DE {region}" in text_upper:
            return region
    return "N/A"


def _extract_value(text: str) -> float:
    match = re.search(r"R\$\s*([\d\.]+,\d{2})", text, flags=re.IGNORECASE)
    if not match:
        return 0.0
    value = match.group(1).replace(".", "").replace(",", ".")
    return float(value)


def _extract_deadline_days(metadata: dict) -> int:
    raw = metadata.get("deadline_days", "0")
    try:
        return int(raw)
    except ValueError:
        return 0


def _extract_docs(text: str) -> List[str]:
    docs = []
    lowered = normalize_text(text)
    doc_map = {
        "certidao": "certidoes_fiscais",
        "atestado": "atestados_tecnicos",
        "balanco": "balanco_patrimonial",
        "capacidade operacional": "capacidade_operacional",
    }
    for key, value in doc_map.items():
        if key in lowered:
            docs.append(value)
    return sorted(set(docs))


def _extract_tags(text: str) -> List[str]:
    possible_tags = [
        "engenharia",
        "manutencao",
        "predial",
        "obra",
        "reforma",
        "medicamento",
        "merenda",
        "combustivel",
        "limpeza",
        "ti",
    ]
    lowered = normalize_text(text)
    return [tag for tag in possible_tags if tag in lowered]


def parse_notice(raw: RawNotice) -> ParsedNotice:
    combined = f"{raw.title} {raw.body}"
    risk_flags = []
    normalized = normalize_text(combined)
    if "menor prazo" in normalized or "urgencia" in normalized:
        risk_flags.append("prazo_critico")
    if "retificacao" in normalized:
        risk_flags.append("retificacao")

    return ParsedNotice(
        source=raw.source,
        source_id=raw.source_id,
        title=raw.title,
        object_text=raw.body[:300],
        region=_extract_region(combined),
        estimated_value=_extract_value(combined),
        deadline_days=_extract_deadline_days(raw.metadata),
        required_docs=_extract_docs(combined),
        tags=_extract_tags(combined),
        risk_flags=risk_flags,
    )


def score_notice(parsed: ParsedNotice, profile: Profile) -> ScoredNotice:
    score = 0.0
    reasons = []
    checklist = []

    if parsed.region in profile.target_regions:
        score += 20
        reasons.append(f"Região alvo: {parsed.region}")
    else:
        reasons.append(f"Região fora do alvo: {parsed.region}")

    positive_hits = [tag for tag in parsed.tags if tag in profile.positive_tags]
    negative_hits = [tag for tag in parsed.tags if tag in profile.negative_tags]
    score += len(positive_hits) * 12
    score -= len(negative_hits) * 20
    if positive_hits:
        reasons.append(f"Tags aderentes: {', '.join(positive_hits)}")
    if negative_hits:
        reasons.append(f"Tags negativas: {', '.join(negative_hits)}")

    if profile.minimum_value <= parsed.estimated_value <= profile.maximum_value:
        score += 20
        reasons.append(f"Faixa de valor adequada: R$ {parsed.estimated_value:,.2f}")
    else:
        reasons.append(f"Faixa de valor ruim: R$ {parsed.estimated_value:,.2f}")

    if parsed.deadline_days >= profile.minimum_deadline_days:
        score += 15
        reasons.append(f"Prazo viável: {parsed.deadline_days} dias")
    else:
        score -= 15
        reasons.append(f"Prazo apertado: {parsed.deadline_days} dias")

    matched_capabilities = [doc for doc in parsed.required_docs if doc in profile.required_capabilities]
    missing_capabilities = [doc for doc in profile.required_capabilities if doc not in parsed.required_docs]
    score += len(matched_capabilities) * 8
    if matched_capabilities:
        reasons.append(f"Documentos/capacidades alinhados: {', '.join(matched_capabilities)}")
    if missing_capabilities:
        checklist.extend([f"Validar {item}" for item in missing_capabilities])

    if "prazo_critico" in parsed.risk_flags:
        score -= 10
        checklist.append("Revisar urgência e capacidade de resposta")
    if "retificacao" in parsed.risk_flags:
        score -= 5
        checklist.append("Comparar retificação com versão anterior")

    if score >= 55:
        decision = "entrar"
    elif score >= 30:
        decision = "entrar_com_ressalvas"
    else:
        decision = "nao_entrar"

    if not checklist:
        checklist.append("Confirmar documentação mínima e responsável interno")

    return ScoredNotice(
        parsed=parsed,
        score=score,
        decision=decision,
        reasons=reasons,
        checklist=checklist,
    )


def build_decision_packet(scored: ScoredNotice) -> DecisionPacket:
    if scored.decision == "entrar":
        summary = "Edital aderente, com valor e prazo compatíveis. Vale avançar para preparação operacional."
    elif scored.decision == "entrar_com_ressalvas":
        summary = "Edital potencialmente aderente, mas exige validações adicionais antes de seguir."
    else:
        summary = "Edital com baixa aderência. Melhor não consumir energia comercial e operacional nele."

    critical_path = [
        "Confirmar aderência técnica e documental",
        "Validar prazo interno de montagem",
        "Confirmar responsável por proposta",
        "Emitir kit inicial de submissão",
    ]

    if "Comparar retificação com versão anterior" in scored.checklist:
        critical_path.insert(0, "Executar diff entre versões do edital")

    return DecisionPacket(
        title=scored.parsed.title,
        decision=scored.decision,
        score=scored.score,
        executive_summary=summary,
        reasons=scored.reasons,
        checklist=scored.checklist,
        critical_path=critical_path,
    )


def build_readiness_report(scored: ScoredNotice, profile: Profile) -> ReadinessReport:
    missing_documents = [
        capability for capability in profile.required_capabilities if capability not in scored.parsed.required_docs
    ]

    blocking_items = []
    recommended_actions = []
    readiness_score = 100.0

    if missing_documents:
        readiness_score -= len(missing_documents) * 18
        blocking_items.append("Documentação crítica incompleta")
        recommended_actions.extend([f"Providenciar evidência para {item}" for item in missing_documents])

    if scored.parsed.deadline_days < profile.minimum_deadline_days:
        readiness_score -= 20
        blocking_items.append("Prazo abaixo do mínimo operacional")
        recommended_actions.append("Montar força-tarefa e validar janela real de submissão")

    if "retificacao" in scored.parsed.risk_flags:
        readiness_score -= 10
        blocking_items.append("Edital sofreu retificação")
        recommended_actions.append("Executar comparação formal entre versões do edital")

    if scored.parsed.region not in profile.target_regions:
        readiness_score -= 10
        recommended_actions.append("Validar estratégia regional e logística de atendimento")

    readiness_score = max(0.0, readiness_score)

    if readiness_score >= 80:
        readiness_level = "alta"
    elif readiness_score >= 55:
        readiness_level = "media"
    else:
        readiness_level = "baixa"

    if not recommended_actions:
        recommended_actions.append("Seguir para montagem do kit operacional de proposta")

    return ReadinessReport(
        readiness_score=readiness_score,
        readiness_level=readiness_level,
        missing_documents=missing_documents,
        blocking_items=blocking_items,
        recommended_actions=recommended_actions,
    )


def simulate_bid_decision(
    scored: ScoredNotice,
    readiness: ReadinessReport,
    company_status: CompanyReadinessStatus | None = None,
    policy: BidPolicy | None = None,
    ops: OperationalContext | None = None,
) -> BidAnalysis:
    company_fit = company_status.capability_match_score if company_status else 70.0
    viability_score = scored.score * 0.45 + readiness.readiness_score * 0.25 + company_fit * 0.30
    estimated_effort_hours = 6 + len(scored.parsed.required_docs) * 4

    if scored.parsed.deadline_days <= 5:
        estimated_effort_hours += 10
    if "retificacao" in scored.parsed.risk_flags:
        estimated_effort_hours += 6
    if ops:
        estimated_effort_hours += ops.concurrent_bids * 2

    rationale = []
    if scored.decision == "entrar":
        rationale.append("Aderência comercial e técnica inicialmente favorável")
    elif scored.decision == "entrar_com_ressalvas":
        rationale.append("Aderência parcial, exigindo saneamento operacional")
    else:
        rationale.append("Aderência baixa para justificar esforço de proposta")

    if readiness.readiness_level == "alta":
        rationale.append("Readiness alto, com poucas travas para submissão")
    elif readiness.readiness_level == "media":
        rationale.append("Readiness intermediário, dependendo de ajustes rápidos")
    else:
        rationale.append("Readiness baixo, com gargalos relevantes")

    expected_margin_percent = 0.0
    if scored.parsed.estimated_value > 0:
        base = ops.estimated_cost_base if ops else scored.parsed.estimated_value * 0.88
        expected_margin_percent = max(0.0, ((scored.parsed.estimated_value - base) / scored.parsed.estimated_value) * 100)

    if ops and ops.legal_risk_flags:
        rationale.append(f"Risco jurídico identificado: {', '.join(ops.legal_risk_flags)}")
        viability_score -= len(ops.legal_risk_flags) * 6

    if ops and estimated_effort_hours > ops.available_team_capacity_hours:
        rationale.append("Esforço estimado excede capacidade operacional disponível")
        viability_score -= 15

    viability_score = max(0.0, min(100.0, viability_score))

    expected_margin_band = "incerta"
    if expected_margin_percent >= 18:
        expected_margin_band = ">=18%"
    elif expected_margin_percent >= 12:
        expected_margin_band = "12% a 18%"
    elif expected_margin_percent >= 8:
        expected_margin_band = "8% a 14%"

    policy_failures = []
    if policy:
        if expected_margin_percent < policy.minimum_margin_percent:
            policy_failures.append("margem abaixo da política")
        if estimated_effort_hours > policy.maximum_effort_hours:
            policy_failures.append("esforço acima do limite da política")
        if not policy.allow_expired_certificates and company_status and company_status.expired_certificates:
            policy_failures.append("empresa com certidões expiradas")
        if not policy.allow_critical_deadline and scored.parsed.deadline_days < 7:
            policy_failures.append("prazo crítico fora da política")
        if company_fit < policy.minimum_company_fit_score:
            policy_failures.append("fit da empresa abaixo do mínimo")
        if scored.score < policy.minimum_notice_score:
            policy_failures.append("score do edital abaixo do mínimo")

    if policy_failures:
        rationale.append(f"Falhas de política: {', '.join(policy_failures)}")

    if not policy_failures and viability_score >= 75:
        bid_decision = "bid"
        risk_level = "medio"
    elif not policy_failures and viability_score >= 55:
        bid_decision = "bid_com_ressalvas"
        risk_level = "medio_alto"
    else:
        bid_decision = "no_bid"
        risk_level = "alto"

    if scored.parsed.deadline_days <= 5:
        risk_level = "alto"
        rationale.append("Prazo agressivo aumenta risco de execução da proposta")

    return BidAnalysis(
        bid_decision=bid_decision,
        viability_score=round(viability_score, 2),
        estimated_effort_hours=estimated_effort_hours,
        risk_level=risk_level,
        expected_margin_band=expected_margin_band,
        rationale=rationale,
    )


def assess_company_readiness(
    company: CompanyProfile,
    scored: ScoredNotice,
    today_iso: str = "2026-04-18",
) -> CompanyReadinessStatus:
    required = set(scored.parsed.required_docs)
    capabilities = set(company.capabilities)
    missing_capabilities = sorted(required - capabilities)

    expired_certificates = []
    expiring_certificates = []
    for certificate in company.certificates:
        expiration = company.certificate_expirations.get(certificate)
        if not expiration:
            continue
        if expiration < today_iso:
            expired_certificates.append(certificate)
        elif expiration <= "2026-05-18":
            expiring_certificates.append(certificate)

    normalized_object = normalize_text(scored.parsed.object_text)
    portfolio_match = [keyword for keyword in company.portfolio_keywords if normalize_text(keyword) in normalized_object]

    blockers = []
    if missing_capabilities:
        blockers.append("Capacidades obrigatórias ausentes")
    if expired_certificates:
        blockers.append("Certidões expiradas")
    if scored.parsed.region not in company.target_regions:
        blockers.append("Região fora da estratégia da empresa")

    capability_match_score = 100.0
    capability_match_score -= len(missing_capabilities) * 25
    capability_match_score -= len(expired_certificates) * 20
    capability_match_score -= len(expiring_certificates) * 5
    capability_match_score += min(len(portfolio_match) * 5, 10)
    capability_match_score = max(0.0, min(100.0, capability_match_score))

    return CompanyReadinessStatus(
        company_id=company.company_id,
        eligible=len(blockers) == 0,
        capability_match_score=capability_match_score,
        missing_capabilities=missing_capabilities,
        expired_certificates=expired_certificates,
        expiring_certificates=expiring_certificates,
        portfolio_match=portfolio_match,
        blockers=blockers,
    )


def rank_notice_for_operation(
    scored: ScoredNotice,
    readiness: ReadinessReport,
    bid_analysis: BidAnalysis,
) -> NoticeRanking:
    final_score = scored.score * 0.35 + readiness.readiness_score * 0.25 + bid_analysis.viability_score * 0.40
    final_score = round(max(0.0, min(100.0, final_score)), 2)

    if final_score >= 75:
        priority_bucket = "ataque_imediato"
    elif final_score >= 55:
        priority_bucket = "qualificar_rapido"
    else:
        priority_bucket = "backlog_ou_descartar"

    reasons = [
        f"score edital={scored.score}",
        f"readiness={readiness.readiness_score}",
        f"viabilidade={bid_analysis.viability_score}",
        f"decisao_operacional={bid_analysis.bid_decision}",
    ]

    return NoticeRanking(
        source_id=scored.parsed.source_id,
        title=scored.parsed.title,
        final_score=final_score,
        priority_bucket=priority_bucket,
        reasons=reasons,
    )