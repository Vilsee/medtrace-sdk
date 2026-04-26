const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8765";

export interface TraceSpan {
  id: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  service_name: string;
  span_name: string;
  clinical_domain: string | null;
  agent_type: string | null;
  risk_tier: string | null;
  safety_gate_triggered: boolean;
  safety_escalation_required: boolean;
  model_name: string | null;
  latency_ms: number | null;
  tokens_input: number;
  tokens_output: number;
  phi_scrub_count: number;
  payload_hash: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface AuditSummary {
  total_spans: number;
  unique_traces: number;
  safety_gates_triggered: number;
  high_risk_spans: number;
  phi_scrubs_total: number;
  avg_latency_ms: number;
}

export async function fetchHealth(): Promise<{ status: string; version: string }> {
  const res = await fetch(`${NEXT_PUBLIC_API_URL}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchSummary(): Promise<AuditSummary> {
  const res = await fetch(`${NEXT_PUBLIC_API_URL}/audit/summary`);
  if (!res.ok) throw new Error("Failed to fetch audit summary");
  return res.json();
}

export async function fetchTraces(params?: {
  service?: string;
  domain?: string;
  risk_tier?: string;
  limit?: number;
}): Promise<{ total: number; items: TraceSpan[] }> {
  const query = new URLSearchParams();
  if (params?.service) query.append("service", params.service);
  if (params?.domain) query.append("domain", params.domain);
  if (params?.risk_tier) query.append("risk_tier", params.risk_tier);
  if (params?.limit) query.append("limit", params.limit.toString());

  const res = await fetch(`${NEXT_PUBLIC_API_URL}/traces/?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch traces");
  return res.json();
}

export async function fetchTrace(traceId: string): Promise<TraceSpan[]> {
  const res = await fetch(`${NEXT_PUBLIC_API_URL}/traces/${traceId}`);
  if (!res.ok) throw new Error(`Failed to fetch trace ${traceId}`);
  return res.json();
}

export async function fetchAuditSummary(): Promise<any> {
    // This is essentially redundant with fetchSummary but included for completeness
    return fetchSummary();
}

export async function exportAudit(start: string, end: string): Promise<Blob> {
  const params = new URLSearchParams({ start, end });
  const res = await fetch(`${NEXT_PUBLIC_API_URL}/audit/export?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to export audit logs");
  return res.blob();
}
