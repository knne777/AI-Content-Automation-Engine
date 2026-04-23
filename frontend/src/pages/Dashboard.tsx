import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Play } from 'lucide-react';

interface Idea {
    id: number;
    title: string;
    category: string;
    state: string;
}

export default function Dashboard() {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIdeas();
    }, []);

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

    const runStep1 = async () => {
        setLoading(true);
        try {
            await axios.post('/api/pipeline/step1/short');
            await fetchIdeas();
        } catch (e) {
            alert("Error running step 1");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Your Content Ideas</h1>
                <button 
                    onClick={runStep1} 
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    disabled={loading}
                >
                    <Play size={18} /> Generate New Idea
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ideas.map(idea => (
                        <Link to={`/idea/${idea.id}`} key={idea.id} className="block group">
                            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-500 transition-colors shadow-sm group-hover:shadow-blue-500/20">
                                <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">#{idea.id} - {idea.category}</div>
                                <h2 className="text-xl font-semibold mb-4 text-gray-100 group-hover:text-blue-300 transition-colors line-clamp-2">
                                    {idea.title}
                                </h2>
                                <div className="flex justify-between items-center">
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-900 border border-gray-600">
                                        {idea.state}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {ideas.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No ideas yet. Generate one to start.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
