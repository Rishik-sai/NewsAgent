from langgraph.graph import StateGraph, END
from agent.state import NewsAgentState
from agent.nodes.intent import classify_intent
from agent.nodes.fetcher import fetch_news
from agent.nodes.personalizer import translate_news
from agent.nodes.formatter import format_response

def route_intent(state: NewsAgentState) -> str:
    intent = state.get("intent", "chat")
    if intent == "search":
        return "fetcher"
    return "formatter"

# Initialize StateGraph with the NewsAgentState TypedDict schema
workflow = StateGraph(NewsAgentState)

# Add processing nodes
workflow.add_node("intent", classify_intent)
workflow.add_node("fetcher", fetch_news)
workflow.add_node("translator", translate_news)
workflow.add_node("formatter", format_response)

# Entry Point
workflow.set_entry_point("intent")

# Add Conditional Routing
workflow.add_conditional_edges(
    "intent",
    route_intent,
    {
        "fetcher": "fetcher",
        "formatter": "formatter"
    }
)

# Standard edge routing
workflow.add_edge("fetcher", "translator")
workflow.add_edge("translator", "formatter")
workflow.add_edge("formatter", END)

# Compile LangGraph application
app = workflow.compile()
