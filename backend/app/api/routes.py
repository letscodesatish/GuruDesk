from fastapi import APIRouter, UploadFile, File, Form, Request
from fastapi.responses import RedirectResponse
from supabase import create_client, Client
from PyPDF2 import PdfReader
from typing import List
import os
import json
import asyncio
import traceback
import shutil
from dotenv import load_dotenv
from pydantic import BaseModel
from fpdf import FPDF
from typing import Dict, List, Any, Optional
class SaveRoadmapPayload(BaseModel):
    subject: str
    roadmap_data: dict
class SavePaperPayload(BaseModel):
    title: str
    timeAllowed: str
    instructions: str
    paper_data: dict

# Your custom services
from app.services.llm_service import generate_question_paper, generate_syllabus_roadmap_from_file
from app.services.csjmu_scraper import fetch_csjmu_syllabus
from app.models.schemas import RoadmapRequest 

# ==========================================
# 1. INITIALIZATION & SETUP
# ==========================================
load_dotenv()

# Create ONE single router for the whole file
router = APIRouter()

# Setup Supabase Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Setup Local Directories (for caching roadmaps and notes)
CACHE_DIR = "saved_roadmaps"
NOTES_DIR = "saved_notes"
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(NOTES_DIR, exist_ok=True)

# ==========================================
# 2. AI & TEACHING PREP ROUTES
# ==========================================
@router.post("/download-syllabus")
async def get_syllabus_link(request: RoadmapRequest):
    try:
        print(f"🔍 Searching university database for: {request.subject} PDF...")
        result = await fetch_csjmu_syllabus(request.subject)
        
        if "error" in result:
            return {"status": "failed", "message": result["error"]}
            
        print("✅ Found PDF! Sending link to frontend.")
        return {"status": "success", "url": result["pdf_url"]}
        
    except Exception as e:
        print("❌ Scraper Error:", str(e))
        return {"status": "error", "message": str(e)}

@router.post("/generate-roadmap-image")
async def create_roadmap_from_image(
    file: UploadFile = File(...),
    subject: str = Form(...),
    weeks: int = Form(14)
):
    try:
        print(f"📸 Received screenshot for {subject}...")
        
        # 1. Save the uploaded image temporarily
        temp_image_path = f"temp_{file.filename}"
        with open(temp_image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            # 2. Send image to Gemini
            roadmap_data = await asyncio.to_thread(
                generate_syllabus_roadmap_from_file, 
                temp_image_path, 
                subject, 
                weeks
            )
        finally:
            # 3. Always clean up the temporary image file
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)

        # 4. Save to the cache so the professor never has to upload it again!
        safe_subject_name = subject.lower().replace(" ", "_").replace("(", "").replace(")", "")
        cache_file_path = os.path.join(CACHE_DIR, f"{safe_subject_name}_roadmap.json")
        
        with open(cache_file_path, "w", encoding="utf-8") as f:
            json.dump(roadmap_data, f, indent=4)
            
        print(f"✅ SUCCESS: Roadmap generated from image and saved!")

        return {
            "status": "success",
            "source": "gemini_vision",
            "data": roadmap_data
        }

    except Exception as e:
        print("--- CRITICAL VISION API ERROR ---")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
# ==========================================
# SUPABASE ROADMAP VAULT (Storage Bucket Only!)
# ==========================================

# 1. Fetch List of PDFs directly from the bucket (No Database!)
@router.get("/roadmaps")
async def get_all_roadmaps():
    try:
        # 1. Ask the STORAGE BUCKET for the list of files (Not the database table!)
        files_response = supabase.storage.from_("gurudesk-roadmaps").list()
        
        roadmaps_list = []
        for file in files_response:
            # Ignore hidden Supabase system files
            if file["name"] != ".emptyFolderPlaceholder":
                # Generate the public URL on the fly
                public_url = supabase.storage.from_("gurudesk-roadmaps").get_public_url(file["name"])
                
                # Clean up the filename to make a nice title for the React frontend
                nice_subject = file["name"].replace("_", " ").replace(".pdf", "").title()
                
                roadmaps_list.append({
                    "id": file["id"],
                    "subject": nice_subject,
                    "pdf_url": public_url
                })
                
        return {"status": "success", "data": roadmaps_list}
    except Exception as e:
        print(f"❌ Error fetching from bucket: {str(e)}")
        return {"status": "error", "message": str(e)}
