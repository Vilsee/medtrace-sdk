import asyncio
from typing import TypedDict
from langgraph.graph import StateGraph, END
from medtrace import MedTracer
from medtrace.schema import AgentType

# Initialize Tracer
tracer = MedTracer(service="langgraph-clinical-workflow", domain="general")

# 1. Define State
class AgentState(TypedDict):
    query: str
    triage_result: str
    response: str

# 2. Define Nodes
async def triage_node(state: AgentState):
    print("--- TRACING: Triage Node ---")
    # Simulate some logic
    return {"triage_result": "urgent" if "pain" in state["query"] else "routine"}

async def response_node(state: AgentState):
    print("--- TRACING: Response Node ---")
    return {"response": f"Handling {state['triage_result']} request."}

# 3. Build Graph
workflow = StateGraph(AgentState)
workflow.add_node("triage", triage_node)
workflow.add_node("responder", response_node)

workflow.set_entry_point("triage")
workflow.add_edge("triage", "responder")
workflow.add_edge("responder", END)

# 4. Instrument Graph with MedTrace
# This patches the invoke/ainvoke methods to automatically trace all internal transitions.
app = tracer.instrument_graph(workflow.compile())

async def main():
    print("🧪 Running Instrumented LangGraph...")
    inputs = {"query": "Patient reports chest pain"}
    
    # This call will now show up as a single trace with nested spans for each node
    async for output in app.astream(inputs):
        print(f"Step Output: {output}")

    print("\n✅ Multi-node trace exported.")

if __name__ == "__main__":
    asyncio.run(main())
