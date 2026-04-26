from __future__ import annotations

from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel

# --- Span attribute key constants ---
AGENT_TYPE = "medtrace.agent.type"
CLINICAL_DOMAIN = "medtrace.clinical.domain"
SAFETY_GATE_TRIGGERED = "medtrace.safety.gate_triggered"
SAFETY_ESCALATION_REQUIRED = "medtrace.safety.escalation_required"
RISK_TIER = "medtrace.risk.tier"
MODEL_NAME = "medtrace.model.name"
LATENCY_MS = "medtrace.model.latency_ms"
TOKENS_INPUT = "medtrace.tokens.input"
TOKENS_OUTPUT = "medtrace.tokens.output"
PHI_SCRUB_COUNT = "medtrace.phi.scrub_count"


# --- Enums ---
class AgentType(str, Enum):
    DIAGNOSTIC = "diagnostic"
    TRIAGE = "triage"
    PRESCRIPTIVE = "prescriptive"
    CONVERSATIONAL = "conversational"
    ROUTING = "routing"


class ClinicalDomain(str, Enum):
    CARDIOLOGY = "cardiology"
    ONCOLOGY = "oncology"
    EMERGENCY = "emergency"
    GENERAL = "general"
    MENTAL_HEALTH = "mental_health"
    RADIOLOGY = "radiology"
    PHARMACY = "pharmacy"


class RiskTier(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


# --- Clinical span context model ---
class ClinicalSpanContext(BaseModel):
    agent_type: Optional[AgentType] = None
    domain: Optional[ClinicalDomain] = None
    risk_tier: Optional[RiskTier] = None
    model_name: Optional[str] = None
    tokens_input: int = 0
    tokens_output: int = 0

    def to_otel_attributes(self) -> Dict[str, Any]:
        attrs: Dict[str, Any] = {
            TOKENS_INPUT: self.tokens_input,
            TOKENS_OUTPUT: self.tokens_output,
        }
        if self.agent_type is not None:
            attrs[AGENT_TYPE] = self.agent_type.value
        if self.domain is not None:
            attrs[CLINICAL_DOMAIN] = self.domain.value
        if self.risk_tier is not None:
            attrs[RISK_TIER] = self.risk_tier.value
        if self.model_name is not None:
            attrs[MODEL_NAME] = self.model_name
        return attrs
