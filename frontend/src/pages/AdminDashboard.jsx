import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, Filter, Clock, CheckCircle, AlertCircle, PlusCircle, Trash2, Calendar, Edit, Save, X, LayoutDashboard, Users, Settings, Menu, Sparkles, Upload } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_tasks: 0, completed_tasks: 0, pending_tasks: 0, completion_rate: 0 });
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Additional Features State
  const [searchTaskTerm, setSearchTaskTerm] = useState('');
  const [searchSubTerm, setSearchSubTerm] = useState('');
  const [subFilter, setSubFilter] = useState('All');
  
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '' });
  const [taskAttachment, setTaskAttachment] = useState(null);
  
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes, subsRes] = await Promise.all([
        api.get('/tasks/dashboard/stats/'),
        api.get('/tasks/tasks/'),
        api.get('/tasks/submissions/')
      ]);
      setStats(statsRes.data);
      setTasks(tasksRes.data);
      setSubmissions(subsRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newTask.title);
      formData.append('description', newTask.description);
      formData.append('deadline', newTask.deadline);
      if (taskAttachment) {
        formData.append('attachment', taskAttachment);
      }

      await api.post('/tasks/tasks/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Task broadcasted to users successfully!');
      setNewTask({ title: '', description: '', deadline: '' });
      setTaskAttachment(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleDeleteTask = async (id) => {
    if(!window.confirm("Are you sure you want to permanently delete this task?")) return;
    try {
      await api.delete(`/tasks/tasks/${id}/`);
      toast.success('Task safely removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      // NOTE: For simplicity we send JSON for updates in this specific view.
      // If we wanted to update attachments here we'd use FormData.
      await api.put(`/tasks/tasks/${editingTask.id}/`, editingTask);
      toast.success('Task successfully updated!');
      setEditingTask(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update task. Ensure deadline is correctly formatted.');
    }
  };

  const handleReview = async (id, status) => {
    try {
      await api.put(`/tasks/submissions/${id}/review/`, { status });
      toast.success(`Submission marked as ${status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update submission');
    }
  };

  const handleAIEvaluate = async (id) => {
    const toastId = toast.loading('Gemini AI is analyzing context...');
    try {
      const res = await api.post(`/tasks/submissions/${id}/evaluate/`);
      toast.dismiss(toastId);
      const aiData = res.data.ai_evaluation;
      toast.success(`AI Confidence: ${aiData.score}/100.`);
      alert(`🤖 Gemini Evaluation Feedback:\n\nScore: ${aiData.score}/100\nRecommended Action: ${aiData.recommended_status}\n\nFeedback:\n${aiData.feedback}`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Gemini API evaluation failed. Check environment configuration.');
    }
  };

  // Searching logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.title.toLowerCase().includes(searchTaskTerm.toLowerCase()) || 
                             t.description.toLowerCase().includes(searchTaskTerm.toLowerCase()));
  }, [tasks, searchTaskTerm]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const matchesSearch = s.user_details?.name.toLowerCase().includes(searchSubTerm.toLowerCase()) || 
                            s.task_details?.title.toLowerCase().includes(searchSubTerm.toLowerCase());
      const matchesFilter = subFilter === 'All' || s.status === subFilter;
      return matchesSearch && matchesFilter;
    });
  }, [submissions, searchSubTerm, subFilter]);


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 shadow-xl flex flex-col hidden lg:flex z-10 text-slate-100">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <span className="text-white font-extrabold text-xl leading-none">D</span>
             </div>
             <span className="text-2xl font-black text-white tracking-tight">DTMS Admin</span>
          </div>
          <div className="flex items-center gap-3 mt-6 bg-slate-800 p-3 rounded-xl border border-slate-700">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
               {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
              <p className="text-xs text-indigo-300">Administrator Vault</p>
            </div>
          </div>
         </div>
        <nav className="flex-1 mt-6 px-4 space-y-2">
           <button className="w-full px-4 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl font-bold shadow-sm border border-indigo-500/20 flex items-center gap-3 transition-all">
             <LayoutDashboard size={18} /> Command Center
           </button>
           <button className="w-full px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl font-bold border border-transparent flex items-center gap-3 transition-all">
             <Users size={18} /> Team Members
           </button>
           <button className="w-full px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl font-bold border border-transparent flex items-center gap-3 transition-all">
             <CheckCircle size={18} /> Audit Logs
           </button>
           <Link to="/profile" className="w-full px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl font-bold border border-transparent flex items-center gap-3 transition-all mt-6">
             <Settings size={18} /> System Profile
           </Link>
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button onClick={logout} className="w-full text-left px-4 py-3 text-slate-400 font-bold hover:bg-slate-800 hover:text-rose-400 rounded-xl transition-all border border-transparent hover:border-rose-500/30">
            Disconnect Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full mx-auto">
        
        {/* Mobile Header Navbar */}
        <div className="mb-6 flex justify-between items-center lg:hidden bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800">
          <div className="flex items-center gap-3">
             <button className="text-slate-400 hover:text-indigo-400"><Menu size={24}/></button>
             <h2 className="text-xl font-black text-white flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-xs">D</div> DTMS
             </h2>
           </div>
          <button onClick={logout} className="text-rose-400 font-bold text-sm bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">Logout</button>
        </div>

        <div className="mb-8 animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage broad system workloads and audit team progression.</p>
          </div>
          <p className="text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 inline-flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500"/> System Online
          </p>
        </div>

        {/* Global Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors group">
            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 group-hover:text-indigo-500 transition-colors">Total Broadcasts</h3>
            <p className="text-4xl font-black text-slate-800">{stats.total_tasks}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-200 transition-colors group">
            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">Approved Data</h3>
            <p className="text-4xl font-black text-emerald-600">{stats.completed_tasks}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-200 transition-colors group">
            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 group-hover:text-amber-500 transition-colors">Pending Review</h3>
            <p className="text-4xl font-black text-amber-500">{stats.pending_tasks}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden text-white bg-gradient-to-br from-indigo-600 to-indigo-800">
            <h3 className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">Network Yield</h3>
            <p className="text-4xl font-black">{stats.completion_rate}%</p>
            <div className="absolute right-0 bottom-0 opacity-10">
               <AlertCircle size={100} className="-mr-6 -mb-6"/>
            </div>
          </div>
        </div>

        {/* Task Creator */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 max-w-7xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><PlusCircle size={20}/></div>
             <h3 className="text-xl font-black text-slate-800">Broadcast New Task</h3>
          </div>
          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
              <input type="text" placeholder="Task Title" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-medium" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
            </div>
            <div className="md:col-span-4">
              <input type="text" placeholder="Detailed Description" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-medium" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <input type="datetime-local" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow text-sm text-slate-600 font-bold" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
            </div>
            <div className="md:col-span-1 border border-slate-200 rounded-xl overflow-hidden relative cursor-pointer hover:bg-slate-50 flex items-center justify-center p-3 text-slate-500">
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setTaskAttachment(e.target.files[0])} title="Attach Context File (PDF, Video, Docs)" />
              <Upload size={20} className={taskAttachment ? "text-indigo-600" : ""} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold p-3 rounded-xl hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                Deploy <PlusCircle size={18}/>
              </button>
            </div>
          </form>
          {taskAttachment && <p className="text-xs text-indigo-600 font-black mt-2">File Attached: {taskAttachment.name}</p>}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Active Broadcasts (Tasks) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[600px] h-full">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Calendar size={20} className="text-indigo-500"/> Active Broadcasts</h3>
              <div className="relative w-full sm:w-auto">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input type="text" placeholder="Search tasks..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg w-full sm:w-48 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" value={searchTaskTerm} onChange={e => setSearchTaskTerm(e.target.value)} />
              </div>
            </div>
            <ul className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2">
              {filteredTasks.map(t => (
                <li key={t.id} className="p-4 hover:bg-slate-50 rounded-xl transition-colors group select-none">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 onClick={() => navigate(`/tasks/${t.id}`)} className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 cursor-pointer">{t.title}</h4>
                      <p className="text-xs font-semibold text-slate-500 mb-2 truncate max-w-md">{t.description}</p>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                         <span>Due: {new Date(t.deadline).toLocaleDateString([], {month:'short', day:'numeric'})} at {new Date(t.deadline).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                         {t.attachment && <span className="text-indigo-400">Includes Attachment</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingTask({...t, deadline: t.deadline.slice(0, 16)})} className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Task">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteTask(t.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Revoke Task">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {filteredTasks.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-10">
                  <AlertCircle size={32} className="mb-2 opacity-50"/>
                  <p className="font-medium">No active broadcasts found.</p>
                </div>
              )}
            </ul>
          </div>

          {/* User Submissions Audit */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[600px] h-full">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><CheckCircle size={20} className="text-emerald-500"/> Audit Submissions</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input type="text" placeholder="User or Task..." className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" value={searchSubTerm} onChange={e => setSearchSubTerm(e.target.value)} />
                 </div>
                 <select className="border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold bg-white text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={subFilter} onChange={e => setSubFilter(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="Submitted">Pending Audit</option>
                    <option value="Reviewed">Approved</option>
                 </select>
              </div>
            </div>
            
            <ul className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2">
              {filteredSubmissions.map(s => (
                <li key={s.id} className="p-5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                         {s.user_details?.name.charAt(0)}
                       </div>
                       <span className="font-black text-slate-800">{s.user_details?.name}</span>
                       <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded truncate max-w-[150px]">{s.task_details?.title}</span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md border ${s.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      {s.status === 'Reviewed' ? 'Verified' : 'Review Required'}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-3 ml-10">
                    <p className="text-sm font-medium text-slate-700 mb-2">{s.content || "No text provided."}</p>
                    {s.attachment && (
                      <a href={s.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        View Attached Document
                      </a>
                    )}
                  </div>

                  {s.status === 'Submitted' && (
                    <div className="flex justify-end mt-2 gap-2">
                      <button onClick={() => handleAIEvaluate(s.id)} className="bg-slate-900 text-slate-100 font-bold px-4 py-2 rounded-lg text-xs hover:bg-slate-800 shadow-md transition-all flex items-center gap-2">
                         <Sparkles size={14} className="text-amber-300"/> Smart AI Evaluate
                      </button>
                      <button onClick={() => handleReview(s.id, 'Reviewed')} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-emerald-600 shadow-md transition-all flex items-center gap-2">
                         <CheckCircle size={14} /> Approve Manually
                      </button>
                    </div>
                  )}
                </li>
              ))}
              {filteredSubmissions.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-10">
                  <CheckCircle size={32} className="mb-2 opacity-50"/>
                  <p className="font-medium">Audit queue is empty.</p>
                </div>
              )}
            </ul>
          </div>

        </div>
      </main>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">Modify Task</h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Task Title</label>
                <input type="text" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" 
                       value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium min-h-[100px]" 
                          value={editingTask.description} onChange={e => setEditingTask({...editingTask, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Deadline</label>
                <input type="datetime-local" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-600" 
                       value={editingTask.deadline} onChange={e => setEditingTask({...editingTask, deadline: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingTask(null)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}
