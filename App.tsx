import React, { useState, useEffect } from 'react';
import { CalendarClock, Map as MapIcon, Wallet, BookOpen, Anchor } from 'lucide-react';
import Timeline from './components/Timeline';
import MapComponent from './components/MapComponent';
import Budget from './components/Budget';
import Guide from './components/Guide';
import AudioGuideModal from './components/AudioGuideModal';
import { INITIAL_ITINERARY, SHIP_ONBOARD_TIME } from './constants';
import { Activity, Coordinates } from './types';

const App = () => {
    const [itinerary, setItinerary] = useState<Activity[]>(INITIAL_ITINERARY);
    const [activeTab, setActiveTab] = useState<'timeline' | 'map' | 'budget' | 'guide'>('timeline');
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [mapFocus, setMapFocus] = useState<Coordinates | null>(null);
    const [countdown, setCountdown] = useState('--h --m --s');
    const [audioGuideActivity, setAudioGuideActivity] = useState<Activity | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const [h, m] = SHIP_ONBOARD_TIME.split(':').map(Number);
            const target = new Date();
            target.setHours(h, m, 0, 0);
            const diff = target.getTime() - now.getTime();
            if (diff <= 0) setCountdown("¡A BORDO!");
            else {
                const hr = Math.floor(diff / 3600000);
                const mn = Math.floor((diff % 3600000) / 60000);
                const sc = Math.floor((diff % 60000) / 1000);
                setCountdown(`${hr.toString().padStart(2,'0')}h ${mn.toString().padStart(2,'0')}m ${sc.toString().padStart(2,'0')}s`);
            }
        }, 1000);

        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(pos => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }, (err) => {
                console.warn("Geolocalización no disponible o denegada");
            }, {
                enableHighAccuracy: true
            });
        }
        
        return () => clearInterval(timer);
    }, []);

    const handleLocate = (coords: Coordinates) => {
        setMapFocus(coords);
        setActiveTab('map');
    };

    const handleToggleComplete = (id: string) => {
        setItinerary(itinerary.map(a => a.id === id ? {...a, completed: !a.completed} : a));
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900">
            <header className="bg-blue-950 text-white p-4 shadow-xl z-20 flex justify-between items-center shrink-0 border-b border-white/5">
                <div className="flex items-center">
                    <Anchor className="mr-3 text-amber-500" size={24} />
                    <div>
                        <h1 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-300">Escala Marsella</h1>
                        <p className="text-[12px] font-bold text-white/90 leading-tight">13 Abril 2026</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-[8px] font-black uppercase text-amber-400 tracking-widest block mb-0.5">Límite Embarque</span>
                    <div className="text-lg font-black font-mono text-white leading-none tracking-tighter">{countdown}</div>
                </div>
            </header>
            <main className="flex-1 relative overflow-hidden">
                {activeTab === 'timeline' && (
                    <div className="h-full overflow-y-auto no-scrollbar">
                        <Timeline 
                            itinerary={itinerary} 
                            onToggleComplete={handleToggleComplete} 
                            onLocate={handleLocate} 
                            onOpenAudioGuide={setAudioGuideActivity} 
                            userLocation={userLocation}
                        />
                    </div>
                )}
                {activeTab === 'map' && (
                    <MapComponent 
                        activities={itinerary} 
                        userLocation={userLocation} 
                        focusedLocation={mapFocus} 
                    />
                )}
                {activeTab === 'budget' && <Budget itinerary={itinerary} />}
                {activeTab === 'guide' && <Guide userLocation={userLocation} itinerary={itinerary} />}

                {audioGuideActivity && (
                    <AudioGuideModal 
                        activity={audioGuideActivity} 
                        onClose={() => setAudioGuideActivity(null)} 
                    />
                )}
            </main>
            <nav className="bg-white border-t h-20 flex justify-around items-center px-2 pb-safe shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-30">
                {[
                    { id: 'timeline', icon: CalendarClock, label: 'Itinerario' },
                    { id: 'map', icon: MapIcon, label: 'Mapa' },
                    { id: 'budget', icon: Wallet, label: 'Gastos' },
                    { id: 'guide', icon: BookOpen, label: 'Guía' }
                ].map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => setActiveTab(t.id as any)} 
                        className={`flex flex-col items-center w-full transition-all ${activeTab === t.id ? 'text-blue-900' : 'text-slate-300'}`}
                    >
                        <div className={`p-2 rounded-xl mb-1 ${activeTab === t.id ? 'bg-blue-50 shadow-sm' : ''}`}>
                            <t.icon size={22} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${activeTab === t.id ? 'opacity-100' : 'opacity-60'}`}>{t.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default App;