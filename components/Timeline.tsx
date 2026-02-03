import React, { useState } from 'react';
import { 
    CheckCircle2, Circle, MapPin, AlertTriangle, Clock, Navigation, Headphones, X, Maximize2, ArrowUp 
} from 'lucide-react';
import { Activity, Coordinates } from '../types';

interface TimelineProps {
    itinerary: Activity[];
    onToggleComplete: (id: string) => void;
    onLocate: (coords: Coordinates) => void;
    onOpenAudioGuide: (activity: Activity) => void;
    userLocation: Coordinates | null;
}

const Timeline: React.FC<TimelineProps> = ({ itinerary, onToggleComplete, onLocate, onOpenAudioGuide, userLocation }) => {
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // Haversine formula for distance
    const getDistanceInfo = (target: Coordinates) => {
        if (!userLocation) return null;

        const R = 6371e3; // Earth radius in meters
        const φ1 = userLocation.lat * Math.PI / 180;
        const φ2 = target.lat * Math.PI / 180;
        const Δφ = (target.lat - userLocation.lat) * Math.PI / 180;
        const Δλ = (target.lng - userLocation.lng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distMeters = R * c;

        // Bearing calculation
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
                  Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);
        const bearing = (θ * 180 / Math.PI + 360) % 360;

        let distanceText = "";
        if (distMeters < 1000) {
            distanceText = `${Math.round(distMeters)} m`;
        } else {
            distanceText = `${(distMeters / 1000).toFixed(1)} km`;
        }

        return { distanceText, bearing };
    };

    const calculateDuration = (startStr: string, endStr: string) => {
        if(!startStr || !endStr) return "";
        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);
        let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
        if (diffMins < 0) diffMins += 24 * 60; 
        const hours = Math.floor(diffMins / 60);
        const minutes = diffMins % 60;
        if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h`;
        return `${minutes} min`;
    };

    const formatGap = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${h}h ${m}min`;
        if (h > 0) return `${h}h`;
        return `${m}min`;
    };

    const calculateGap = (endStrPrev: string, startStrNext: string) => {
        if(!endStrPrev || !startStrNext) return 0;
        const [endH, endM] = endStrPrev.split(':').map(Number);
        const [startH, startM] = startStrNext.split(':').map(Number);
        let diffMins = (startH * 60 + startM) - (endH * 60 + endM);
        if (diffMins < 0) diffMins += 24 * 60; 
        return diffMins;
    };

    const calculateTimeProgress = (startTime: string, endTime: string) => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = startTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const [endH, endM] = endTime.split(':').map(Number);
        const endMinutes = endH * 60 + endM;
        if (currentMinutes < startMinutes) return 0;
        if (currentMinutes >= endMinutes) return 100;
        const totalRange = endMinutes - startMinutes;
        const elapsed = currentMinutes - startMinutes;
        return Math.min(100, Math.max(0, (elapsed / totalRange) * 100));
    };

    return (
        <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
            {zoomedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
                    onClick={() => setZoomedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                    >
                        <X size={32} />
                    </button>
                    <img 
                        src={zoomedImage} 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
                        alt="Zoom" 
                    />
                </div>
            )}

            <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-blue-900 uppercase tracking-tight">Ruta Marsella</h2>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md border border-blue-100">En Vivo</span>
            </div>
            <div className="relative border-l-2 border-blue-100 ml-3 space-y-8">
                {itinerary.map((act, idx) => {
                    const prevAct = idx > 0 ? itinerary[idx - 1] : null;
                    const gap = prevAct ? calculateGap(prevAct.endTime, act.startTime) : 0;
                    const isCritical = act.notes === 'CRITICAL';
                    const distanceInfo = act.coords ? getDistanceInfo(act.coords) : null;
                    
                    return (
                        <React.Fragment key={act.id}>
                            {gap > 0 && (
                                <div className="mb-4 ml-6 flex flex-col items-start gap-1.5">
                                    <div className="bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-2 shadow-sm">
                                        <Clock size={10} className="text-blue-400" />
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">{formatGap(gap)} traslado / espera</span>
                                    </div>
                                    <div className="w-24 h-1 bg-blue-50 rounded-full overflow-hidden ml-1">
                                        {prevAct && (
                                            <div 
                                                className="h-full bg-blue-300 transition-all duration-1000" 
                                                style={{ width: `${calculateTimeProgress(prevAct.endTime, act.startTime)}%` }}
                                            ></div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <div className="mb-8 ml-6 relative">
                                <div onClick={() => onToggleComplete(act.id)} className={`absolute -left-[31px] top-0 rounded-full bg-white border-2 cursor-pointer z-10 transition-colors ${act.completed ? 'border-emerald-500 text-emerald-500 shadow-sm' : 'border-blue-700 text-blue-700 shadow-sm'}`}>
                                    {act.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </div>
                                <div className={`rounded-2xl border shadow-sm transition-all overflow-hidden bg-white ${act.notes === 'CRITICAL' ? 'border-rose-500 bg-rose-50' : act.completed ? 'opacity-70 border-emerald-500' : 'border-blue-50'}`}>
                                    <div className="w-full h-1.5 bg-blue-50 overflow-hidden"><div className={`h-full ${calculateTimeProgress(act.startTime, act.endTime) === 100 ? 'bg-slate-300' : 'bg-blue-800'}`} style={{ width: `${calculateTimeProgress(act.startTime, act.endTime)}%` }}></div></div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-tighter">{act.startTime} - {act.endTime}</span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">{calculateDuration(act.startTime, act.endTime)}</span>
                                                </div>
                                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{act.title}</h3>
                                            </div>
                                            {isCritical && <AlertTriangle className="text-rose-600 animate-pulse" size={20} />}
                                        </div>
                                        
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <div className="text-sm text-slate-600 flex items-center gap-1">
                                                <MapPin size={14} className="text-blue-700"/> 
                                                <span>{act.locationName}</span>
                                            </div>
                                            {distanceInfo && (
                                                <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                                    <ArrowUp 
                                                        size={14} 
                                                        className="text-blue-600" 
                                                        style={{ transform: `rotate(${distanceInfo.bearing}deg)` }} 
                                                        strokeWidth={3}
                                                    />
                                                    <span className="text-[10px] font-black text-blue-800 whitespace-nowrap">{distanceInfo.distanceText}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {act.image && (
                                            <div 
                                                className="relative mb-4 rounded-xl overflow-hidden border border-slate-100 group cursor-pointer aspect-video bg-slate-100"
                                                onClick={() => setZoomedImage(act.image || null)}
                                            >
                                                <img 
                                                    src={act.image} 
                                                    alt={act.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                                                        <Maximize2 size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-sm text-slate-600 mb-4 whitespace-pre-line leading-relaxed">{act.description}</p>
                                        {act.keyDetails && <div className="bg-blue-50/50 p-3 rounded-xl text-sm italic border-l-4 border-amber-600 mb-4 text-blue-900 font-medium">"{act.keyDetails}"</div>}
                                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-4 border-t border-slate-50">
                                            {act.coords && <button onClick={() => onLocate(act.coords!)} className="flex items-center text-[10px] font-bold text-blue-900 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 shadow-sm active:bg-blue-100"><Navigation size={12} className="mr-1.5" /> UBICACIÓN</button>}
                                            {act.audioGuideText && (
                                                <button onClick={() => onOpenAudioGuide(act)} className="flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 shadow-sm active:bg-amber-100"><Headphones size={12} className="mr-1.5" /> AUDIOGUÍA</button>
                                            )}
                                            <button onClick={() => onToggleComplete(act.id)} className={`ml-auto px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${act.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-900 text-white'}`}>{act.completed ? 'Hecho' : 'Completar'}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default Timeline;