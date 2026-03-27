import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, Filter, Clock, CheckCircle, AlertCircle, Calendar, Send } from 'lucide-react';

export default function UserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ total_tasks: 0, completed_tasks: 0, pending_tasks: 0, completion_rate: 0 });
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Additional Features State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');

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

  const getSubmissionForTask = (taskId) => {
    return submissions.find(s => s.task === taskId);
  };

  // Additional Feature: Real-time filtering and searching
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const sub = getSubmissionForTask(t.id);
      const mStatus = sub ? sub.status : 'Pending';
      
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = statusFilter === 'All' || mStatus === statusFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [tasks, submissions, searchTerm, statusFilter]);

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks/submissions/', {
        task: selectedTask.id,
        content: submissionContent
      });
      toast.success('Task submitted successfully!');
      setSelectedTask(null);
      setSubmissionContent('');
      fetchData();
    } catch (err) {
      toast.error('Failed to submit task');
    }
  };

  // Personalized Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r flex flex-col hidden sm:flex z-10">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
               <span className="text-white font-bold text-xl leading-none">D</span>
             </div>
             <span className="text-2xl font-bold text-slate-800 tracking-tight">DTMS</span>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
               {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-2">
          <div className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium shadow-sm border border-blue-100 flex items-center gap-2">
            <CheckCircle size={18} /> My Tasks
          </div>
        </nav>
        <div className="p-4 border-t bg-slate-50/50">
          <button onClick={logout} className="w-full text-left px-4 py-2.5 text-slate-600 font-medium hover:bg-white hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100 hover:shadow-sm">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="mb-6 flex justify-between items-center sm:hidden bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold text-blue-600">DTMS</h2>
          <button onClick={logout} className="text-red-600 font-medium text-sm">Logout</button>
        </div>

        {/* Personalized Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Here is what's happening with your tasks today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Calendar size={16}/></div>
               <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Assigned</h3>
            </div>
            <p className="text-3xl font-extrabold text-slate-800">{stats.total_tasks}</p>
          </div>
          <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600"><CheckCircle size={16}/></div>
               <h3 className="text-green-600 text-sm font-semibold uppercase tracking-wider">Completed</h3>
            </div>
            <p className="text-3xl font-extrabold text-green-700">{stats.completed_tasks}</p>
          </div>
          <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-yellow-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600"><Clock size={16}/></div>
               <h3 className="text-yellow-600 text-sm font-semibold uppercase tracking-wider">Pending</h3>
            </div>
            <p className="text-3xl font-extrabold text-yellow-700">{stats.pending_tasks}</p>
          </div>
          <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><AlertCircle size={16}/></div>
               <h3 className="text-blue-600 text-sm font-semibold uppercase tracking-wider">Progress</h3>
            </div>
            <div className="flex items-end gap-2">
               <p className="text-3xl font-extrabold text-blue-700">{stats.completion_rate}%</p>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5 mt-3">
               <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: \`\${stats.completion_rate}%\` }}></div>
            </div>
          </div>
        </div>

        {/* Task Section Header (Search & Filter) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
           <h3 className="text-xl font-bold text-slate-800">Your Action Items</h3>
           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search tasks..." 
                   className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm shadow-sm"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <select 
                   className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg w-full sm:w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm appearance-none shadow-sm bg-white"
                   value={statusFilter}
                   onChange={e => setStatusFilter(e.target.value)}
                 >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Reviewed">Reviewed</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {filteredTasks.map(t => {
              const sub = getSubmissionForTask(t.id);
              const isSubmitted = !!sub;
              const statusColor = !isSubmitted ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                                   sub.status === 'Reviewed' ? 'bg-green-100 text-green-800 border-green-200' : 
                                   'bg-blue-100 text-blue-800 border-blue-200';
              
              return (
                <li key={t.id} className="p-6 hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-slate-900">{t.title}</h4>
                        <span className={\`px-3 py-1 rounded-full text-xs font-bold border \${statusColor}\`}>
                          {!isSubmitted ? 'Pending' : sub.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 leading-relaxed max-w-3xl">{t.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                          <Calendar size={14} /> Due: {new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                           <Clock size={14} /> {new Date(t.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="lg:text-right mt-2 lg:mt-0 min-w-[200px]">
                      {!isSubmitted ? (
                        <button 
                          onClick={() => setSelectedTask(t)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md w-full lg:w-auto transition-all active:scale-95"
                        >
                          <Send size={16} /> Submit Work
                        </button>
                      ) : (
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                               <CheckCircle size={12}/> Your Submission
                            </p>
                            <span className="text-sm text-slate-700 font-medium break-words block max-w-xs">{sub.content}</span>
                         </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {filteredTasks.length === 0 && (
              <li className="p-12 text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <AlertCircle className="text-slate-400" size={24} />
                </div>
                <p className="text-lg font-medium text-slate-900">No tasks found</p>
                <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
              </li>
            )}
          </ul>
        </div>
      </main>

      {/* Modern Submission Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 transform transition-all scale-100">
            <div className="mb-6">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Submit Task</h3>
              <p className="text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedTask.title}</p>
            </div>
            
            <form onSubmit={handleSubmitTask}>
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Work (URL or Description)</label>
              <textarea
                required
                className="w-full border border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all mb-6 resize-none shadow-sm"
                rows="4"
                placeholder="Enter GitHub link, Google Doc URL, or descriptive text..."
                value={submissionContent}
                onChange={e => setSubmissionContent(e.target.value)}
              ></textarea>
              
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setSelectedTask(null)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-md transition-all active:scale-95 flex items-center gap-2">
                  <Send size={16} /> Submit Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
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
