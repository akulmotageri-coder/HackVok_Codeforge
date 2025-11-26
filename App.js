import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import * as XLSX from 'xlsx'; // Import Excel Library

// Connect to Backend
const socket = io('http://localhost:5000');

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rawText, setRawText] = useState('');
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]); 
  const [messages, setMessages] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalRevenue: 0, pending: 0 });

  // --- 1. REAL-TIME LISTENER ---
  useEffect(() => {
    socket.on('sync-complete', (data) => {
      setProjects((prev) => [data.project, ...prev]);
      setInvoices((prev) => [data.invoice, ...prev]);
      setMessages((prev) => [{
        platform: 'System', 
        content: `Auto-generated Project: ${data.project.taskTitle} for ${data.client.name}`, 
        timestamp: new Date()
      }, ...prev]);
      setStats((prev) => ({ ...prev, pending: prev.pending + data.invoice.amount }));
      setLoading(false);
    });
    return () => socket.off('sync-complete');
  }, [activeTab]);

  // --- 2. SYNC FUNCTION ---
  const handleSync = async (textToSync) => {
    const text = textToSync || rawText;
    if (!text) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/parse-request', { rawText: text, platform: 'Email' });
      if (!textToSync) setRawText('');
    } catch (error) {
      console.error("Sync failed", error);
      setLoading(false);
    }
  };

  // --- 3. GMAIL SIMULATION ---
  const handleGmailSync = () => {
    setLoading(true);
    setTimeout(() => {
      const newEmails = [
        { platform: 'Gmail', content: "Hey Akul, urgent help needed. We need a Website Redesign for our new startup. Budget is $4,500. Can you finish by next Friday?", timestamp: new Date() },
        { platform: 'Gmail', content: "Hello! Reaching out from GreenLeaf. We need you to write blog posts. Budget is $1,200. Need first draft by next week.", timestamp: new Date(Date.now() - 3600000) }
      ];
      setMessages((prev) => [...newEmails, ...prev]);
      setLoading(false);
      alert("✅ Gmail Connected! 2 Unread Project Requests Found.");
    }, 1500);
  };

  // --- 4. EXCEL EXPORT ENGINE ---
  const handleExportExcel = () => {
    if (invoices.length === 0) {
      alert("No data to export!");
      return;
    }
    const dataToExport = invoices.map(inv => ({
      "Invoice ID": inv._id ? inv._id.slice(-6).toUpperCase() : 'PENDING',
      "Client": "Alpha Corp",
      "Amount": `$${inv.amount}`,
      "Status": inv.status || 'Draft',
      "Date Generated": new Date().toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finance Report");
    XLSX.writeFile(workbook, "SoloSync_Financials.xlsx");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100">
      
      {/* --- PREMIUM SIDEBAR --- */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 z-20 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">SoloSync</h1>
              <p className="text-xs text-slate-400">Digital HQ v1.0</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
              { id: 'comm', icon: '💬', label: 'Communications' },
              { id: 'finance', icon: '💳', label: 'Finance Engine' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id 
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/20 backdrop-blur-sm border border-blue-500/30' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span> 
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Est. Revenue</p>
          <p className="text-3xl font-bold text-emerald-400 tracking-tight">${stats.pending.toLocaleString()}</p>
          <div className="h-1 w-full bg-slate-700 mt-3 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[60%] rounded-full animate-pulse"></div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="ml-72 p-12 max-w-7xl mx-auto">
        
        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in space-y-10">
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Blueprint Reality</h2>
              <p className="text-slate-500 text-lg">Turn client chaos into structured workflows.</p>
            </div>

            <div className="bg-white p-1 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
              <div className="bg-slate-50 p-6 rounded-[1.3rem]">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Input Stream (Email / WhatsApp / Voice)
                </label>
                <div className="flex gap-4">
                  <textarea 
                    className="w-full p-4 bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all text-slate-600 placeholder:text-slate-300 font-medium leading-relaxed"
                    rows="2"
                    placeholder="Paste a messy client email here..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                  <button 
                    onClick={() => handleSync()}
                    disabled={loading}
                    className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-2 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30 flex flex-col justify-center items-center min-w-[160px] active:scale-95 duration-200"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="text-2xl mb-1">⚡</span>
                        <span className="text-xs uppercase tracking-widest">Process</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                Active Workflows
              </h3>
              
              <div className="grid grid-cols-1 gap-5">
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <span className="text-4xl mb-4">💤</span>
                    <p className="font-medium">All caught up. Waiting for new inputs.</p>
                  </div>
                ) : (
                  projects.map((proj, index) => (
                    <div key={index} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 flex justify-between items-center cursor-default">
                      <div className="flex gap-5 items-center">
                         <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                           {proj.taskTitle[0]}
                         </div>
                         <div>
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full mb-1 inline-block uppercase tracking-wider">
                            {proj.status}
                          </span>
                          <h4 className="font-bold text-xl text-slate-900">{proj.taskTitle}</h4>
                          <p className="text-slate-500 text-sm font-medium">Client: {proj.clientName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 tracking-tight">${proj.budget}</p>
                        <p className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg mt-1 inline-block">
                          Due: {new Date(proj.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FINANCE */}
        {activeTab === 'finance' && (
          <div className="animate-fade-in">
             <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Finance Engine</h2>
              <button 
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
              >
                <span>📊</span> Export Excel
              </button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Invoice ID', 'Amount', 'Status', 'Action'].map(h => (
                      <th key={h} className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv, i) => (
                    <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-5 font-mono text-sm text-slate-500 font-medium">#{inv._id ? inv._id.slice(-6).toUpperCase() : 'PENDING'}</td>
                      <td className="p-5 font-bold text-slate-900 text-lg">${inv.amount}</td>
                      <td className="p-5">
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                          {inv.status || 'Draft'}
                        </span>
                      </td>
                      <td className="p-5">
                        <button 
                          onClick={() => alert(`Generating PDF...`)}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <span>📄</span> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 && <div className="p-10 text-center text-slate-400 italic">No financial data recorded.</div>}
            </div>
          </div>
        )}

        {/* VIEW 3: COMMUNICATIONS */}
        {activeTab === 'comm' && (
          <div className="animate-fade-in max-w-3xl mx-auto">
             <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Unified Inbox</h2>
                <p className="text-slate-500">All your client channels in one stream.</p>
              </div>
              <button 
                onClick={handleGmailSync}
                className="flex items-center gap-2 bg-white border-2 border-slate-100 hover:border-red-100 hover:bg-red-50 text-slate-700 hover:text-red-600 px-5 py-3 rounded-xl font-bold shadow-sm transition-all active:scale-95"
              >
                {loading ? 'Syncing...' : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Sync Gmail
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {messages.length === 0 ? (
                  <div className="text-center p-16 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <span className="text-5xl block mb-4">📭</span>
                    <p className="font-bold text-slate-900 text-lg">Inbox Zero</p>
                    <p className="text-slate-400">Everything is organized.</p>
                  </div>
              ) : messages.map((msg, i) => (
                <div 
                  key={i} 
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-5 group hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => { setRawText(msg.content); setActiveTab('dashboard'); }}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-sm ${msg.platform === 'Gmail' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    {msg.platform === 'Gmail' ? 'G' : 'W'}
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{msg.platform}</span>
                      <span className="text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">{msg.content}</p>
                    <div className="absolute top-2 right-0 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                       <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Convert ⚡</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
