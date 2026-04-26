# Requires: pip install medtrace-sdk langchain-openai openai python-dotenv
import asyncio
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from medtrace import MedTracer
from medtrace.schema import RiskTier

# Load environment variables (OPENAI_API_KEY)
load_dotenv()

# Initialize MedTracer
tracer = MedTracer(
    service="example-clinical-agent", 
    domain="cardiology",
    otlp_endpoint="http://localhost:4317"
)

@tracer.trace_agent(name="clinical-diagnosis-engine", risk_tier=RiskTier.high)
async def diagnose_symptoms(symptoms: str):
    """
    Simulates a clinical diagnosis agent call.
    The @trace_agent decorator automatically starts an OTel span.
    """
    llm = ChatOpenAI(model="gpt-4-turbo-preview")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI cardiologist. Analyze the symptoms and provide a risk assessment."),
        ("user", "{symptoms}")
    ])
    
    # Run the chain
    chain = prompt | llm
    response = await chain.ainvoke({"symptoms": symptoms})
    
    # Record a safety gate event (e.g. human-in-the-loop check)
    # In this mock case, we assume the output is safe.
    tracer.safety_gate(triggered=False)
    
    return response.content

async def main():
    print("🚀 Starting clinical agent trace...")
    patient_query = "Patient reports acute chest pain radiating to the left arm and shortness of breath."
    result = await diagnose_symptoms(patient_query)
    
    print("\n--- Agent Response ---")
    print(result)
    print("\n✅ Trace exported to MedTrace Server.")

if __name__ == "__main__":
    asyncio.run(main())
