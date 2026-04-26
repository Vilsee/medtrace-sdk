from __future__ import annotations

import json
import hashlib
from datetime import datetime, timedelta
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import TraceSpan

router = APIRouter(prefix="/audit", tags=["audit"])

def compute_integrity_hash(trace_id: str, span_id: str, payload_hash: str, start_time: datetime) -> str:
    content = f"{trace_id}{span_id}{payload_hash}{start_time}"
    return hashlib.sha256(content.encode()).hexdigest()

@router.get("/export")
async def export_audit(
    start: datetime = Query(...),
    end: datetime = Query(...),
    format: str = Query("ndjson"),
    db: AsyncSession = Depends(get_db)
):
    async def span_generator() -> AsyncGenerator[str, None]:
        result = await db.stream(
            select(TraceSpan).where(
                and_(
                    TraceSpan.created_at >= start,
                    TraceSpan.created_at <= end
                )
            )
        )
        
        async for row in result:
            span = row[0]
            data = {
                "id": str(span.id),
                "trace_id": span.trace_id,
                "span_id": span.span_id,
                "service_name": span.service_name,
                "span_name": span.span_name,
                "clinical_domain": span.clinical_domain,
                "agent_type": span.agent_type,
                "risk_tier": span.risk_tier,
                "safety_gate_triggered": span.safety_gate_triggered,
                "latency_ms": span.latency_ms,
                "tokens_input": span.tokens_input,
                "tokens_output": span.tokens_output,
                "phi_scrub_count": span.phi_scrub_count,
                "payload_hash": span.payload_hash,
                "start_time": span.start_time.isoformat(),
                "end_time": span.end_time.isoformat(),
                "created_at": span.created_at.isoformat(),
                "integrity_hash": compute_integrity_hash(
                    span.trace_id, span.span_id, span.payload_hash, span.start_time
                )
            }
            yield json.dumps(data) + "\n"

    return StreamingResponse(
        span_generator(),
        media_type="application/x-ndjson"
    )

@router.get("/summary")
async def get_audit_summary(db: AsyncSession = Depends(get_db)):
    since_24h = datetime.utcnow() - timedelta(hours=24)
    
    # Run aggregations
    result = await db.execute(
        select(
            func.count(TraceSpan.id).label("total_spans"),
            func.count(func.distinct(TraceSpan.trace_id)).label("unique_traces"),
            func.sum(func.cast(TraceSpan.safety_gate_triggered, func.Integer)).label("safety_gates_triggered"),
            func.sum(func.case((TraceSpan.risk_tier == "high", 1), else_=0)).label("high_risk_spans"),
            func.sum(TraceSpan.phi_scrub_count).label("phi_scrubs_total"),
            func.avg(TraceSpan.latency_ms).label("avg_latency_ms")
        ).where(TraceSpan.created_at >= since_24h)
    )
    
    stats = result.mappings().one()
    
    return {
        "total_spans": stats["total_spans"] or 0,
        "unique_traces": stats["unique_traces"] or 0,
        "safety_gates_triggered": stats["safety_gates_triggered"] or 0,
        "high_risk_spans": stats["high_risk_spans"] or 0,
        "phi_scrubs_total": stats["phi_scrubs_total"] or 0,
        "avg_latency_ms": round(stats["avg_latency_ms"] or 0.0, 2)
    }
