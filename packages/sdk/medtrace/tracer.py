from __future__ import annotations

import asyncio
import functools
import hashlib
import time
from typing import Any, Callable, Dict, Optional

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

from medtrace.schema import (
    AGENT_TYPE, CLINICAL_DOMAIN, LATENCY_MS, RISK_TIER,
    SAFETY_GATE_TRIGGERED, SAFETY_ESCALATION_REQUIRED,
)
from medtrace.scrubbers.presidio_scrubber import PhiScrubber


def _hash(value: Any) -> str:
    return hashlib.sha256(str(value).encode()).hexdigest()


class MedTracer:
    def __init__(
        self,
        service: str,
        domain: str = "general",
        otlp_endpoint: str = "http://localhost:4317",
        phi_scrub: bool = True,
        mode: str = "mask",
    ) -> None:
        self.service = service
        self.domain = domain
        self.phi_scrub = phi_scrub

        resource = Resource.create({"service.name": service})
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(exporter))
        self.tracer = provider.get_tracer(service)

        self._scrubber: Optional[PhiScrubber] = (
            PhiScrubber(mode=mode) if phi_scrub else None
        )

    # -- LangGraph instrumentation --
    def instrument_graph(self, graph: Any) -> Any:
        original_invoke = graph.invoke  # type: ignore

        @functools.wraps(original_invoke)
        def wrapped_invoke(input: Any, *args: Any, **kwargs: Any) -> Any:
            span_name = f"{self.service}.graph.invoke"
            with self.tracer.start_as_current_span(span_name) as span:
                span.set_attribute(AGENT_TYPE, "routing")
                span.set_attribute(CLINICAL_DOMAIN, self.domain)
                span.set_attribute("medtrace.input.hash", _hash(input))
                try:
                    result = original_invoke(input, *args, **kwargs)
                    span.set_attribute("medtrace.output.hash", _hash(result))
                    return result
                except Exception as exc:
                    span.set_status(trace.StatusCode.ERROR, str(exc))
                    span.record_exception(exc)
                    raise

        graph.invoke = wrapped_invoke  # type: ignore
        return graph

    # -- Agent node decorator --
    def trace_agent(self, name: str, risk_tier: str = "low") -> Callable:
        def decorator(fn: Callable) -> Callable:
            @functools.wraps(fn)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                with self.tracer.start_as_current_span(name) as span:
                    span.set_attribute(RISK_TIER, risk_tier)
                    span.set_attribute(CLINICAL_DOMAIN, self.domain)
                    start = time.perf_counter()
                    try:
                        result = await fn(*args, **kwargs)
                        elapsed = (time.perf_counter() - start) * 1000
                        span.set_attribute(LATENCY_MS, elapsed)
                        return result
                    except Exception as exc:
                        elapsed = (time.perf_counter() - start) * 1000
                        span.set_attribute(LATENCY_MS, elapsed)
                        span.set_status(trace.StatusCode.ERROR, str(exc))
                        span.record_exception(exc)
                        raise
            return wrapper
        return decorator

    # -- Safety gate recording --
    def safety_gate(self, triggered: bool, escalate: bool = False) -> None:
        span = trace.get_current_span()
        span.set_attribute(SAFETY_GATE_TRIGGERED, triggered)
        span.set_attribute(SAFETY_ESCALATION_REQUIRED, escalate)
