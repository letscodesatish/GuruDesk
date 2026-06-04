import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

async def fetch_csjmu_syllabus(subject_name: str) -> dict:
    """Scrapes the CSJMU site using smart keyword matching for all branches."""
    
    subject_lower = subject_name.lower()
    
    # 1. THE DICTIONARY OF DEPARTMENTS: Maps the frontend choice to HTML keywords
    if "ai" in subject_lower or "artificial intelligence" in subject_lower:
        # Must check AI before standard CSE so they don't get mixed up!
        keywords = ["artificial intelligence", "cse(ai)", "ai"]
    elif "computer science" in subject_lower or "cse" in subject_lower:
        keywords = ["computer science", "cse"]
    elif "mechanical" in subject_lower:
        keywords = ["mechanical", "me"]
    elif "chemical" in subject_lower:
        keywords = ["chemical", "che"]
    elif "msme" in subject_lower or "material" in subject_lower:
        keywords = ["material", "metallurgical", "msme"]
    else:
        # Fallback
        keywords = [subject_lower]
        
    url = "https://csjmu.ac.in/uiet-kanpur/syllabus/"
    
    try:
        print(f"Scraping {url} for branch: {subject_name} using keywords: {keywords}...")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return {"error": "Website blocked the request."}
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        pdf_link = None
        
        for a_tag in soup.find_all('a', href=True):
            text = a_tag.text.lower()
            href = a_tag['href'].lower()
            
            if ".pdf" not in href:
                continue
                
            # If the link matches ANY of our department keywords, grab it!
            if any(keyword in text or keyword in href for keyword in keywords):
                pdf_link = a_tag['href']
                break
                
        if not pdf_link:
            return {"error": f"Could not find the PDF syllabus for '{subject_name}'."}
            
        full_pdf_url = urljoin(url, pdf_link)
        print(f"SUCCESS! Found PDF: {full_pdf_url}")
        
        return {"pdf_url": full_pdf_url}
        
    except Exception as e:
        return {"error": f"Scraping failed: {str(e)}"}