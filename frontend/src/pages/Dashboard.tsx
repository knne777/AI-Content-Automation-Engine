import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Play, Sparkles } from 'lucide-react';

interface Idea {
    id: number;
    title: string;
    category: string;
    state: string;
    status_msg: string | null;
}

export default function Dashboard() {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [templates, setTemplates] = useState<{id: number, name: string}[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<number | ''>('');
    const [loading, setLoading] = useState(true);
    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
    const initialized = useRef(false);

    const fetchIdeas = async () => {
        try {
            const res = await axios.get('/api/ideas/');
            setIdeas(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIdeas();
        fetchTemplates();
        // Polling interval
        const intervalId = setInterval(() => {
            fetchIdeas();
        }, 3000);
        return () => clearInterval(intervalId);
    }, []);
    
    const fetchTemplates = async () => {
        try {
            const res = await axios.get('/api/templates/');
            setTemplates(res.data);
            if (res.data.length > 0) setSelectedTemplate(res.data[0].id);
        } catch (e) {}
    }

    const runStep1 = () => {
        setIsGeneratingIdea(true);
        let url = '/api/pipeline/step1/short';
        if (selectedTemplate) url += `?template_id=${selectedTemplate}`;
        
        // Background process, not awaiting block
        axios.post(url).then(() => {
            setIsGeneratingIdea(false);
            fetchIdeas();
        }).catch(e => {
            alert("Error running step 1");
            setIsGeneratingIdea(false);
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Your Content Ideas</h1>
                <div className="flex gap-4">
                    <select 
                        className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                        value={selectedTemplate}
                        onChange={e => setSelectedTemplate(+e.target.value)}
                    >
                        <option value="">Legacy (Random Config)</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button 
                        onClick={runStep1} 
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all font-bold"
                        disabled={isGeneratingIdea}
                    >
                        {isGeneratingIdea ? <Sparkles size={18} className="animate-spin" /> : <Play size={18} />} 
                        {isGeneratingIdea ? 'Pensando...' : 'Generate New Idea'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {isGeneratingIdea && (
                        <div className="flex justify-center items-center h-48 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-blue-900/40 border border-purple-500/50 rounded-xl p-5 shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse backdrop-blur-md relative overflow-hidden group">
                           <div className="absolute inset-0 bg-transparent opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-400 via-transparent to-transparent"></div>
                           <div className="relative text-center z-10 flex flex-col items-center">
                               <Sparkles size={36} className="text-purple-300 animate-spin-slow mb-3 drop-shadow-md" />
                               <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-200 tracking-wide">
                                  Generando idea con magia 🪄
                               </h3>
                               <p className="text-xs text-purple-300/70 mt-1 uppercase tracking-widest font-mono">Espere un momento...</p>
                           </div>
                        </div>
                    )}

                    {ideas.map(idea => (
                        <Link to={`/idea/${idea.id}`} key={idea.id} className="block group">
                            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-500 transition-colors shadow-sm group-hover:shadow-blue-500/20 h-full flex flex-col">
                                <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">#{idea.id} - {idea.category}</div>
                                <h2 className="text-xl font-semibold mb-4 text-gray-100 group-hover:text-blue-300 transition-colors line-clamp-2">
                                    {idea.title}
                                </h2>
                                <div className="mt-auto flex flex-col gap-2">
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-900 border border-gray-600 self-start">
                                        {idea.state}
                                    </span>
                                    {idea.status_msg && (
                                        <div className="text-xs font-mono text-amber-400 animate-pulse bg-amber-500/10 py-1.5 px-3 rounded-lg border border-amber-500/20">
                                            {idea.status_msg}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                    {!isGeneratingIdea && ideas.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No ideas yet. Generate one to start.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
