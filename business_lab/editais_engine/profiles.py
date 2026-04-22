import json
from pathlib import Path

from models import BidPolicy, CompanyProfile, OperationalContext, Profile


ENGINEERING_SERVICES_PROFILE = Profile(
    name="engenharia_servicos",
    target_regions=["SP", "RJ", "MG"],
    positive_tags=["engenharia", "manutenção", "predial", "obra", "reforma"],
    negative_tags=["medicamento", "merenda", "combustível"],
    required_capabilities=["atestados_tecnicos", "certidoes_fiscais", "capacidade_operacional"],
    minimum_value=50000.0,
    maximum_value=5000000.0,
    minimum_deadline_days=7,
)


ENGINEERING_COMPANY_PROFILE = CompanyProfile(
    company_id="empresa-demo-001",
    legal_name="Akita Engenharia Operacional Ltda",
    target_regions=["SP", "RJ"],
    cnaes=["7112000", "4321500"],
    capabilities=["atestados_tecnicos", "certidoes_fiscais", "capacidade_operacional"],
    certificates=["fgts", "federal", "estadual"],
    certificate_expirations={
        "fgts": "2026-04-30",
        "federal": "2026-06-10",
        "estadual": "2026-04-10",
    },
    portfolio_keywords=["manutenção predial", "reforma", "adequações"],
)


DEFAULT_BID_POLICY = BidPolicy(
    minimum_margin_percent=10.0,
    maximum_effort_hours=32,
    allow_expired_certificates=False,
    allow_critical_deadline=False,
    minimum_company_fit_score=70.0,
    minimum_notice_score=60.0,
)


DEFAULT_OPERATIONAL_CONTEXT = OperationalContext(
    available_team_capacity_hours=28,
    concurrent_bids=3,
    legal_risk_flags=["clausula_restritiva"],
    estimated_cost_base=690000.0,
)


HOSPITAL_SERVICES_PROFILE = Profile(
    name="hospitalar_servicos",
    target_regions=["SP", "RJ", "MG"],
    positive_tags=["hospital", "clinica", "manutencao", "engenharia"],
    negative_tags=["combustível", "merenda"],
    required_capabilities=["atestados_tecnicos", "certidoes_fiscais"],
    minimum_value=100000.0,
    maximum_value=8000000.0,
    minimum_deadline_days=10,
)


PROFILE_REGISTRY = {
    ENGINEERING_SERVICES_PROFILE.name: ENGINEERING_SERVICES_PROFILE,
    HOSPITAL_SERVICES_PROFILE.name: HOSPITAL_SERVICES_PROFILE,
}


def load_profile_registry(config_path: str | None = None) -> dict[str, Profile]:
    registry = dict(PROFILE_REGISTRY)
    path = Path(config_path or "business_lab/editais_engine/profiles.json")
    if not path.exists():
        return registry

    payload = json.loads(path.read_text(encoding="utf-8"))
    for item in payload.get("profiles", []):
        profile = Profile(
            name=item["name"],
            target_regions=item.get("target_regions", []),
            positive_tags=item.get("positive_tags", []),
            negative_tags=item.get("negative_tags", []),
            required_capabilities=item.get("required_capabilities", []),
            minimum_value=float(item.get("minimum_value", 0)),
            maximum_value=float(item.get("maximum_value", 999999999)),
            minimum_deadline_days=int(item.get("minimum_deadline_days", 0)),
        )
        registry[profile.name] = profile
    return registry