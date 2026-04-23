import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Edit2, Trash2, X, UploadCloud, FileAudio, FileImage, LayoutTemplate } from 'lucide-react';

interface TemplateAsset {
  id: number;
  asset_type: 'IMAGE' | 'MUSIC';
}

interface VideoTemplate {
  id: number;
  name: string;
  description: string;
  scene_count: number;
  duration_secs: number;
  system_prompt: string;
  audio_prompt: string;
  assets: TemplateAsset[];
}

const emptyForm = { name: '', description: '', scene_count: 12, duration_secs: 60, system_prompt: '', audio_prompt: '' };

const Config: React.FC = () => {
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/templates/');
      setTemplates(res.data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (t: VideoTemplate) => {
    setForm({
      name: t.name, description: t.description, scene_count: t.scene_count,
      duration_secs: t.duration_secs, system_prompt: t.system_prompt, audio_prompt: t.audio_prompt
    });
    setEditingId(t.id);
    setIsModalOpen(true);
  };

  const deleteTemplate = async (id: number) => {
    if(!confirm("Hulk smash template?")) return;
    await axios.delete(`/api/templates/${id}`);
    fetchTemplates();
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`/api/templates/${editingId}`, form);
    } else {
      await axios.post('/api/templates/', form);
    }
    setIsModalOpen(false);
    fetchTemplates();
  };

  const uploadFile = async (id: number, type: 'image' | 'music', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    await axios.post(`/api/templates/${id}/assets/${type}`, formData);
    fetchTemplates();
  };

  const deleteAsset = async (assetId: number) => {
    if(!confirm("Hulk smash asset?")) return;
    await axios.delete(`/api/templates/assets/${assetId}`);
    fetchTemplates();
  };

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600 flex items-center gap-3">
            <Settings size={36} className="text-amber-500" /> Templets & Config
          </h1>
          <p className="text-gray-400 mt-2">Manage video DNA. Change config, change world.</p>
        </div>
        <button 
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all font-bold"
        >
          <Plus size={20} /> Create DNA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p className="text-gray-300">Grog fetching data...</p> : templates.map(t => (
          <div key={t.id} className="group relative bg-gray-900/50 backdrop-blur-md border border-gray-700 hover:border-amber-500/50 p-6 rounded-2xl shadow-xl transition-all overflow-hidden">
            <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(t)} className="p-2 bg-gray-800 text-amber-400 hover:bg-gray-700 rounded-full transition-colors"><Edit2 size={16}/></button>
              <button onClick={() => deleteTemplate(t.id)} className="p-2 bg-gray-800 text-red-400 hover:bg-red-900 rounded-full transition-colors"><Trash2 size={16}/></button>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><LayoutTemplate size={24} /></div>
              <h3 className="text-xl font-bold text-gray-100">{t.name}</h3>
            </div>
            
            <p className="text-sm text-gray-400 mb-6 line-clamp-2">{t.description}</p>
            
            <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">
              <span className="bg-gray-800 px-3 py-1 rounded-full text-amber-400 border border-gray-700">{t.scene_count} Scenes</span>
              <span className="bg-gray-800 px-3 py-1 rounded-full text-blue-400 border border-gray-700">{t.duration_secs}s</span>
            </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs block">Ref Images</label>
                    <label className="cursor-pointer bg-gray-800 text-xs text-amber-400 hover:text-amber-300 py-1 px-3 rounded-lg border border-gray-700 font-bold">
                      Add <UploadCloud size={14} className="inline"/>
                      <input type="file" className="hidden" accept="image/*" onChange={e => {
                          if (e.target.files) uploadFile(t.id, 'image', e.target.files[0]) 
                      }} />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {t.assets.filter(a => a.asset_type === 'IMAGE').map(a => (
                      <div key={a.id} className="relative group/asset">
                        <img 
                          src={`/api/templates/assets/${a.id}`} 
                          alt="Ref" 
                          className="w-16 h-16 object-cover rounded-lg border border-gray-700" 
                        />
                        <button onClick={() => deleteAsset(a.id)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover/asset:opacity-100 transition-opacity"><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs block">Bg Music (.mp3)</label>
                    <label className="cursor-pointer bg-gray-800 text-xs text-amber-400 hover:text-amber-300 py-1 px-3 rounded-lg border border-gray-700 font-bold">
                      Add <UploadCloud size={14} className="inline"/>
                      <input type="file" className="hidden" accept="audio/*" onChange={e => {
                          if (e.target.files) uploadFile(t.id, 'music', e.target.files[0])
                      }} />
                    </label>
                  </div>
                  <div className="flex flex-col gap-2 relative">
                    {t.assets.filter(a => a.asset_type === 'MUSIC').map((a, i) => (
                      <div key={a.id} className="flex items-center gap-2 group/asset">
                        <span className="text-xs text-gray-500 font-mono">#{i+1}</span>
                        <audio src={`/api/templates/assets/${a.id}`} controls className="h-6 w-full" />
                        <button onClick={() => deleteAsset(a.id)} className="text-red-600 opacity-0 group-hover/asset:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold">{editingId ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>
            
            <form onSubmit={saveTemplate} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Template Name</label>
                  <input required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Description</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Scene Count</label>
                  <input type="number" required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" value={form.scene_count} onChange={e => setForm({...form, scene_count: +e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Duration (Seconds)</label>
                  <input type="number" required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" value={form.duration_secs} onChange={e => setForm({...form, duration_secs: +e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase font-bold flex justify-between">
                  System / Script Prompt
                  <span className="text-amber-500 font-normal normal-case">Controls visual rules and storytelling formatting.</span>
                </label>
                <textarea required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 h-48 focus:outline-none focus:border-amber-500 transition-colors font-mono" value={form.system_prompt} onChange={e => setForm({...form, system_prompt: e.target.value})} />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase font-bold flex justify-between">
                  Audio Prompt
                  <span className="text-amber-500 font-normal normal-case">Controls TTS intonation, emotion, padding.</span>
                </label>
                <textarea required className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 h-32 focus:outline-none focus:border-amber-500 transition-colors font-mono" value={form.audio_prompt} onChange={e => setForm({...form, audio_prompt: e.target.value})} />
              </div>
            </form>
            
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors font-bold">Cancel</button>
              <button type="submit" onClick={saveTemplate} className="bg-amber-500 hover:bg-amber-400 text-gray-900 px-6 py-2.5 rounded-lg font-bold shadow-lg transition-transform hover:-translate-y-0.5">Save Templets</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Config;
