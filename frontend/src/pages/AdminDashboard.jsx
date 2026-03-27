import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, Filter, Clock, CheckCircle, AlertCircle, PlusCircle, Trash2, Calendar, Edit } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ total_tasks: 0, completed_tasks: 0, pending_tasks: 0, completion_rate: 0 });
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Additional Features State
  const [searchTaskTerm, setSearchTaskTerm] = useState('');
  const [searchSubTerm, setSearchSubTerm] = useState('');
  const [subFilter, setSubFilter] = useState('All');
  
  const [newTask, setNewTask] = useState({ title: '', description: '', deadline: '' });

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
      await api.post('/tasks/tasks/', newTask);
      toast.success('Task broadcasted to users successfully!');
      setNewTask({ title: '', description: '', deadline: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleDeleteTask = async (id) => {
    if(!window.confirm("Are you sure you want to permanently delete this task?")) return;
    try {
      await api.delete(\`/tasks/tasks/\${id}/\`);
      toast.success('Task safely removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleReview = async (id, status) => {
    try {
      await api.put(\`/tasks/submissions/\${id}/review/\`, { status });
      toast.success(\`Submission marked as \${status}\`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update submission');
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
           <div className="px-4 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl font-bold shadow-sm border border-indigo-500/20 flex items-center gap-2 transition-all">
             <AlertCircle size={18} /> Command Center
           </div>
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button onClick={logout} className="w-full text-left px-4 py-3 text-slate-400 font-bold hover:bg-slate-800 hover:text-rose-400 rounded-xl transition-all border border-transparent hover:border-rose-500/30">
            Disconnect Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full mx-auto">
        <div className="mb-6 flex justify-between items-center lg:hidden bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800">
          <h2 className="text-xl font-black text-white flex items-center gap-2"><div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">D</div> DTMS</h2>
          <button onClick={logout} className="text-rose-400 font-bold text-sm">Logout</button>
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
          <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-3">
              <input type="text" placeholder="Task Title" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-medium" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
            </div>
            <div className="md:col-span-5">
              <input type="text" placeholder="Detailed Description" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-medium" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <input type="datetime-local" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow text-sm text-slate-600 font-bold" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold p-3 rounded-xl hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                Deploy <PlusCircle size={18}/>
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Active Broadcasts (Tasks) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
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
                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{t.title}</h4>
                      <p className="text-xs font-semibold text-slate-500 mb-2 truncate max-w-md">{t.description}</p>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                         <span>Due: {new Date(t.deadline).toLocaleDateString([], {month:'short', day:'numeric'})} at {new Date(t.deadline).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTask(t.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Revoke Task">
                      <Trash2 size={18} />
                    </button>
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px]">
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
                    </div>
                    <span className={\`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md border \${s.status === 'Reviewed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}\`}>
                      {s.status === 'Reviewed' ? 'Verified' : 'Review Required'}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 ml-10">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Target Node: {s.task_details?.title}</p>
                    <p className="text-sm font-medium text-slate-700">{s.content}</p>
                  </div>

                  {s.status === 'Submitted' && (
                    <div className="flex justify-end mt-2">
                      <button onClick={() => handleReview(s.id, 'Reviewed')} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-emerald-600 hover:shadow-md transition-all flex items-center gap-2">
                         <CheckCircle size={14} /> Approve Submission
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
      
      <style dangerouslySetInnerHTML={{__html: \`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      \`}} />
    </div>
  );
}
