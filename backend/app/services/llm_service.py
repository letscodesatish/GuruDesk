import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# 1. Load the secret API key from the .env file
load_dotenv()

# 2. Initialize the AI Model (Gemini 1.5 Flash is incredibly fast and cheap)
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.3 # 0.3 means it will be factual and structured, not overly creative
)

def generate_lesson_plan(syllabus_text: str, specific_topic: str) -> str:
    """Uses LangChain to read the syllabus and generate a teaching plan."""
    
    # 3. Create a strict template for the AI to follow
    prompt_template = PromptTemplate(
        input_variables=["syllabus", "topic"],
        template="""
        You are an expert engineering professor at an Indian University.
        Below is the official syllabus for a course.
        
        SYLLABUS:
        {syllabus}
        
        TASK:
        The professor needs to teach a 45-minute lecture on the topic: "{topic}".
        Look at the syllabus to understand the context, and generate a structured lesson plan.
        Include:
        1. Learning Objectives
        2. A real-world engineering example (relevant to India)
        3. A 5-question quick quiz to check student understanding
        """
    )
    
    # 4. Chain the prompt and the AI together, then execute it
    chain = prompt_template | llm
    
    # 5. Pass our dynamic variables into the chain
    response = chain.invoke({
        "syllabus": syllabus_text[:10000], # We limit to 10k characters to save context window space
        "topic": specific_topic
    })
    
    return response.content