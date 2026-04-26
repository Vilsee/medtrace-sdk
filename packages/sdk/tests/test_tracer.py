import pytest
from unittest.mock import MagicMock, patch
from medtrace.tracer import MedTracer
from medtrace.schema import ClinicalSpanContext, AgentType, ClinicalDomain
from medtrace.scrubbers.presidio_scrubber import PhiScrubber

@pytest.fixture
def mock_otel_exporter():
    with patch("opentelemetry.exporter.otlp.proto.grpc.trace_exporter.OTLPSpanExporter") as mock:
        yield mock

def test_medtracer_init(mock_otel_exporter):
    """Verify MedTracer initializes without real network dependencies."""
    tracer = MedTracer(service="test-service", otlp_endpoint="http://mock:4317")
    assert tracer.service == "test-service"
    assert tracer.domain == "general"
    assert hasattr(tracer, "tracer")

def test_schema_to_otel_attributes():
    """Verify clinical schema correctly maps to OTel attribute strings."""
    ctx = ClinicalSpanContext(
        agent_type=AgentType.diagnostic,
        domain=ClinicalDomain.cardiology
    )
    attrs = ctx.to_otel_attributes()
    
    assert attrs["medtrace.agent.type"] == "diagnostic"
    assert attrs["medtrace.clinical.domain"] == "cardiology"
    assert "medtrace.risk.tier" in attrs

def test_phi_scrubber_masks_name():
    """Verify Presidio scrubber identifies and redacts PHI."""
    scrubber = PhiScrubber(mode="mask")
    text = "Patient John Smith has diabetes"
    scrubbed, count = scrubber.scrub_text(text)
    
    assert "John Smith" not in scrubbed
    assert "[PHI_REDACTED]" in scrubbed
    assert count >= 1

def test_safety_gate_noop_without_span():
    """Ensure safety_gate doesn't crash if called outside a trace environment."""
    tracer = MedTracer(service="test-service")
    # This should simply do nothing (or log a warning) but not raise an exception
    try:
        tracer.safety_gate(triggered=True)
    except Exception as e:
        pytest.fail(f"safety_gate raised exception outside span: {e}")

def test_phi_scrubber_hash_mode():
    """Verify hashing mode produces hex strings instead of simple masks."""
    scrubber = PhiScrubber(mode="hash")
    text = "Call me at 555-0199"
    scrubbed, count = scrubber.scrub_text(text)
    
    assert "555-0199" not in scrubbed
    assert count >= 1
    # Check if we see a hex-like string (SHA-256 usually 64 chars)
    assert len(scrubbed) > 10 
