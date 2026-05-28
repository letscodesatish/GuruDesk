import fitz  # This is the import name for the PyMuPDF library
import os

def extract_text_from_pdf(file_path: str) -> str:
    """Reads a PDF file from the local path and returns all its text."""
    
    # 1. Check if the file actually exists on the server
    if not os.path.exists(file_path):
        return "Error: File not found."

    try:
        # 2. Open the PDF document
        doc = fitz.open(file_path)
        full_text = ""
        
        # 3. Loop through every single page and extract the text
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            full_text += page.get_text("text") + "\n\n"
            
        doc.close()
        
        # 4. Return the giant string of text so the AI can read it
        return full_text
        
    except Exception as e:
        return f"Error reading PDF: {str(e)}"