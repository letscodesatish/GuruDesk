"use client";

import { useState, useEffect } from "react";

// ============================================================================
// 1. MAIN LAYOUT & SIDEBAR
// ============================================================================
export default function GuruDesk() {
  const [activePage, setActivePage] = useState<"home" | "teaching" | "assessment" | "admin" | "profile">("teaching");

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* SIDEBAR NAVIGATION (Hidden during print) */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 flex-shrink-0 print:hidden">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">GuruDesk</h1>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <SidebarItem active={activePage === "home"} onClick={() => setActivePage("home")} icon="🏠" label="Home / Dashboard" />
          <SidebarItem active={activePage === "teaching"} onClick={() => setActivePage("teaching")} icon="📚" label="Teaching Prep" />
          <SidebarItem active={activePage === "assessment"} onClick={() => setActivePage("assessment")} icon="📝" label="Grading & Analytics" />
          <SidebarItem active={activePage === "admin"} onClick={() => setActivePage("admin")} icon="🏢" label="Administration" />
          <SidebarItem active={activePage === "profile"} onClick={() => setActivePage("profile")} icon="👨‍🏫" label="My Profile" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500 hover:text-white transition-colors font-medium">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 relative print:bg-white print:overflow-visible">
        {activePage === "home" && <HomeDashboardModule setActivePage={setActivePage} />}
        {activePage === "teaching" && <TeachingModule />}
        {activePage === "assessment" && <AssessmentModule />}
        {activePage === "admin" && <AdminModule />}
        {activePage === "profile" && <ProfileModule />}
      </main>

    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
        active ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function PlaceholderView({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-10 h-full flex flex-col items-center justify-center text-center animate-fade-in print:hidden">
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">{title}</h2>
        <p className="text-slate-500">{desc}</p>
        <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest border-t pt-4">Module Under Construction</p>
      </div>
    </div>
  );
}
// ============================================================================
// 2. TEACHING MODULE (Planner, Vault, Exam Builder) - COMPLETE & UNIFIED
// ============================================================================
function TeachingModule() {
  const [activeTab, setActiveTab] = useState<"planner" | "notes" | "assessment">("planner");

  // --- PLANNER STATES ---
  const [subject, setSubject] = useState("Computer Science and Engineering");
  const [weeks, setWeeks] = useState(14); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false); 
  const [savedRoadmaps, setSavedRoadmaps] = useState<any[]>([]);
  const [isSavingRoadmap, setIsSavingRoadmap] = useState(false);
  const [roadmapPdfUrl, setRoadmapPdfUrl] = useState<string | null>(null); 

  // --- NOTES STATES ---
  const [notesList, setNotesList] = useState<string[]>([]);
  const [noteUploadFile, setNoteUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- ASSESSMENT STATES ---
  const [assessmentFiles, setAssessmentFiles] = useState<File[]>([]); 
  const [paperTitle, setPaperTitle] = useState("Mid-Term Examination");
  const [timeAllowed, setTimeAllowed] = useState("3 Hrs");
  const [instructions, setInstructions] = useState("All questions are compulsory.");
  const [isGeneratingPaper, setIsGeneratingPaper] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<any>(null);
  const [criteria, setCriteria] = useState([{ id: Date.now(), count: 5, type: "MCQ", marks: 1 }]);
  
  // NEW: 3-Step Assessment States
  const [savedPapers, setSavedPapers] = useState<any[]>([]);
  const [isEditingPaper, setIsEditingPaper] = useState(false);
  const [isSavingPaper, setIsSavingPaper] = useState(false);
  const [paperPdfUrl, setPaperPdfUrl] = useState<string | null>(null);

  // ==========================================
  // INITIAL DATA FETCHING
  // ==========================================
  useEffect(() => {
    if (activeTab === "planner") {
      fetch("http://localhost:8080/api/v1/roadmaps")
        .then(res => res.json())
        .then(data => { if (data.status === "success") setSavedRoadmaps(data.data || []); });
    } else if (activeTab === "assessment") {
      fetch("http://localhost:8080/api/v1/papers")
        .then(res => res.json())
        .then(data => { if (data.status === "success") setSavedPapers(data.data || []); });
    }
  }, [activeTab]);

  // ==========================================
  // PLANNER API
  // ==========================================
  const handleDownloadPDF = async (e: any) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("http://localhost:8080/api/v1/download-syllabus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, weeks }) });
      const data = await response.json();
      if (data.status === "success") window.open(data.url, "_blank"); else setError(data.message || "Failed.");
    } catch { setError("Server connection failed."); } finally { setLoading(false); }
  };

  const handleGenerateRoadmap = async (e: any) => {
    e.preventDefault(); if (!imageFile) return setError("Upload screenshot first!");
    setLoading(true); setError(""); setRoadmapData(null); setIsEditing(false); setRoadmapPdfUrl(null);
    try {
      const formData = new FormData(); formData.append("file", imageFile); formData.append("subject", subject); formData.append("weeks", weeks.toString()); 
      const response = await fetch("http://localhost:8080/api/v1/generate-roadmap-image", { method: "POST", body: formData });
      const data = await response.json();
      if (data.status === "success") setRoadmapData(data.data);
      else setError(data.message || "Failed.");
    } catch { setError("Server connection failed."); } finally { setLoading(false); }
  };

  const handleSaveRoadmap = async () => {
    setIsSavingRoadmap(true);
    try {
      const response = await fetch("http://localhost:8080/api/v1/save-roadmap-pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, roadmap_data: roadmapData })
      });
      const data = await response.json();
      if (data.status === "success") {
        setRoadmapPdfUrl(data.pdf_url);
        alert("✅ Successfully saved as PDF to Supabase Cloud Dashboard!");
        const freshRes = await fetch("http://localhost:8080/api/v1/roadmaps");
        const freshData = await freshRes.json();
        if (freshData.status === "success") setSavedRoadmaps(freshData.data || []);
      }
    } finally { setIsSavingRoadmap(false); }
  };

  const updateWeekData = (weekIndex: number, field: string, value: string) => {
    const newData = { ...roadmapData };
    newData.roadmap[weekIndex].topics_to_cover = value.split('\n');
    setRoadmapData(newData);
  };

  // ==========================================
  // NOTES API
  // ==========================================
  const fetchNotes = async () => {
    try { const res = await fetch("http://localhost:8080/api/v1/notes"); const data = await res.json(); if (data.status === "success") setNotesList(data.notes); } catch (err) {}
  };
  useEffect(() => { if (activeTab === "notes") fetchNotes(); }, [activeTab]);

  const handleUploadNote = async (e: any) => {
    e.preventDefault(); if (!noteUploadFile) return; setIsUploading(true);
    try {
      const formData = new FormData(); formData.append("file", noteUploadFile);
      const res = await fetch("http://localhost:8080/api/v1/upload-note", { method: "POST", body: formData });
      const data = await res.json(); if (data.status === "success") { setNoteUploadFile(null); fetchNotes(); }
    } finally { setIsUploading(false); }
  };

  // ==========================================
  // ASSESSMENT API
  // ==========================================
  const handleFileSelection = (e: any) => { if (e.target.files) setAssessmentFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]); };
  const removeAssessmentFile = (indexToRemove: number) => setAssessmentFiles(assessmentFiles.filter((_, index) => index !== indexToRemove));
  const addCriteriaRow = () => setCriteria([...criteria, { id: Date.now(), count: 1, type: "Short Answer", marks: 5 }]);
  const removeCriteriaRow = (id: number) => { if (criteria.length > 1) setCriteria(criteria.filter(c => c.id !== id)); };
  const updateCriteria = (id: number, field: string, value: string | number) => setCriteria(criteria.map(c => c.id === id ? { ...c, [field]: value } : c));

  // 1. GENERATE
  const handleGeneratePaper = async (e: any) => {
    e.preventDefault(); if (assessmentFiles.length === 0) return alert("Upload PDF first!");
    setIsGeneratingPaper(true); setGeneratedPaper(null); setPaperPdfUrl(null); setIsEditingPaper(false);
    try {
      const formData = new FormData(); assessmentFiles.forEach((file) => formData.append("files", file));
      formData.append("criteria", JSON.stringify(criteria)); 
      
      const res = await fetch("http://localhost:8080/api/v1/generate-paper", { method: "POST", body: formData });
      const data = await res.json(); 
      if (data.status === "success") setGeneratedPaper(data.data); 
      else alert(data.message || "Failed.");
    } finally { setIsGeneratingPaper(false); }
  };

  // 2. SAVE AS PDF
  const handleSavePaper = async () => {
    setIsSavingPaper(true);
    try {
      const response = await fetch("http://localhost:8080/api/v1/save-paper-pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: paperTitle, 
          timeAllowed: timeAllowed, 
          instructions: instructions, 
          paper_data: generatedPaper 
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setPaperPdfUrl(data.pdf_url);
        alert("✅ Question Paper securely saved to Supabase!");
        const freshRes = await fetch("http://localhost:8080/api/v1/papers");
        const freshData = await freshRes.json();
        if (freshData.status === "success") setSavedPapers(freshData.data || []);
      }
    } finally { setIsSavingPaper(false); }
  };

  // 3. EDIT QUESTIONS
  const updateQuestionData = (secIndex: number, qIndex: number, value: string) => {
    const newData = { ...generatedPaper };
    newData.sections[secIndex].questions[qIndex].question_text = value;
    setGeneratedPaper(newData);
    setPaperPdfUrl(null); 
  };

  return (
    <div className="p-8 text-slate-800 w-full max-w-6xl mx-auto">
      <div className="space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Teaching Preparation</h1>
          <p className="text-slate-500 mt-1">Manage your curriculum, notes, and build exams.</p>
        </header>
        <div className="flex bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden p-1">
          <button onClick={() => setActiveTab("planner")} className={`flex-1 py-3 px-4 font-bold text-sm rounded-md transition-all ${activeTab === "planner" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>🧠 Curriculum Planner</button>
          <button onClick={() => setActiveTab("notes")} className={`flex-1 py-3 px-4 font-bold text-sm rounded-md transition-all ${activeTab === "notes" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>📚 My Vault</button>
          <button onClick={() => setActiveTab("assessment")} className={`flex-1 py-3 px-4 font-bold text-sm rounded-md transition-all ${activeTab === "assessment" ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>📝 Exam Builder</button>
        </div>
        
        {/* ========================================================= */}
        {/* --- PLANNER UI --- */}
        {/* ========================================================= */}
        {activeTab === "planner" && (
          <div className="space-y-8 animate-fade-in">
            {/* SECTION 1: View Saved Roadmaps */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">📂 Your Saved Roadmaps</h3>
              {(!savedRoadmaps || savedRoadmaps.length === 0) ? (
                <p className="text-sm text-slate-500 italic">No roadmaps saved yet.</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {savedRoadmaps.map((map) => (
                    <div key={map.id} className="min-w-[200px] bg-slate-50 p-4 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                      <p className="font-bold text-sm text-slate-800 truncate mb-3">{map.subject}</p>
                      <button onClick={() => window.open(map.pdf_url, "_blank")} className="w-full py-2 text-sm bg-blue-100 text-blue-800 font-bold rounded hover:bg-blue-200 transition-colors flex justify-center items-center gap-2">
                        👁️ View & Print PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: Generate New Roadmap */}
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">✨ Create New Roadmap</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">1. Select Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-slate-300 rounded-md p-3 text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Computer Science and Engineering">Computer Science and Engineering (CSE)</option>
                    <option value="Artificial Intelligence">CSE (Artificial Intelligence)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">2. Target Course Duration: <span className="text-blue-600 font-bold">{weeks} Weeks</span></label>
                  <input type="range" min="4" max="20" value={weeks} onChange={(e) => setWeeks(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-4" />
                </div>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-md p-6 text-center bg-slate-50 hover:bg-slate-100">
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 cursor-pointer" />
              </div>
              
              <div className="flex gap-4">
                <button onClick={handleDownloadPDF} disabled={loading} className="w-1/3 bg-slate-800 text-white font-semibold py-3 rounded-md hover:bg-slate-900 shadow">View Full PDF</button>
                <button onClick={handleGenerateRoadmap} disabled={loading || !imageFile} className="w-2/3 bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 disabled:bg-blue-300 shadow">
                  {loading ? "AI is Analyzing..." : "Generate Interactive Roadmap"}
                </button>
              </div>
            </div>
            
            {/* SECTION 3: Results & Save Action */}
            {roadmapData && (
              <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-blue-600">
                <div className="mb-6 border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{roadmapData.course_title || subject}</h2>
                    <p>Adjustable {roadmapData.total_weeks || weeks}-Week Plan</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 bg-slate-200 rounded-md font-medium shadow-sm hover:bg-slate-300 transition">
                      {isEditing ? "Lock Plan" : "Edit Details"}
                    </button>
                    <button onClick={() => { if (roadmapPdfUrl) window.open(roadmapPdfUrl, "_blank"); else alert("Please click '☁️ Save to Supabase' first!"); }} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md font-bold shadow-sm hover:bg-slate-300 transition-colors flex items-center gap-2">
                      🖨️ Print PDF
                    </button>
                    <button onClick={handleSaveRoadmap} disabled={isSavingRoadmap || roadmapPdfUrl !== null} className={`px-4 py-2 font-bold rounded-md shadow-sm transition-colors flex items-center gap-2 ${roadmapPdfUrl ? "bg-green-600 text-white cursor-not-allowed" : "bg-slate-800 text-white hover:bg-slate-900"}`}>
                      {roadmapPdfUrl ? "✅ Saved as PDF" : (isSavingRoadmap ? "⏳ Saving..." : "☁️ Save to Supabase")}
                    </button>
                  </div>
                </div>     

                <div className="max-h-[650px] overflow-y-auto pr-2 space-y-6">
                  {roadmapData.roadmap.map((week: any, index: number) => (
                     <div key={week.week_number} className="flex gap-6 bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm">
                        <div className="bg-blue-100 text-blue-800 font-bold px-4 py-2 rounded-md text-center shrink-0 h-fit">
                           <span className="block text-xs uppercase">Week</span>
                           <span className="block text-2xl">{week.week_number}</span>
                        </div>
                        <div className="flex-grow space-y-3">
                          <h3 className="text-sm font-bold uppercase">Topics:</h3>
                          {isEditing ? (
                            <textarea className="w-full bg-white border p-3 rounded-md min-h-[100px]" value={week.topics_to_cover.join('\n')} onChange={(e) => updateWeekData(index, "topics", e.target.value)} />
                          ) : (
                            <ul className="list-disc ml-4 text-slate-800">
                              {week.topics_to_cover.map((t: string, i: number) => <li key={i}>{t}</li>)}
                            </ul>
                          )}
                        </div>
                     </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* --- NOTES UI --- */}
        {/* ========================================================= */}
        {activeTab === "notes" && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex-grow">
                  <input type="file" onChange={(e) => setNoteUploadFile(e.target.files?.[0] || null)} className="w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 cursor-pointer" />
                </div>
                <button onClick={handleUploadNote} disabled={!noteUploadFile || isUploading} className="bg-green-600 text-white px-6 py-2 rounded-md font-bold hover:bg-green-700 whitespace-nowrap">{isUploading ? "Uploading..." : "Save Note to Vault"}</button>
             </div>
             <div className="bg-white p-6 rounded-lg shadow-md border space-y-4 border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">📂 Personal Teaching Vault</h2>
                {notesList.length === 0 ? (
                  <div className="text-center p-12 bg-slate-50 rounded-md border-2 border-dashed border-slate-200 text-slate-500">No notes uploaded yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {notesList.map((file) => (
                      <div key={file} className="flex justify-between items-center p-4 bg-slate-50 border rounded-lg border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📄</span>
                          <span className="font-semibold text-slate-800">{file}</span>
                        </div>
                        <button onClick={() => window.open(`http://localhost:8080/api/v1/notes/${file}`, "_blank")} className="text-blue-700 bg-blue-100 px-4 py-2 rounded-md font-bold hover:bg-blue-200">👁️ Open</button>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* --- EXAM BUILDER UI --- */}
        {/* ========================================================= */}
        {activeTab === "assessment" && (
           <div className="space-y-8 animate-fade-in">
              
              {/* SECTION 1: View Saved Papers */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">📂 Your Saved Papers</h3>
                {(!savedPapers || savedPapers.length === 0) ? (
                  <p className="text-sm text-slate-500 italic">No question papers saved yet.</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {savedPapers.map((paper) => (
                      <div key={paper.id} className="min-w-[200px] bg-slate-50 p-4 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
                        <p className="font-bold text-sm text-slate-800 truncate mb-3">{paper.title}</p>
                        <button onClick={() => window.open(paper.pdf_url, "_blank")} className="w-full py-2 text-sm bg-purple-100 text-purple-800 font-bold rounded hover:bg-purple-200 transition-colors flex justify-center items-center gap-2">
                          👁️ View & Print PDF
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: Generate New Paper */}
              <div className="bg-white p-8 rounded-lg shadow-md space-y-8 border border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">1. Exam Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Paper Title</label>
                      <input type="text" value={paperTitle} onChange={(e) => setPaperTitle(e.target.value)} className="w-full border border-slate-300 rounded p-3 bg-white text-black focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Time Allowed</label>
                      <input type="text" value={timeAllowed} onChange={(e) => setTimeAllowed(e.target.value)} placeholder="e.g. 3 Hrs" className="w-full border border-slate-300 rounded p-3 bg-white text-black focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Important Instructions</label>
                      <input type="text" value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full border border-slate-300 rounded p-3 bg-white text-black focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">2. Source Material (Upload PDFs)</h3>
                  <div className="border-2 border-dashed border-slate-300 rounded-md p-6 text-center bg-slate-50 hover:bg-slate-100 mb-4">
                    <input type="file" accept="application/pdf" multiple onChange={handleFileSelection} className="w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 cursor-pointer" />
                  </div>
                  {assessmentFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-700">Attached Documents:</p>
                      {assessmentFiles.map((f, i) => (
                        <div key={i} className="flex justify-between items-center text-sm font-bold text-blue-800 bg-blue-50 p-3 rounded border border-blue-100">
                          <span>📄 {f.name}</span>
                          <button onClick={() => removeAssessmentFile(i)} className="text-red-500 hover:text-red-700 text-lg">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">3. Design Question Structure</h3>
                  <div className="space-y-4">
                    {criteria.map((row) => (
                      <div key={row.id} className="flex gap-4 items-center bg-slate-50 p-4 rounded-md border border-slate-200">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-slate-500 uppercase">No. of Questions</label>
                          <input type="number" min="1" value={row.count} onChange={(e) => updateCriteria(row.id, "count", parseInt(e.target.value))} className="mt-1 w-full border rounded p-2 outline-none focus:border-blue-500 text-black bg-white" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-slate-500 uppercase">Question Type</label>
                          <select value={row.type} onChange={(e) => updateCriteria(row.id, "type", e.target.value)} className="mt-1 w-full border rounded p-2 outline-none focus:border-blue-500 bg-white text-black">
                            <option value="MCQ">Multiple Choice (MCQ)</option>
                            <option value="One Word">One Word Answer</option>
                            <option value="Short Answer">Short Answer</option>
                            <option value="Long Answer">Long Answer</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-slate-500 uppercase">Marks (Each)</label>
                          <input type="number" min="1" value={row.marks} onChange={(e) => updateCriteria(row.id, "marks", parseInt(e.target.value))} className="mt-1 w-full border rounded p-2 outline-none focus:border-blue-500 text-black bg-white" />
                        </div>
                        <button onClick={() => removeCriteriaRow(row.id)} disabled={criteria.length === 1} className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-30">✖</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={addCriteriaRow} className="mt-4 text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">➕ Add Another Section</button>
                </div>

                <button onClick={handleGeneratePaper} disabled={isGeneratingPaper || assessmentFiles.length === 0} className="w-full bg-blue-600 text-white font-bold py-4 rounded-md hover:bg-blue-700 shadow flex justify-center items-center gap-2">
                  {isGeneratingPaper ? "Reading Notes & Writing Exam..." : "Generate Question Paper"}
                </button>
              </div>

              {/* SECTION 3: Results & Save Action */}
              {generatedPaper && (
                <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-purple-600">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
                    <div>
                      <h3 className="font-bold text-xl text-slate-800">{paperTitle}</h3>
                      <p className="text-slate-500">Review, edit, and save your paper.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setIsEditingPaper(!isEditingPaper)} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md shadow-sm hover:bg-slate-300 transition">
                        {isEditingPaper ? "Lock Paper" : "Edit Questions"}
                      </button>
                      <button onClick={() => { if (paperPdfUrl) window.open(paperPdfUrl, "_blank"); else alert("Please click '☁️ Save to Supabase' first!"); }} className="px-4 py-2 bg-purple-100 text-purple-700 font-semibold rounded-md shadow-sm hover:bg-purple-200 transition">
                        🖨️ Print PDF
                      </button>
                      <button onClick={handleSavePaper} disabled={isSavingPaper || paperPdfUrl !== null} className={`px-4 py-2 font-semibold rounded-md shadow-sm transition ${paperPdfUrl ? "bg-green-600 text-white cursor-not-allowed" : "bg-slate-800 text-white hover:bg-slate-900"}`}>
                        {paperPdfUrl ? "✅ Saved as PDF" : (isSavingPaper ? "⏳ Saving..." : "☁️ Save to Supabase")}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 text-black p-8 border border-slate-200 rounded-lg max-h-[600px] overflow-y-auto">
                    <div className="text-center border-b-2 border-black pb-4 mb-6">
                      <h1 className="text-2xl font-bold uppercase tracking-wider">{paperTitle}</h1>
                      <div className="flex justify-between mt-4 font-semibold text-black">
                        <span>Time Allowed: {timeAllowed}</span>
                        <span>Maximum Marks: {generatedPaper.total_marks || "100"}</span>
                      </div>
                      <div className="text-left mt-4 text-sm italic border border-slate-300 p-3 bg-white text-slate-800 rounded">
                        Note: {instructions}
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      {generatedPaper.sections?.map((sec: any, secIndex: number) => (
                        <div key={secIndex}>
                          <h2 className="text-lg font-bold underline mb-4">{sec.section_title}</h2>
                          <div className="space-y-4">
                            {sec.questions.map((q: any, qIndex: number) => (
                              <div key={qIndex} className="flex justify-between items-start gap-4">
                                <div className="flex gap-2 flex-grow text-black font-medium">
                                  <span className="shrink-0">Q{qIndex+1}.</span>
                                  {isEditingPaper ? (
                                    <textarea className="w-full border p-2 rounded outline-none focus:border-blue-500 min-h-[60px]" value={q.question_text} onChange={(e) => updateQuestionData(secIndex, qIndex, e.target.value)} />
                                  ) : (
                                    <span className="leading-relaxed">{q.question_text}</span>
                                  )}
                                </div>
                                <span className="font-bold text-slate-800 shrink-0">[{q.marks}]</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}
// 3. GRADEBOOK MODULE (AssessmentModule) WITH CSV EXPORT
// ============================================================================
function AssessmentModule() {
  const [className, setClassName] = useState("B.Tech CSE");
  const [semester, setSemester] = useState("Semester 4");
  const [assessments, setAssessments] = useState([{ id: "assign1", name: "Assign 1", max: 20 }, { id: "midterm", name: "Midterm", max: 30 }, { id: "final", name: "Final", max: 50 }]);
  const [students, setStudents] = useState<any[]>([{ id: 1, roll: "CS-101", name: "Alice Johnson", marks: { assign1: 18, midterm: 26, final: 48 } }]);
  const [isSaving, setIsSaving] = useState(false); const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/v1/grades").then(res => res.json()).then(data => {
      if (data.status === "success" && data.students) {
        if(data.students.className) setClassName(data.students.className);
        if(data.students.semester) setSemester(data.students.semester);
        if(data.students.assessments) setAssessments(data.students.assessments);
        if(data.students.students) setStudents(data.students.students);
      }
    });
  }, []);

  const handleSaveGradebook = async () => {
    setIsSaving(true); setSaveMessage("");
    try {
      await fetch("http://localhost:8080/api/v1/grades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ className, semester, assessments, students }) });
      setSaveMessage("✅ Saved!"); setTimeout(() => setSaveMessage(""), 3000);
    } finally { setIsSaving(false); }
  };

  // --- NEW: EXPORT CSV FUNCTION ---
  const handleExportCSV = () => {
    // 1. Build Header Row
    let csvContent = "Roll No.,Student Name,";
    assessments.forEach(a => csvContent += `${a.name} (Max ${a.max}),`);
    csvContent += "Total,Percentage,Grade,GP\n";

    // 2. Build Student Rows
    students.forEach(stu => {
      const total = assessments.reduce((s, a) => s + (stu.marks[a.id] || 0), 0);
      const percent = totalMax === 0 ? 0 : parseFloat(((total/totalMax)*100).toFixed(1));
      const grade = getGrade(percent);
      
      let row = `${stu.roll},${stu.name},`;
      assessments.forEach(a => row += `${stu.marks[a.id] || 0},`);
      row += `${total},${percent}%,${grade.letter},${grade.gp}\n`;
      
      csvContent += row;
    });

    // 3. Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${className}_${semester}_Grades.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddAssessment = () => { const newId = `col_${Date.now()}`; setAssessments([...assessments, { id: newId, name: "New Col", max: 10 }]); setStudents(students.map(s => ({ ...s, marks: { ...s.marks, [newId]: 0 } }))); };
  const handleEditAssessment = (id: string, field: string, val: string) => setAssessments(assessments.map(a => a.id === id ? { ...a, [field]: field === "max" ? (parseInt(val)||0) : val } : a));
  const handleDeleteAssessment = (id: string) => { if(assessments.length > 1) setAssessments(assessments.filter(a => a.id !== id)); };
  
  const handleAddStudent = () => {
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const emptyMarks: any = {}; assessments.forEach(a => { emptyMarks[a.id] = 0; });
    setStudents([...students, { id: newId, roll: `CS-${100+newId}`, name: "New Student", marks: emptyMarks }]);
  };

  const handleMarkChange = (id: number, col: string, val: string) => {
    let num = parseInt(val) || 0; const maxLimit = assessments.find(a => a.id === col)?.max || 100;
    if (num > maxLimit) num = maxLimit; if (num < 0) num = 0;
    setStudents(students.map(s => s.id === id ? { ...s, marks: { ...s.marks, [col]: num } } : s));
  };

  const totalMax = assessments.reduce((sum, a) => sum + (a.max || 0), 0);
  const getGrade = (p: number) => {
    if (p >= 90) return { letter: "A+", gp: 10, color: "text-emerald-800 bg-emerald-100" };
    if (p >= 80) return { letter: "A", gp: 9, color: "text-green-800 bg-green-100" };
    if (p >= 70) return { letter: "B+", gp: 8, color: "text-blue-800 bg-blue-100" };
    if (p >= 60) return { letter: "B", gp: 7, color: "text-indigo-800 bg-indigo-100" };
    if (p >= 50) return { letter: "C", gp: 6, color: "text-yellow-800 bg-yellow-100" };
    if (p >= 40) return { letter: "D", gp: 5, color: "text-orange-800 bg-orange-100" };
    return { letter: "F", gp: 0, color: "text-red-800 bg-red-100" }; 
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto animate-fade-in">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Smart Gradebook</h1>
        </div>
        
        {/* ADDED EXPORT BUTTON */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold">{saveMessage}</span>
          <button onClick={handleExportCSV} className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 shadow-md transition-all flex gap-2 items-center">
            📥 Export to CSV
          </button>
          <button onClick={handleSaveGradebook} disabled={isSaving} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md disabled:bg-slate-400 transition-all">
            {isSaving ? "Saving..." : "💾 Save Gradebook"}
          </button>
        </div>
      </header>
      
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center gap-4">
          <div className="flex gap-2 items-center font-bold"><span>Class:</span><input className="border-b border-dashed outline-none focus:border-blue-500 bg-transparent px-1" value={className} onChange={e=>setClassName(e.target.value)} /><span>(</span><input className="border-b border-dashed outline-none w-24 text-center focus:border-blue-500 bg-transparent" value={semester} onChange={e=>setSemester(e.target.value)} /><span>)</span></div>
          <div className="flex gap-2"><button onClick={handleAddAssessment} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded font-bold hover:bg-indigo-200">➕ Add Column</button><button onClick={handleAddStudent} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow-sm">➕ Add Student</button></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100 text-sm uppercase border-b text-slate-600 tracking-wider">
                <th className="p-4 font-bold w-32">Roll No.</th><th className="p-4 font-bold w-48">Name</th>
                {assessments.map((col) => (
                  <th key={col.id} className="p-2 text-center border-l min-w-[120px] group relative">
                    <input value={col.name} onChange={e=>handleEditAssessment(col.id, "name", e.target.value)} className="w-full text-center bg-transparent font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 rounded px-1 text-slate-700" />
                    <div className="text-xs text-slate-400 flex items-center justify-center mt-1">Max: <input type="number" value={col.max||""} onChange={e=>handleEditAssessment(col.id, "max", e.target.value)} className="w-12 bg-transparent text-center outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 rounded ml-1" /></div>
                    <button onClick={() => handleDeleteAssessment(col.id)} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 font-bold bg-red-50 w-6 h-6 rounded-full flex items-center justify-center">✕</button>
                  </th>
                ))}
                <th className="p-4 text-center border-l bg-blue-50">Total</th><th className="p-4 text-center bg-blue-50">%</th><th className="p-4 text-center bg-blue-50">Grade</th><th className="p-4 text-center bg-blue-50 border-l border-blue-200">GP</th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((stu) => {
                const total = assessments.reduce((s, a) => s + (stu.marks[a.id] || 0), 0);
                const percent = totalMax === 0 ? 0 : parseFloat(((total/totalMax)*100).toFixed(1));
                const grade = getGrade(percent);
                return (
                  <tr key={stu.id} className="border-b hover:bg-slate-50">
                    <td className="p-2"><input value={stu.roll} onChange={e=>setStudents(students.map(s => s.id === stu.id ? { ...s, roll: e.target.value } : s))} className="w-full bg-transparent p-2 outline-none font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 rounded" /></td>
                    <td className="p-2"><input value={stu.name} onChange={e=>setStudents(students.map(s => s.id === stu.id ? { ...s, name: e.target.value } : s))} className="w-full bg-transparent p-2 outline-none font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded" /></td>
                    {assessments.map(col => (
                      <td key={col.id} className="p-2 border-l border-slate-200"><input type="number" value={stu.marks[col.id]||""} onChange={e=>handleMarkChange(stu.id, col.id, e.target.value)} className="w-full text-center bg-transparent outline-none font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 rounded" /></td>
                    ))}
                    <td className="p-4 text-center font-bold bg-blue-50/50 text-slate-800 border-l-2 border-blue-200">{total}</td>
                    <td className="p-4 text-center font-bold bg-blue-50/50 text-slate-700">{percent}%</td>
                    <td className="p-4 text-center bg-blue-50/50"><span className={`px-3 py-1 rounded-full font-bold text-sm border ${grade.color}`}>{grade.letter}</span></td>
                    <td className="p-4 text-center font-bold bg-blue-50/50 text-slate-900 border-l border-blue-100">{grade.gp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. ADMIN MODULE (Professor Attendance)
// ============================================================================
function AdminModule() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [startDate, setStartDate] = useState(""); 
  const [endDate, setEndDate] = useState("");
  const [attendanceData, setAttendanceData] = useState<Record<string, "Present" | "Absent" | "Holiday" | "Pending">>({});
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8080/api/v1/attendance")
      .then(res => res.json())
      .then(json => {
        if (json.status === "success" && json.data && json.data.isConfigured) {
          setIsConfigured(true); 
          setStartDate(json.data.startDate); 
          setEndDate(json.data.endDate);
          setAttendanceData(json.data.attendanceData); 
          // Append time to prevent timezone shifting
          setCurrentViewDate(new Date(json.data.startDate + "T00:00:00")); 
        }
      })
      .catch(err => console.error("Failed to load attendance", err));
  }, []);

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    await fetch("http://localhost:8080/api/v1/attendance", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ isConfigured, startDate, endDate, attendanceData }) 
    });
    setIsSaving(false);
  };

  const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const handleGenerateTracker = () => {
    if (!startDate || !endDate) return alert("Please select dates.");
    
    // Append T00:00:00 to force local timezone calculation
    const start = new Date(startDate + "T00:00:00"); 
    const end = new Date(endDate + "T00:00:00"); 
    const today = new Date();
    
    if (start > end) return alert("Start date must be before end date.");

    const newData: any = {}; 
    let current = new Date(start);
    
    while (current <= end) {
      const dateStr = formatDate(current);
      if (current > today) newData[dateStr] = "Pending";
      else if (current.getDay() === 0) newData[dateStr] = "Holiday";
      else newData[dateStr] = "Present";
      
      current.setDate(current.getDate() + 1);
    }
    setAttendanceData(newData); 
    setCurrentViewDate(start); 
    setIsConfigured(true);
  };

  const toggleStatus = (dateStr: string) => {
    setAttendanceData(prev => {
      const cur = prev[dateStr]; 
      if (cur === "Pending" || !cur) return prev; 
      
      let nxt: any = "Present"; 
      if (cur === "Present") nxt = "Absent"; 
      else if (cur === "Absent") nxt = "Holiday";
      
      return { ...prev, [dateStr]: nxt };
    });
  };

  const present = Object.values(attendanceData).filter(s => s === "Present").length;
  const absent = Object.values(attendanceData).filter(s => s === "Absent").length;
  const total = present + absent; 
  const pct = total === 0 ? 0 : ((present / total) * 100).toFixed(1);

  // TypeScript Safe Calendar Generation
  const firstDay = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0).getDate();
  
  const emptyDays: (Date | null)[] = Array(firstDay).fill(null);
  const monthDays: (Date | null)[] = Array.from({ length: daysInMonth }, (_, i) => new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), i + 1));
  const calDays = [...emptyDays, ...monthDays];

  return (
    <div className="p-8 w-full max-w-5xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Professor Attendance</h1>
          <p className="text-slate-500 mt-1">Manage your semester timeline and personal attendance records.</p>
        </div>
        {isConfigured && <button onClick={handleSaveAttendance} disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded font-bold shadow-md">{isSaving ? "Saving..." : "💾 Save Attendance"}</button>}
      </header>

      {!isConfigured ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border max-w-lg mx-auto">
          <label className="block text-sm font-bold text-slate-600 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full border rounded-md p-3 mb-4 outline-none focus:border-blue-500" />
          
          <label className="block text-sm font-bold text-slate-600 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full border rounded-md p-3 mb-6 outline-none focus:border-blue-500" />
          
          <button onClick={handleGenerateTracker} className="w-full bg-blue-600 text-white p-3 font-bold rounded-md shadow hover:bg-blue-700">Generate Tracker</button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-white p-6 shadow-sm border rounded-xl"><div className="text-sm font-bold text-slate-500 uppercase">Total Classes</div><div className="text-3xl font-black mt-2">{total}</div></div>
            <div className="bg-white p-6 shadow-sm border rounded-xl"><div className="text-sm font-bold text-green-600 uppercase">Present</div><div className="text-3xl font-black text-green-700 mt-2">{present}</div></div>
            <div className="bg-white p-6 shadow-sm border rounded-xl"><div className="text-sm font-bold text-red-500 uppercase">Absent</div><div className="text-3xl font-black text-red-600 mt-2">{absent}</div></div>
            <div className="bg-blue-600 text-white p-6 shadow-md rounded-xl"><div className="text-sm font-bold text-blue-200 uppercase">Attendance %</div><div className="text-4xl font-black mt-2">{pct}%</div></div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="flex justify-between p-6 bg-slate-50 border-b">
              <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1))} className="px-4 py-2 bg-white border rounded font-bold hover:bg-slate-100">← Prev</button>
              <h3 className="text-xl font-bold">{currentViewDate.toLocaleString('default', { month: 'long' })} {currentViewDate.getFullYear()}</h3>
              <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1))} className="px-4 py-2 bg-white border rounded font-bold hover:bg-slate-100">Next →</button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-7 gap-4 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-bold text-slate-400 text-sm">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-4">
                {calDays.map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} className="h-24"></div>;
                  
                  const dStr = formatDate(date); 
                  const status = attendanceData[dStr];
                  
                  let style = "bg-slate-50 text-slate-400"; 
                  let cursor = "cursor-default";

                  if (status === "Present") { style = "bg-green-50 border-green-300 text-green-800 shadow-sm"; cursor = "cursor-pointer hover:ring-2 ring-green-400"; }
                  if (status === "Absent") { style = "bg-red-50 border-red-300 text-red-800 shadow-sm"; cursor = "cursor-pointer hover:ring-2 ring-red-400"; }
                  if (status === "Holiday") { style = "bg-slate-100 border-slate-300 text-slate-500 shadow-sm"; cursor = "cursor-pointer hover:ring-2 ring-slate-400"; }
                  if (status === "Pending") { style = "bg-white border-dashed border-slate-300 text-slate-400"; cursor = "cursor-not-allowed opacity-60"; }
                  
                  return (
                    <div key={dStr} onClick={() => status && status !== "Pending" && toggleStatus(dStr)} className={`h-24 rounded-lg border p-2 flex flex-col justify-between select-none transition-all ${style} ${cursor}`}>
                      <span className="font-bold text-lg">{date.getDate()}</span>
                      {status && <span className="text-xs font-bold uppercase text-center">{status}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. PROFILE MODULE 
// ============================================================================
function ProfileModule() {
  const [isEditing, setIsEditing] = useState(false); const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({ name: "Satish Kumar Sharma", designation: "B.Tech CSE Student", department: "Computer Science and Engineering", email: "satish@example.com", phone: "+91 0000000000", office: "UIET CSJMU Kanpur", education: "Currently enrolled", research: "Artificial Intelligence, Machine Learning, Computer Vision", scholar: "", photo: "" });

  useEffect(() => {
    fetch("http://localhost:8080/api/v1/profile").then(res => res.json()).then(json => { if (json.status === "success" && json.data) setProfile(json.data); });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await fetch("http://localhost:8080/api/v1/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    setIsEditing(false); setIsSaving(false);
  };

  const handleProfilePicUpload = async (e: any) => {
    const file = e.target.files?.[0]; if (!file) return;
    const formData = new FormData(); formData.append("file", file);
    const res = await fetch("http://localhost:8080/api/v1/upload-profile-pic", { method: "POST", body: formData });
    const data = await res.json(); if (data.status === "success") setProfile({ ...profile, photo: data.filename });
  };

  const handleChange = (f: string, v: string) => setProfile({ ...profile, [f]: v });

  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div><h1 className="text-3xl font-bold">My Profile</h1></div>
        {isEditing ? <button onClick={handleSave} disabled={isSaving} className="bg-green-600 text-white px-6 py-2 rounded font-bold">💾 Save</button> 
        : <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-6 py-2 rounded font-bold">✏️ Edit</button>}
      </header>
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="bg-slate-50 border-b p-8 flex items-center gap-6">
          <input type="file" id="profilePicUpload" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
          <div onClick={() => isEditing && document.getElementById('profilePicUpload')?.click()} className={`w-24 h-24 rounded-full bg-slate-300 border-4 border-white shadow flex items-center justify-center text-4xl overflow-hidden relative group ${isEditing ? "cursor-pointer" : ""}`}>
            {profile.photo ? <img src={`http://localhost:8080/api/v1/profile_pics/${profile.photo}`} className="w-full h-full object-cover" /> : "👨‍🏫"}
            {isEditing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100">Upload</div>}
          </div>
          <div className="flex-1">
            {isEditing ? <input value={profile.name} onChange={e=>handleChange("name", e.target.value)} className="w-full text-2xl font-bold border rounded p-2 mb-2" /> : <h2 className="text-2xl font-bold">{profile.name}</h2>}
            {isEditing ? <input value={profile.designation} onChange={e=>handleChange("designation", e.target.value)} className="w-1/2 border rounded p-1" /> : <p className="text-slate-500">{profile.designation}</p>}
          </div>
        </div>
        <div className="p-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-slate-400 uppercase mb-4 border-b">Contact</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-slate-500">Email</label>{isEditing ? <input value={profile.email} onChange={e=>handleChange("email", e.target.value)} className="w-full border rounded p-2" /> : <p>{profile.email}</p>}</div>
              <div><label className="text-xs font-bold text-slate-500">Phone</label>{isEditing ? <input value={profile.phone} onChange={e=>handleChange("phone", e.target.value)} className="w-full border rounded p-2" /> : <p>{profile.phone}</p>}</div>
              <div><label className="text-xs font-bold text-slate-500">Location</label>{isEditing ? <input value={profile.office} onChange={e=>handleChange("office", e.target.value)} className="w-full border rounded p-2" /> : <p>{profile.office}</p>}</div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-400 uppercase mb-4 border-b">Academic</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-slate-500">Department</label>{isEditing ? <input value={profile.department} onChange={e=>handleChange("department", e.target.value)} className="w-full border rounded p-2" /> : <p>{profile.department}</p>}</div>
              <div><label className="text-xs font-bold text-slate-500">Education</label>{isEditing ? <input value={profile.education} onChange={e=>handleChange("education", e.target.value)} className="w-full border rounded p-2" /> : <p>{profile.education}</p>}</div>
              <div><label className="text-xs font-bold text-slate-500">Link</label>{isEditing ? <input value={profile.scholar} onChange={e=>handleChange("scholar", e.target.value)} className="w-full border rounded p-2 text-blue-600" /> : <p className="text-blue-600">{profile.scholar}</p>}</div>
            </div>
          </div>
          <div className="col-span-2">
            <h3 className="font-bold text-slate-400 uppercase mb-4 border-b">Interests</h3>
            {isEditing ? <textarea value={profile.research} onChange={e=>handleChange("research", e.target.value)} className="w-full border rounded p-3" /> : (
              <div className="flex gap-2 mt-2">{profile.research.split(",").map((i, idx) => <span key={idx} className="bg-slate-100 border px-3 py-1 rounded-full text-sm">{i.trim()}</span>)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. HOME DASHBOARD MODULE (Live API Connected & Real-Time Polling)
// ============================================================================
function HomeDashboardModule({ setActivePage }: { setActivePage: (page: any) => void }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // --- LIVE DATA STATES ---
  const [profName, setProfName] = useState("Professor");
  const [classAvg, setClassAvg] = useState("0.0");
  const [profAttendance, setProfAttendance] = useState("0.0");
  const [failingStudents, setFailingStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA & SET REAL-TIME POLLING ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Profile Name
        const profileRes = await fetch("http://localhost:8080/api/v1/profile");
        const profileJson = await profileRes.json();
        if (profileJson.status === "success" && profileJson.data) {
          setProfName(profileJson.data.name.split(" ")[0] || "Professor");
        }

        // 2. Fetch Class Grades & Calculate Average
        const gradesRes = await fetch("http://localhost:8080/api/v1/grades");
        const gradesJson = await gradesRes.json();
        if (gradesJson.status === "success" && gradesJson.students && gradesJson.students.students) {
          const studs = gradesJson.students.students;
          const assess = gradesJson.students.assessments;
          const totalMax = assess.reduce((sum: number, a: any) => sum + (a.max || 0), 0);
          
          if (totalMax > 0 && studs.length > 0) {
            let totalClassMarks = 0;
            const failing: string[] = [];

            studs.forEach((s: any) => {
              const sTotal = assess.reduce((sum: number, a: any) => sum + (s.marks[a.id] || 0), 0);
              totalClassMarks += sTotal;
              
              // Alert logic: Identify students scoring below 50%
              if (sTotal / totalMax < 0.5) failing.push(s.name);
            });

            const avg = ((totalClassMarks / (totalMax * studs.length)) * 100).toFixed(1);
            setClassAvg(avg);
            setFailingStudents(failing);
          }
        }

        // 3. Fetch Professor Attendance
        const attRes = await fetch("http://localhost:8080/api/v1/attendance");
        const attJson = await attRes.json();
        if (attJson.status === "success" && attJson.data && attJson.data.attendanceData) {
          const data = attJson.data.attendanceData;
          const present = Object.values(data).filter(s => s === "Present").length;
          const absent = Object.values(data).filter(s => s === "Absent").length;
          const total = present + absent;
          if (total > 0) setProfAttendance(((present / total) * 100).toFixed(1));
        }

      } catch (err) {
        console.error("Failed to load dashboard data.", err);
      } finally {
        setIsLoading(false);
      }
    };

    // 1. Fetch immediately when the dashboard loads
    fetchDashboardData();

    // 2. SET UP REAL-TIME POLLING (Fetch every 5 seconds)
    const intervalId = setInterval(fetchDashboardData, 5000);

    // 3. CLEANUP: Stop polling if the user clicks away to another tab
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="p-8 w-full max-w-7xl mx-auto animate-fade-in space-y-8">
      
      {/* HEADER */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {profName}!</h1>
          <p className="text-slate-500 mt-1">Today is {today}. Here is your live daily overview.</p>
        </div>
      </header>

      {/* ROW 1: AT-A-GLANCE METRICS (Live Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-lg text-3xl">📊</div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Class Average</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">{isLoading ? "..." : `${classAvg}%`}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg text-3xl">👨‍🏫</div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your Attendance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">{isLoading ? "..." : `${profAttendance}%`}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-lg text-3xl">🧠</div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Syllabus Progress</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">Wk 4</span>
              <span className="text-sm font-bold text-slate-400">/ 14</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: ALERTS & AGENDA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AT-RISK RADAR (Live Data) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
            <span className="text-red-500 text-xl">⚠️</span>
            <h2 className="font-bold text-red-800">Urgent Action Required</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            
            {/* Live Grade Alert */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Grade Drop Detected</p>
                {failingStudents.length > 0 ? (
                  <p className="text-sm text-slate-500 mt-1">
                    <span className="font-bold text-red-500">{failingStudents.length} student(s)</span> are scoring below 50%: {failingStudents.join(", ")}.
                  </p>
                ) : (
                  <p className="text-sm text-green-600 mt-1">All students are currently passing.</p>
                )}
              </div>
              <button onClick={() => setActivePage("assessment")} className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100 whitespace-nowrap">View Grades</button>
            </div>

            {/* Placeholder Alert */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-800">Attendance Warning</p>
                <p className="text-sm text-slate-500 mt-1">3 students have missed 3+ classes in a row.</p>
              </div>
              <button className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100 whitespace-nowrap">Email All</button>
            </div>
          </div>
        </div>

        {/* TODAY'S AGENDA */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
            <span className="text-slate-500 text-xl">📅</span>
            <h2 className="font-bold text-slate-800">Today's Schedule</h2>
          </div>
          <div className="p-6 flex-1 space-y-6">
            <div className="relative pl-6 border-l-2 border-blue-200">
              <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1"></div>
              <p className="font-bold text-slate-800">10:00 AM - 11:30 AM</p>
              <p className="text-sm text-slate-600">Lecture: B.Tech CSE (Semester 4)</p>
              <p className="text-xs text-slate-400 mt-1">Room 304 • Topic: Neural Networks Intro</p>
            </div>
            <div className="relative pl-6 border-l-2 border-slate-200">
              <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[7px] top-1"></div>
              <p className="font-bold text-slate-800">2:00 PM - 4:00 PM</p>
              <p className="text-sm text-slate-600">Open Office Hours</p>
              <p className="text-xs text-slate-400 mt-1">2 students booked</p>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: QUICK ACTIONS */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => setActivePage("assessment")} className="flex items-center justify-center gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all font-bold text-slate-700 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">📊</span> Open Gradebook
          </button>
          <button onClick={() => setActivePage("teaching")} className="flex items-center justify-center gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all font-bold text-slate-700 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">📝</span> Build New Exam
          </button>
          <button onClick={() => setActivePage("admin")} className="flex items-center justify-center gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all font-bold text-slate-700 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">📅</span> Log Attendance
          </button>
        </div>
      </div>
    </div>
  );
}