import os
import json
import base64
from openai import OpenAI
from dotenv import load_dotenv

def encode_image(image_path):
    """Converts the image file into a base64 string."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"The screenshot file was not found at: {image_path}")
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def generate_syllabus_roadmap_from_file(image_filepath: str, subject: str, weeks: int) -> dict:
    """Uses Groq's lightning-fast hardware to run Meta's Llama 3.2 Vision model."""
    
    load_dotenv()
    api_key = os.environ.get("GROQ_API_KEY")
    
    if not api_key:
        raise Exception("Missing API Key! Please set GROQ_API_KEY in your .env file.")

    try:
        print("📦 Encoding image for Groq...")
        base64_image = encode_image(image_filepath)
        
        prompt = f"""
        Act as an expert university professor. Read the attached syllabus screenshot for {subject}.
        Extract the core curriculum and create a {weeks}-week teaching roadmap.
        You MUST output the result as strictly valid JSON without any markdown formatting.
        
        Use this exact JSON schema:
        {{
            "course_title": "{subject}",
            "total_weeks": {weeks},
            "roadmap": [
                {{
                    "week_number": 1,
                    "topics_to_cover": ["Topic 1", "Topic 2"],
                    "learning_outcome": "Outcome description"
                }}
            ]
        }}
        """
        
        print("⚡ Asking Groq (Llama 3.2 Vision) to analyze the screenshot...")
        
        # 1. Point the OpenAI client directly to Groq's custom servers
        client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key,
        )
        
        # 2. Call the Llama Vision model
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct", 
            response_format={ "type": "json_object" }, 
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ]
        )
        
        print("✅ Successfully generated roadmap from Groq!")
        raw_json = response.choices[0].message.content
        return json.loads(raw_json)
        
    except Exception as e:
        raise Exception(f"Groq API Error: {str(e)}")
    
def generate_question_paper(pdf_text: str, criteria: list) -> dict:
    """Uses Groq to generate a test based on uploaded notes and dynamic criteria."""
    
    load_dotenv()
    api_key = os.environ.get("GROQ_API_KEY")
    
    # Calculate total marks for the prompt context
    criteria_summary = "\n".join([
        f"- {c['count']} questions of type '{c['type']}', worth {c['marks']} marks each." 
        for c in criteria
    ])
    
    prompt = f"""
    Act as an expert university professor. Read the following extracted notes:
    
    --- NOTES ---
    {pdf_text[:15000]} # Limit to 15k characters to stay within fast API limits
    -------------
    
    Based ONLY on the material above, generate a question paper matching these exact specifications:
    {criteria_summary}
    
    You MUST output the result as strictly valid JSON without any markdown formatting.
    Use this exact JSON schema:
    {{
        "paper_title": "Subject Assessment",
        "total_marks": 0,
        "sections": [
            {{
                "section_title": "Section A (e.g., MCQs)",
                "questions": [
                    {{
                        "question_text": "The actual question?",
                        "marks": 2
                    }}
                ]
            }}
        ]
    }}
    """
    
    print("⚡ Asking Groq to generate the question paper...")
    
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=api_key,
    )
    
    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct", 
        response_format={ "type": "json_object" }, 
        messages=[{"role": "user", "content": prompt}]
    )
    
    print("✅ Successfully generated question paper!")
    return json.loads(response.choices[0].message.content)
    