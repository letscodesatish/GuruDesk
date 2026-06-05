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
  const [topic, setTopic] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 💡 Handled directly via event action to avoid infinite render loops
  const handleCreateRoadmap = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setErrorMessage(null);

    try {
      // 🚀 Use a clean relative path so Vercel hooks into the right route
      const response = await fetch("/api/v1/roadmaps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status code: ${response.status}`);
      }

      const data = await response.json();
      setRoadmap(data); // Save the returned Python response payload into state
    } catch (err: any) {
      console.error("Failed to generate roadmap content:", err);
      setErrorMessage(err.message || "An error occurred while contacting the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Teaching Preparation Workspace</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <label className="block text-sm font-semibold text-slate-600 mb-2">
          Enter Course Topic
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Artificial Intelligence, Pothole Detection Systems..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreateRoadmap}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
          >
            {loading ? "Generating via AI..." : "Generate Roadmap"}
          </button>
        </div>
        
        {errorMessage && (
          <p className="text-sm font-medium text-red-500 mt-2">❌ {errorMessage}</p>
        )}
      </div>

      {/* Render your workspace roadmap output container */}
      {roadmap && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold mb-4 text-slate-800">Generated Syllabus Map</h3>
          <pre className="bg-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(roadmap, null, 2)}
          </pre>
        </div>
      )}
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