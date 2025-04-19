from typing import List, Dict, Any, Optional
from langchain.tools import BaseTool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

def create_agent_chain(
    model_name: str = "gpt-4o", 
    system_prompt: str = "", 
    tools: Optional[List[BaseTool]] = None
) -> AgentExecutor:
    """Create an agent chain with the specified model and tools
    
    Args:
        model_name: The name of the model to use
        system_prompt: The system prompt for the agent
        tools: List of tools for the agent to use
        
    Returns:
        An AgentExecutor chain
    """
    # Initialize the appropriate model based on the model_name
    if model_name.startswith("gpt"):
        llm = ChatOpenAI(model=model_name, temperature=0)
    elif model_name.startswith("gemini"):
        llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)
    else:
        # Default to OpenAI
        llm = ChatOpenAI(model="gpt-4o", temperature=0)
    
    # Set up the tools (empty list if None provided)
    agent_tools = tools or []
    
    # Create the prompt with the system message and chat history
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad")
    ])
    
    # Create the ReAct agent
    agent = create_react_agent(llm=llm, tools=agent_tools, prompt=prompt)
    
    # Create the agent executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=agent_tools,
        verbose=True,
        handle_parsing_errors=True,
        return_intermediate_steps=True
    )
    
    return agent_executor