# 2. Open a specific PDF
@router.get("/roadmaps/{filename}")
async def get_roadmap_pdf(filename: str):
    try:
        public_url = supabase.storage.from_("gurudesk-roadmaps").get_public_url(filename)
        return RedirectResponse(url=public_url)
    except Exception as e:
        return {"status": "error", "message": "File not found"}

# 3. Pure AI Generation 
@router.post("/generate-roadmap-image")
async def create_roadmap_from_image(
    file: UploadFile = File(...), subject: str = Form(...), weeks: int = Form(14)
):
    try:
        temp_image_path = f"temp_{file.filename}"
        with open(temp_image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        try:
            roadmap_data = await asyncio.to_thread(
                generate_syllabus_roadmap_from_file, temp_image_path, subject, weeks
            )
        finally:
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)
        return {"status": "success", "data": roadmap_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 4. Save PDF to Bucket (No Database!)
@router.post("/save-roadmap-pdf")
async def save_roadmap_pdf(payload: SaveRoadmapPayload):
    try:
        # 1. Create PDF
        pdf = FPDF()
        pdf.add_page()
        
        def clean_text(text):
            if not isinstance(text, str): text = str(text)
            text = text.replace('\t', '    ')
            return text.encode('latin-1', 'replace').decode('latin-1')

        # Header
        pdf.set_font("helvetica", style="B", size=16)
        pdf.multi_cell(0, 10, txt=clean_text(payload.subject), align="C")
        pdf.ln(5)

        # Content
        pdf.set_font("helvetica", size=11)
        for week in payload.roadmap_data.get("roadmap", []):
            pdf.set_font("helvetica", style="B", size=12)
            week_title = f"Week {week.get('week_number', '')}"
            pdf.cell(0, 8, txt=clean_text(week_title), ln=True)
            
            pdf.set_font("helvetica", size=11)
            for topic in week.get("topics_to_cover", []):
                safe_topic = clean_text(f"- {topic}")
                pdf.multi_cell(0, 6, txt=safe_topic)
            pdf.ln(4)

        pdf_bytes = bytes(pdf.output())

        # 2. Upload to Supabase Storage Bucket ONLY
        safe_filename = payload.subject.lower().replace(" ", "_") + f"_{os.urandom(4).hex()}.pdf"
        
        supabase.storage.from_("gurudesk-roadmaps").upload(
            path=safe_filename, file=pdf_bytes, file_options={"content-type": "application/pdf"}
        )
        public_url = supabase.storage.from_("gurudesk-roadmaps").get_public_url(safe_filename)

        print(f"✅ Successfully saved PDF to Bucket: {safe_filename}")
        return {"status": "success", "pdf_url": public_url}

    except Exception as e:
        print(f"❌ PDF Save Error: {str(e)}")
        return {"status": "error", "message": str(e)}# ==========================================
# ==========================================
# SUPABASE QUESTION PAPER VAULT
# ==========================================
@router.get("/papers")
async def get_all_papers():
    try:
        # Ask the STORAGE BUCKET directly!
        files_response = supabase.storage.from_("gurudesk-papers").list()
        papers_list = []
        
        for file in files_response:
            if file["name"] != ".emptyFolderPlaceholder":
                public_url = supabase.storage.from_("gurudesk-papers").get_public_url(file["name"])
                nice_title = file["name"].replace("_", " ").replace(".pdf", "").title()
                papers_list.append({
                    "id": file["id"],
                    "title": nice_title,
                    "pdf_url": public_url
                })
                
        return {"status": "success", "data": papers_list}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 1. PURE GENERATION (No Saving)
@router.post("/generate-paper")
async def create_assessment(
    files: List[UploadFile] = File(...),
    criteria: str = Form(...)
):
    try:
        criteria_list = json.loads(criteria)
        extracted_text = ""
        for file in files:
            pdf_reader = PdfReader(file.file)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text: extracted_text += text + "\n"

        if not extracted_text.strip():
            return {"status": "error", "message": "Could not extract text."}

        # Just ask AI for the JSON data!
        paper_data = await asyncio.to_thread(
            generate_question_paper, extracted_text, criteria_list
        )
        
        return {"status": "success", "data": paper_data}

    except Exception as e:
        return {"status": "error", "message": str(e)}

# 2. PURE SAVING (JSON -> PDF -> Bucket)
@router.post("/save-paper-pdf")
async def save_paper_pdf(payload: SavePaperPayload):
    try:
        pdf = FPDF()
        pdf.add_page()
        
        def clean_text(text):
            if not isinstance(text, str): text = str(text)
            text = text.replace('\t', '    ')
            # Strip smart quotes/dashes that crash older PDF renderers
            text = text.replace('"', '"').replace('"', '"').replace('’', "'").replace('‘', "'").replace('–', '-')
            return text.encode('latin-1', 'replace').decode('latin-1')

        # 1. Main Title
        pdf.set_font("helvetica", style="B", size=16)
        pdf.multi_cell(0, 10, txt=clean_text(payload.title), align="C")
        pdf.ln(2)
        
        # 2. Time and Marks (Perfectly split left and right)
        pdf.set_font("helvetica", style="B", size=11)
        time_text = clean_text(f"Time Allowed: {payload.timeAllowed}")
        marks_text = clean_text(f"Maximum Marks: {payload.paper_data.get('total_marks', '100')}")
        
        # A4 printable width is 190mm. 95mm left + 95mm right = Perfect alignment.
        pdf.cell(95, 8, txt=time_text, align="L")
        pdf.cell(95, 8, txt=marks_text, align="R", ln=True)
        
        # 3. Instructions
        pdf.ln(2)
        pdf.set_font("helvetica", style="I", size=11)
        pdf.multi_cell(0, 6, txt=clean_text(f"Note: {payload.instructions}"))
        pdf.ln(6)
        
        # 4. Questions
        for sec in payload.paper_data.get("sections", []):
            pdf.set_font("helvetica", style="B", size=13)
            pdf.cell(0, 8, txt=clean_text(sec.get("section_title", "")), ln=True)
            pdf.ln(2)
            
            pdf.set_font("helvetica", size=11)
            for idx, q in enumerate(sec.get("questions", [])):
                # Using multi_cell ensures long questions wrap to the next line instead of getting cut off!
                q_text = f"Q{idx+1}. {q.get('question_text', '')} [{q.get('marks', '')} Marks]"
                pdf.multi_cell(0, 6, txt=clean_text(q_text))
                pdf.ln(2)
            pdf.ln(4)

        pdf_bytes = bytes(pdf.output())

        # Upload to Bucket
        safe_filename = payload.title.lower().replace(" ", "_") + f"_{os.urandom(4).hex()}.pdf"
        supabase.storage.from_("gurudesk-papers").upload(
            path=safe_filename, file=pdf_bytes, file_options={"content-type": "application/pdf"}
        )
        public_url = supabase.storage.from_("gurudesk-papers").get_public_url(safe_filename)

        return {"status": "success", "pdf_url": public_url}

    except Exception as e:
        print(f"❌ PDF Save Error: {str(e)}")
        return {"status": "error", "message": str(e)}
# ==========================================
# 3. CLOUD FILE ROUTES (Supabase PDF Vault)
# ==========================================
@router.post("/upload-note")
async def upload_note(file: UploadFile = File(...)):
    try:
        file_content = await file.read()
        
        # Upload directly to your new Supabase Notes Bucket
        supabase.storage.from_("gurudesk-notes").upload(
            path=file.filename,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        
        # Get the public URL of the uploaded PDF
        public_url = supabase.storage.from_("gurudesk-notes").get_public_url(file.filename)
        
        print(f"☁️ Cloud Note saved: {file.filename}")
        return {"status": "success", "filename": file.filename, "url": public_url}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/notes")
async def list_notes():
    try:
        # Ask Supabase for a list of all files in the bucket
        files_response = supabase.storage.from_("gurudesk-notes").list()
        
        # Extract just the filenames (ignoring hidden bucket configuration files)
        notes = [f["name"] for f in files_response if f["name"] != ".emptyFolderPlaceholder"]
        
        return {"status": "success", "notes": notes}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/notes/{filename}")
async def get_note(filename: str):
    try:
        # Generate the cloud URL and immediately redirect the user's browser to it
        public_url = supabase.storage.from_("gurudesk-notes").get_public_url(filename)
        return RedirectResponse(url=public_url)
    except Exception as e:
        return {"status": "error", "message": "File not found in cloud"}

# ==========================================
# 4. SUPABASE DATABASE ROUTES (Dashboards)
# ==========================================
@router.get("/grades")
async def get_grades():
    try:
        response = supabase.table("gradebook").select("*").eq("id", "master_gradebook").execute()
        if response.data:
            data = response.data[0]
            return {
                "status": "success", 
                "students": {
                    "className": data.get("class_name"),
                    "semester": data.get("semester"),
                    "assessments": data.get("assessments"),
                    "students": data.get("students")
                }
            }
        return {"status": "success", "students": []}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/grades")
async def update_grades(payload: GradebookPayload): # <-- Changed here
    try:
        row_data = {
            "id": "master_gradebook",
            "class_name": payload.className,
            "semester": payload.semester,
            "assessments": payload.assessments,
            "students": payload.students
        }
        supabase.table("gradebook").upsert(row_data).execute()
        return {"status": "success", "message": "Gradebook saved securely to Supabase!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
@router.get("/attendance")
async def get_attendance():
    try:
        response = supabase.table("attendance").select("*").eq("id", "master_attendance").execute()
        if response.data:
            data = response.data[0]
            return {
                "status": "success",
                "data": {
                    "isConfigured": data.get("is_configured"),
                    "startDate": data.get("start_date"),
                    "endDate": data.get("end_date"),
                    "attendanceData": data.get("attendance_data")
                }
            }
        return {"status": "success", "data": {}}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/attendance")
async def update_attendance(payload: AttendancePayload): # <-- Changed here
    try:
        row_data = {
            "id": "master_attendance",
            "is_configured": payload.isConfigured,
            "start_date": payload.startDate,
            "end_date": payload.endDate,
            "attendance_data": payload.attendanceData
        }
        supabase.table("attendance").upsert(row_data).execute()
        return {"status": "success", "message": "Attendance tracking updated!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
@router.get("/profile")
async def get_profile():
    try:
        response = supabase.table("profile").select("*").eq("id", "master_profile").execute()
        if response.data:
            return {"status": "success", "data": response.data[0]}
        
        return {"status": "success", "data": {
            "name": "Satish Kumar Sharma",
            "designation": "B.Tech CSE Student",
            "department": "Computer Science and Engineering",
            "email": "satish@example.com",
            "phone": "+91 0000000000",
            "office": "UIET CSJMU Kanpur",
            "education": "Currently enrolled",
            "research": "Artificial Intelligence, Machine Learning, Computer Vision",
            "scholar": "",
            "photo": ""
        }}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/profile")
async def update_profile(payload: ProfilePayload):  # <-- Changed here
    try:
        # Convert the Pydantic model to a standard dictionary
        row_data = payload.dict()
        row_data["id"] = "master_profile"
        
        supabase.table("profile").upsert(row_data).execute()
        return {"status": "success", "message": "Profile saved safely to the cloud!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
# ==========================================
# 5. SUPABASE STORAGE ROUTES (Images)
# ==========================================
@router.post("/upload-profile-pic")
async def upload_pic(file: UploadFile = File(...)):
    try:
        file_content = await file.read()
        file_path = f"profiles/{file.filename}"
        
        supabase.storage.from_("gurudesk-assets").upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        
        public_url = supabase.storage.from_("gurudesk-assets").get_public_url(file_path)
        return {"status": "success", "url": public_url}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
    # ==========================================
# PYDANTIC SCHEMAS (For Swagger UI)
# ==========================================
class ProfilePayload(BaseModel):
    name: str = "Test Name"
    designation: str = "Test Designation"
    department: str = "Computer Science"
    email: str = "test@example.com"
    phone: str = "+91 0000000000"
    office: str = "Room 101"
    education: str = "Ph.D."
    research: str = "AI, ML"
    scholar: str = ""
    photo: str = ""

class AttendancePayload(BaseModel):
    isConfigured: bool = True
    startDate: str = "2024-01-01"
    endDate: str = "2024-05-31"
    attendanceData: Dict[str, str] = {"2024-01-01": "Present"}

class GradebookPayload(BaseModel):
    className: str = "B.Tech CSE"
    semester: str = "Semester 4"
    assessments: List[Dict[str, Any]] = [{"id": "assign1", "name": "Assign 1", "max": 20}]
    students: List[Dict[str, Any]] = [{"id": 1, "roll": "CS-101", "name": "Alice", "marks": {"assign1": 18}}]