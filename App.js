import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

// Connect to your Node.js Backend
const socket = io('http://localhost:5000');

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'comm', 'finance'
  const [rawText, setRawText] = useState('');
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]); 
  const [messages, setMessages] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalRevenue: 0, pending: 0 });

  useEffect(() => {
    // --- REAL-TIME LISTENER ---
    socket.on('sync-complete', (data) => {
      console.log("⚡ New Data Received:", data);
      
      setProjects((prev) => [data.project, ...prev]);
      setInvoices((prev) => [data.invoice, ...prev]);
      setMessages((prev) => [{
        platform: 'Email', 
        content: data.project.taskTitle + " request from " + data.client.name, 
        timestamp: new Date()
      }, ...prev]);
      
      setStats((prev) => ({
        ...prev,
        pending: prev.pending + data.invoice.amount
      }));
      
      setLoading(false);
    });

    return () => socket.off('sync-complete');
  }, []);

  const handleSync = async () => {
    if (!rawText) return;
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/parse-request', {
        rawText: rawText,
        platform: 'Email'
      });
      setRawText('');
    } catch (error) {
      console.error("Sync failed", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 z-10">
        <h1 className="text-2xl font-bold tracking-wider text-blue-400 mb-10">
          C.O.D.E <span className="text-white text-sm block font-normal opacity-70">SoloSync HQ</span>
        </h1>
        
        <nav className="space-y-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span>🏠</span> <span>Dashboard</span>
          </button>
          
          <button 
             onClick={() => setActiveTab('comm')}
             className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${activeTab === 'comm' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span>💬</span> <span>Communications</span>
          </button>
          
          <button 
             onClick={() => setActiveTab('finance')}
             className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${activeTab === 'finance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span>💰</span> <span>Finance</span>
          </button>
        </nav>

        <div className="absolute bottom-10">
          <p className="text-slate-500 text-xs uppercase">Est. Revenue</p>
          <p className="text-2xl font-bold text-green-400">${stats.pending}</p>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="ml-64 p-10">
        
        {/* --- VIEW 1: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <>
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-6 text-slate-900">Blueprint Reality</h2>
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Paste Messy Client Request (Email/WhatsApp)
                </label>
                <div className="flex gap-4">
                  <textarea 
                    className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows="2"
                    placeholder="Ex: 'Hi Akul, need a logo by Friday for $500...'"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                  <button 
                    onClick={handleSync}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl font-bold transition-all shadow-blue-200 shadow-lg flex flex-col justify-center items-center min-w-[140px]"
                  >
                    {loading ? 'Processing...' : 'SYNC ⚡'}
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-bold mb-4 text-slate-700">Active Workflows</h3>
              <div className="grid grid-cols-1 gap-4">
                {projects.length === 0 ? (
                  <div className="text-center p-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    No active projects. Waiting for input...
                  </div>
                ) : (
                  projects.map((proj, index) => (
                    <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex justify-between items-center">
                      <div>
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full mb-2 inline-block">
                          {proj.status}
                        </span>
                        <h4 className="font-bold text-lg">{proj.taskTitle}</h4>
                        <p className="text-slate-500 text-sm">Client: {proj.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-900">${proj.budget}</p>
                        <p className="text-xs text-red-400">Due: {new Date(proj.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* --- VIEW 2: FINANCE --- */}
        {activeTab === 'finance' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-slate-900">Finance Engine</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="p-4">Invoice ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr><td colSpan="4" className="p-6 text-center text-slate-400">No invoices generated yet.</td></tr>
                  ) : invoices.map((inv, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-xs text-slate-400">#{inv._id ? inv._id.slice(-6) : 'PENDING'}</td>
                      <td className="p-4 font-bold text-slate-900">${inv.amount}</td>
                      <td className="p-4"><span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">{inv.status}</span></td>
                      <td className="p-4 text-slate-500 text-sm">{new Date().toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW 3: COMMUNICATIONS --- */}
        {activeTab === 'comm' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-slate-900">Unified Inbox</h2>
            <div className="space-y-4">
              {messages.length === 0 ? (
                  <div className="text-center p-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">Inbox Zero.</div>
              ) : messages.map((msg, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                  <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {msg.platform[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{msg.platform} Message</p>
                    <p className="text-slate-600">{msg.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
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