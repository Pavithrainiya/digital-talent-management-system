import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Calendar, CheckCircle, Upload, FileText, FileVideo, Video, Star, Trash2 } from 'lucide-react';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [task, setTask] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Submission Form State
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const [tasksRes, subsRes] = await Promise.all([
        api.get('/tasks/tasks/'),
        api.get('/tasks/submissions/')
      ]);
      const targetTask = tasksRes.data.find(t => t.id === parseInt(id));
      if (!targetTask) {
        toast.error('Task not found.');
        navigate('/dashboard');
        return;
      }
      setTask(targetTask);
      
      const targetSub = subsRes.data.find(s => s.task === parseInt(id) && s.user_details.email === user.email);
      if (targetSub) {
        setSubmission(targetSub);
        setContent(targetSub.content || '');
      }
    } catch (err) {
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content && !attachment) {
      toast.error('Please provide a message or attach a file.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('task', task.id);
      formData.append('content', content);
      if (attachment) formData.append('attachment', attachment);
      formData.append('status', 'Submitted');

      if (submission) {
        // Update existing submission
        await api.patch(`/tasks/submissions/${submission.id}/`, formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Submission updated successfully!');
      } else {
        // Create new submission
        await api.post('/tasks/submissions/', formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Task submitted for review!');
      }
      fetchTaskDetails();
    } catch (err) {
      toast.error('Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!window.confirm("Are you sure you want to retract your submission?")) return;
    try {
      await api.delete(`/tasks/submissions/${submission.id}/`);
      toast.success('Submission redacted successfully.');
      setSubmission(null);
      setContent('');
      setAttachment(null);
    } catch (err) {
      toast.error('Failed to retract submission');
    }
  };

  const renderMediaPreview = (url) => {
    if (!url) return null;
    const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
    const isImage = url.match(/\.(jpeg|jpg|png|gif)$/i);
    const isPdf = url.match(/\.pdf$/i);

    return (
      <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative">
        {isVideo ? (
          <video src={url} controls className="w-full max-h-[400px] object-cover bg-black" />
        ) : isImage ? (
          <img src={url} alt="Attachment" className="w-full max-h-[400px] object-contain" />
        ) : isPdf ? (
          <iframe src={url} className="w-full h-[500px]" title="PDF Preview" />
        ) : (
           <div className="p-8 flex flex-col items-center justify-center text-slate-500">
              <FileText size={48} className="mb-4 text-indigo-300"/>
              <p className="font-bold text-lg mb-2">Document Attached</p>
              <a href={url} download className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Download to View</a>
           </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-10 w-10 border-b-2 border-indigo-600 rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors mb-6">
           <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
           {/* Task Context Details */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                 <h1 className="text-3xl font-black text-slate-900 mb-4">{task.title}</h1>
                 
                 <div className="flex flex-wrap gap-4 mb-6">
                   <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600">
                      <Clock size={16} className="text-amber-500"/>
                      Due: {new Date(task.deadline).toLocaleString()}
                   </div>
                   <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600">
                      <Calendar size={16} className="text-blue-500"/>
                      Assigned: {new Date(task.created_at).toLocaleDateString()}
                   </div>
                 </div>

                 <div className="prose prose-slate max-w-none mb-8">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Mission Briefing</h3>
                    <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{task.description}</p>
                 </div>

                 {task.attachment && (
                   <div className="mt-8 border-t border-slate-100 pt-6">
                     <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileVideo size={16}/> Provided References</h3>
                     {renderMediaPreview(task.attachment)}
                   </div>
                 )}
              </div>
           </div>

           {/* Submission Engine */}
           <div className="lg:col-span-1">
              <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/10 sticky top-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-2"><Upload size={20}/> Submission HQ</h3>
                  {submission && (
                     <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-black rounded border ${submission.status === 'Reviewed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                        {submission.status}
                     </span>
                  )}
                </div>

                {submission?.status === 'Reviewed' ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
                     <div className="flex items-center gap-3 text-emerald-400 mb-3">
                        <CheckCircle size={24}/>
                        <h4 className="font-black text-lg">Task Verified</h4>
                     </div>
                     <p className="text-sm text-emerald-200/80 font-medium">Your submission has been reviewed and verified by an administrator. Excellent work!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-2">Message Context</label>
                      <textarea rows="4" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-200 placeholder-slate-600 transition-colors" 
                                placeholder="Describe your solution..." value={content} onChange={e => setContent(e.target.value)} />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-400 mb-2">Deliverable File</label>
                      <div className="relative">
                         <input type="file" onChange={e => setAttachment(e.target.files[0])} className="hidden" id="file-upload" />
                         <label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed p-4 rounded-xl cursor-pointer transition-colors font-bold text-sm text-indigo-400">
                            <Upload size={18}/> {attachment ? attachment.name : (submission?.attachment ? 'Update Existing File' : 'Select File to Upload')}
                         </label>
                      </div>
                      {submission?.attachment && !attachment && (
                        <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle size={12}/> Using previously uploaded file</p>
                      )}
                    </div>

                    <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-500 shadow-md transition-all active:scale-95 disabled:opacity-50">
                       {submitting ? 'Transmitting...' : (submission ? 'Update Submission' : 'Deploy Submission')}
                    </button>

                    {submission && (
                       <button type="button" onClick={handleDeleteSubmission} className="w-full mt-2 text-rose-400 hover:text-rose-300 font-bold text-sm py-2 px-4 flex items-center justify-center gap-2">
                          <Trash2 size={16}/> Retract Submission
                       </button>
                    )}
                  </form>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
