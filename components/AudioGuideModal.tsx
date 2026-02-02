import React, { useState } from 'react';
import { Headphones, X, Play, Square } from 'lucide-react';
import { Activity } from '../types';

interface AudioGuideModalProps {
    activity: Activity;
    onClose: () => void;
}

const AudioGuideModal: React.FC<AudioGuideModalProps> = ({ activity, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayAudio = () => {
        if (!activity.audioGuideText) return;
        
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(activity.audioGuideText);
            utterance.lang = 'es-ES';
            utterance.rate = 0.95;
            utterance.onend = () => setIsPlaying(false);
            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        }
    };

    const handleClose = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        onClose();
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-blue-100 p-3 rounded-2xl border border-blue-200">
                            <Headphones size={24} className="text-blue-700" />
                        </div>
                        <button onClick={handleClose} className="text-slate-300 hover:text-slate-600 transition-colors">
                            <X size={28} />
                        </button>
                    </div>
                    
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Audioguía</h3>
                    <h4 className="text-xl font-black text-slate-800 mb-6 leading-tight">{activity.title}</h4>
                    
                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-h-scrollbar mb-8">
                        <p className="text-slate-600 leading-relaxed font-medium italic">
                            {activity.audioGuideText}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={handlePlayAudio}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 ${
                                isPlaying ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-blue-900 text-white shadow-blue-200'
                            }`}
                        >
                            {isPlaying ? <Square size={18} fill="white" /> : <Play size={18} fill="white" />}
                            {isPlaying ? 'Detener' : 'Escuchar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioGuideModal;