from typing import List, Dict, Any
from langchain.tools import Tool, BaseTool
from langchain.tools.ddg_search import DuckDuckGoSearchRun
from langchain.utilities import WikipediaAPIWrapper
from langchain_community.tools import WikipediaQueryRun

def get_search_tool() -> BaseTool:
    """Get the search tool for the agent"""
    search = DuckDuckGoSearchRun()
    return Tool(
        name="web_search",
        func=search.run,
        description="Search the web for information about a topic. Use this to find current or factual information."
    )

def get_wikipedia_tool() -> BaseTool:
    """Get the Wikipedia tool for the agent"""
    wikipedia = WikipediaAPIWrapper()
    return WikipediaQueryRun(api_wrapper=wikipedia)

def get_tools(mode: str = "normal") -> List[BaseTool]:
    """Get the tools for the agent based on the mode
    
    Args:
        mode: The mode for the tools. Options: "normal", "advanced"
        
    Returns:
        List of tools for the agent
    """
    # Base tools available in all modes
    tools = [
        get_search_tool(),
        get_wikipedia_tool(),
    ]
    
    # Add additional tools for advanced mode
    if mode == "advanced":
        # You can add more advanced tools here as you develop them
        pass
    
    return tools