from dataclasses import dataclass, field
from typing import List, Dict


@dataclass
class RawNotice:
    source: str
    source_id: str
    title: str
    body: str
    metadata: Dict[str, str] = field(default_factory=dict)


@dataclass
class NoticeSnapshot:
    source: str
    source_id: str
    version_id: str
    captured_at: str
    content_hash: str
    normalized_text: str


@dataclass
class ParsedNotice:
    source: str
    source_id: str
    title: str
    object_text: str
    region: str
    estimated_value: float
    deadline_days: int
    required_docs: List[str]
    tags: List[str]
    risk_flags: List[str]


@dataclass
class Profile:
    name: str
    target_regions: List[str]
    positive_tags: List[str]
    negative_tags: List[str]
    required_capabilities: List[str]
    minimum_value: float
    maximum_value: float
    minimum_deadline_days: int


@dataclass
class ScoredNotice:
    parsed: ParsedNotice
    score: float
    decision: str
    reasons: List[str]
    checklist: List[str]


@dataclass
class NoticeDiff:
    previous_version_id: str
    current_version_id: str
    added_tokens: List[str]
    removed_tokens: List[str]
    changed_fields: List[str]


@dataclass
class DecisionPacket:
    title: str
    decision: str
    score: float
    executive_summary: str
    reasons: List[str]
    checklist: List[str]
    critical_path: List[str]


@dataclass
class ReadinessReport:
    readiness_score: float
    readiness_level: str
    missing_documents: List[str]
    blocking_items: List[str]
    recommended_actions: List[str]


@dataclass
class BidAnalysis:
    bid_decision: str
    viability_score: float
    estimated_effort_hours: int
    risk_level: str
    expected_margin_band: str
    rationale: List[str]


@dataclass
class CompanyProfile:
    company_id: str
    legal_name: str
    target_regions: List[str]
    cnaes: List[str]
    capabilities: List[str]
    certificates: List[str]
    certificate_expirations: Dict[str, str]
    portfolio_keywords: List[str]


@dataclass
class CompanyReadinessStatus:
    company_id: str
    eligible: bool
    capability_match_score: float
    missing_capabilities: List[str]
    expired_certificates: List[str]
    expiring_certificates: List[str]
    portfolio_match: List[str]
    blockers: List[str]


@dataclass
class BidPolicy:
    minimum_margin_percent: float
    maximum_effort_hours: int
    allow_expired_certificates: bool
    allow_critical_deadline: bool
    minimum_company_fit_score: float
    minimum_notice_score: float


@dataclass
class OperationalContext:
    available_team_capacity_hours: int
    concurrent_bids: int
    legal_risk_flags: List[str]
    estimated_cost_base: float


@dataclass
class NoticeRanking:
    source_id: str
    title: str
    final_score: float
    priority_bucket: str
    reasons: List[str]