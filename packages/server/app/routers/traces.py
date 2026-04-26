from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import TraceSpan

router = APIRouter(prefix="/traces", tags=["traces"])

# --- Pydantic Models ---

class SpanIngest(BaseModel):
    trace_id: str
    span_id: str
    parent_span_id: Optional[str] = None
    service_name: str
    span_name: str
    clinical_domain: Optional[str] = None
    agent_type: Optional[str] = None
    risk_tier: Optional[str] = None
    safety_gate_triggered: bool = False
    safety_escalation_required: bool = False
    model_name: Optional[str] = None
    latency_ms: Optional[float] = None
    tokens_input: int = 0
    tokens_output: int = 0
    phi_scrub_count: int = 0
    payload_hash: str
    start_time: datetime
    end_time: datetime

class IngestResponse(BaseModel):
    ingested: int
    trace_ids: List[str]

class SpanResponse(BaseModel):
    id: UUID
    trace_id: str
    span_id: str
    parent_span_id: Optional[str]
    service_name: str
    span_name: str
    clinical_domain: Optional[str]
    agent_type: Optional[str]
    risk_tier: Optional[str]
    safety_gate_triggered: bool
    safety_escalation_required: bool
    model_name: Optional[str]
    latency_ms: Optional[float]
    tokens_input: int
    tokens_output: int
    phi_scrub_count: int
    payload_hash: str
    start_time: datetime
    end_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class TraceListResponse(BaseModel):
    total: int
    items: List[SpanResponse]

class ReplayResponse(BaseModel):
    trace_id: str
    spans: List[SpanResponse]
    replay_inputs: Dict[str, Any]
    model: Optional[str]

# --- Endpoints ---

@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_spans(spans: List[SpanIngest], db: AsyncSession = Depends(get_db)):
    db_spans = [TraceSpan(**span.model_dump()) for span in spans]
    db.add_all(db_spans)
    await db.commit()
    
    unique_trace_ids = list(set(span.trace_id for span in spans))
    return {"ingested": len(spans), "trace_ids": unique_trace_ids}

@router.get("/", response_model=TraceListResponse)
async def list_traces(
    service: Optional[str] = None,
    domain: Optional[str] = None,
    risk_tier: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    query = select(TraceSpan)
    if service:
        query = query.where(TraceSpan.service_name == service)
    if domain:
        query = query.where(TraceSpan.clinical_domain == domain)
    if risk_tier:
        query = query.where(TraceSpan.risk_tier == risk_tier)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar() or 0
    
    # Get items
    result = await db.execute(
        query.order_by(TraceSpan.start_time.desc()).limit(limit).offset(offset)
    )
    items = result.scalars().all()
    
    return {"total": total_count, "items": items}

@router.get("/{trace_id}", response_model=List[SpanResponse])
async def get_trace(trace_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TraceSpan).where(TraceSpan.trace_id == trace_id).order_by(TraceSpan.start_time.asc())
    )
    spans = result.scalars().all()
    if not spans:
        raise HTTPException(status_code=404, detail=f"Trace {trace_id} not found")
    return spans

@router.get("/{trace_id}/replay", response_model=ReplayResponse)
async def replay_trace(trace_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TraceSpan).where(TraceSpan.trace_id == trace_id).order_by(TraceSpan.start_time.asc())
    )
    spans = result.scalars().all()
    if not spans:
        raise HTTPException(status_code=404, detail=f"Trace {trace_id} not found")
    
    # Reconstruct mock "replay_inputs" based on stored span info
    # In a real use case, this might pull from a specific 'input' span attribute
    main_span = spans[0]
    replay_inputs = {
        "initial_payload_hash": main_span.payload_hash,
        "entry_service": main_span.service_name,
        "clinical_intent": main_span.clinical_domain
    }

    return {
        "trace_id": trace_id,
        "spans": spans,
        "replay_inputs": replay_inputs,
        "model": next((s.model_name for s in spans if s.model_name), None)
    }

@router.delete("/{trace_id}")
async def delete_trace(trace_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        delete(TraceSpan).where(TraceSpan.trace_id == trace_id)
    )
    await db.commit()
    return {"deleted": result.rowcount}
