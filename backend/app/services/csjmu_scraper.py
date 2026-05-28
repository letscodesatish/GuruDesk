import httpx
from bs4 import BeautifulSoup
import os

# We make this function 'async' so it doesn't freeze the server while downloading
async def fetch_csjmu_syllabus(subject_name: str) -> str:
   # 1. Map common abbreviations to the exact website text
    subject_map = {
        "b.tech cse": "Computer Science and Engineering",
        "b.tech it": "Information Technology",
        "b.tech mech": "Mechanical Engineering"
    }
    
    # 2. Convert user input to lowercase and check if it's in our map
    search_term = subject_map.get(subject_name.lower(), subject_name)
    
    url = "https://csjmu.ac.in/uiet-kanpur/syllabus/" 
    # ... (the rest of the code remains the same, but BeautifulSoup will now search for search_term instead of subject_name)
    # 2. Make an asynchronous request to get the website's HTML
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        
    # 3. Parse the HTML using BeautifulSoup
    soup = BeautifulSoup(response.text, 'lxml')
    
    # 4. Find the link. We search for an <a> tag where the text matches the subject.
    # (This logic might need tweaking based on how CSJMU exactly names their links)
    link_tag = soup.find('a', string=lambda text: text and subject_name.lower() in text.lower())
    
    if not link_tag:
        return {"error": f"Syllabus for {subject_name} not found on CSJMU site."}
        
    pdf_url = link_tag['href']
    
    # 5. Download the actual PDF
    async with httpx.AsyncClient() as client:
        pdf_response = await client.get(pdf_url)
        
    # 6. Save it locally (temporarily) so we can process it later
    file_path = f"/tmp/{subject_name.replace(' ', '_')}_syllabus.pdf"
    
    with open(file_path, "wb") as f:
        f.write(pdf_response.content)
        
    return {"status": "success", "file_path": file_path}