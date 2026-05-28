from fastapi import APIRouter
from pydantic import BaseModel
from ..services.csjmu_scraper import fetch_csjmu_syllabus
from app.services.pdf_service import extract_text_from_pdf
from ..services.llm_service import generate_lesson_plan # <-- Import the AI

router = APIRouter()

# Update our validation to ask for the specific topic the professor wants to teach today
class SyllabusRequest(BaseModel):
    subject: str
    topic: str

@router.post("/generate-lesson")
async def create_lesson(request: SyllabusRequest):
    # 1. Download PDF
    download_result = await fetch_csjmu_syllabus(request.subject)
    if "error" in download_result:
        return {"status": "failed", "message": download_result["error"]}
        
    # 2. Extract Text
    syllabus_text = extract_text_from_pdf(download_result["file_path"])
    
    # 3. Generate Lesson Plan using AI
    # We use await asyncio.to_thread because the LangChain call is currently synchronous
    import asyncio
    lesson_plan = await asyncio.to_thread(generate_lesson_plan, syllabus_text, request.topic)
    
    return {
        "status": "success",
        "lesson_plan": lesson_plan
    }