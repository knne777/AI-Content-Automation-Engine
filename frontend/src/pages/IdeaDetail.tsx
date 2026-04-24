import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, Video, Globe, X } from 'lucide-react';

interface Scene {
    id: number;
    scene_number: number;
    narration: string;
    image_prompt: string;
}

interface Idea {
    id: number;
    title: string;
    category: string;
    state: string;
    slug: string;
    scenes: Scene[];
}

export default function IdeaDetail() {
    const { id } = useParams<{id: string}>();
    const [idea, setIdea] = useState<Idea | null>(null);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authUrl, setAuthUrl] = useState('');
    const [authCode, setAuthCode] = useState('');

    useEffect(() => {
        fetchIdea();
    }, [id]);

    const fetchIdea = async () => {
        try {
            const [ideaRes, scenesRes] = await Promise.all([
                axios.get(`/api/ideas/${id}`),
                axios.get(`/api/ideas/${id}/scenes`)
            ]);
            setIdea(ideaRes.data);
            setScenes(scenesRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePublishClick = async () => {
        if (!idea) return;
        try {
            await axios.post(`/api/pipeline/publish/${idea.id}`);
            alert("Subida a YouTube iniciada 🚀 Revisa el dashboard para el estatus.");
        } catch (e) {
            // Probably auth error
            try {
                const res = await axios.get('/api/pipeline/youtube/auth');
                setAuthUrl(res.data.auth_url);
                setShowAuthModal(true);
            } catch(e2) {
                alert("Falta el archivo client_secret.json en tools/youtube/ o hay otro error.");
            }
        }
    }

    const submitCode = async () => {
        try {
            await axios.post('/api/pipeline/youtube/callback', { code: authCode });
            setShowAuthModal(false);
            handlePublishClick(); // try again
        } catch (e) {
            alert("Código inválido o error guardando token.");
        }
    }

    const approveScript = async () => {
        if (!confirm("Approve script and start media generation? (Costs API credits)")) return;
        try {
            await axios.post(`/api/pipeline/approve/${id}`);
            fetchIdea();
        } catch (e) {
            alert("Error approving");
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>;
    if (!idea) return <div className="p-10 text-center text-red-400">Idea not found</div>;

    const needsApproval = idea.state === 'SCRIPT_GENERATED';
    const isCompleted = idea.state === 'COMPLETED';

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <Link to="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="text-sm font-bold text-blue-400 tracking-wider uppercase mb-2">#{idea.id} • {idea.category}</div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-4 tracking-tight">
                            {idea.title}
                        </h1>
                        <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-900 border border-gray-600 shadow-inner">
                            Status: <span className={needsApproval ? 'text-yellow-400' : isCompleted ? 'text-green-400' : 'text-blue-400'}>{idea.state}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        {needsApproval && (
                            <button 
                                onClick={approveScript} 
                                className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-0.5"
                            >
                                <CheckCircle size={18} /> Approve & Generate
                            </button>
                        )}
                        {isCompleted && (
                            <button onClick={handlePublishClick} className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-red-500/20 transform hover:-translate-y-0.5">
                                <Globe size={18} /> Publish to YouTube
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isCompleted && (
                <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Video className="text-blue-400" /> Final Video</h2>
                    <div className="aspect-[9/16] w-full max-w-sm mx-auto bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-700 relative">
                        {/* Assuming the slug is saved or title is slugified, our backend mounts /assets/short/ */}
                        <video 
                            controls 
                            className="w-full h-full object-cover"
                            src={`/api/media/ideas/${idea.id}/video`}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <h2 className="text-2xl font-bold pl-2 border-l-4 border-blue-500">Script & Storyboard</h2>
                <div className="grid gap-6">
                    {scenes.map((scene) => (
                        <div key={scene.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors shadow-md flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/3 flex-shrink-0">
                                <div className="text-xs font-bold text-gray-500 mb-3 bg-gray-900 inline-block px-3 py-1 rounded-md">SCENE {scene.scene_number}</div>
                                {idea.state !== 'NEW' && idea.state !== 'SCRIPT_GENERATED' && idea.state !== 'APPROVED' ? (
                                    <div className="aspect-[9/16] w-full max-w-[200px] bg-gray-900 rounded-lg overflow-hidden border border-gray-700 relative group">
                                         <img 
                                            src={`/api/media/scenes/${scene.id}/image`} 
                                            alt={`Scene ${scene.scene_number}`}
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-[9/16] w-full max-w-[200px] bg-gray-900 rounded-lg border border-gray-800 flex items-center justify-center text-gray-600 text-sm">
                                        Pending...
                                    </div>
                                )}
                            </div>
                            <div className="md:w-2/3 space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-blue-400 uppercase mb-2">Narration</h3>
                                    <p className="text-gray-200 text-lg leading-relaxed bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 italic">
                                        "{scene.narration}"
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-purple-400 uppercase mb-2 mt-4">Visual Prompt</h3>
                                    <p className="text-gray-400 text-sm font-mono bg-gray-900/80 p-4 rounded-lg leading-relaxed border border-gray-800 h-32 overflow-y-auto">
                                        {scene.image_prompt}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
                    <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="text-red-500"/> Vincular YouTube</h2>
                            <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                Necesitas autorizar a la API para subir videos. Entra al siguiente link, autoriza la app, y pega el <b>código</b> que te dará Google aquí abajo.
                            </p>
                            <a href={authUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-blue-400 hover:text-blue-300 font-bold bg-blue-900/30 py-3 rounded-xl border border-blue-500/50">
                                Abrir página de Autorización
                            </a>
                            <div className="pt-2">
                                <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Pega tu Código aquí</label>
                                <input 
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                                    value={authCode}
                                    onChange={e => setAuthCode(e.target.value)}
                                    placeholder="e.g. 4/0AfJohX..."
                                />
                            </div>
                            <button onClick={submitCode} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg mt-4">
                                Confirmar y Publicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
