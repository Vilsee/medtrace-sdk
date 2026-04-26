from __future__ import annotations

import uuid

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    Integer,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TraceSpan(Base):
    __tablename__ = "trace_spans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    trace_id: Mapped[str] = mapped_column(String(64), index=True)
    span_id: Mapped[str] = mapped_column(String(32))
    parent_span_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    service_name: Mapped[str] = mapped_column(String(128))
    span_name: Mapped[str] = mapped_column(String(256))
    clinical_domain: Mapped[str | None] = mapped_column(String(64), nullable=True)
    agent_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    risk_tier: Mapped[str | None] = mapped_column(String(32), nullable=True)
    safety_gate_triggered: Mapped[bool] = mapped_column(Boolean, default=False)
    safety_escalation_required: Mapped[bool] = mapped_column(Boolean, default=False)
    model_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    tokens_input: Mapped[int] = mapped_column(Integer, default=0)
    tokens_output: Mapped[int] = mapped_column(Integer, default=0)
    phi_scrub_count: Mapped[int] = mapped_column(Integer, default=0)
    payload_hash: Mapped[str] = mapped_column(String(64))
    start_time: Mapped[str] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[str] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )


class AuditEntry(Base):
    __tablename__ = "audit_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    trace_id: Mapped[str] = mapped_column(String(64), index=True)
    span_hash: Mapped[str] = mapped_column(String(64))
    action: Mapped[str] = mapped_column(String(128))
    actor: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
