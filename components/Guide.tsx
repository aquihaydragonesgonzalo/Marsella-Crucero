import React, { useState } from 'react';
import { 
    Activity as ActivityIcon, Clock, Sun, Footprints, PhoneCall, 
    Thermometer, CalendarDays, Volume2, Languages, Cloud, 
    CloudRain, CloudLightning, Wind, FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Coordinates, WeatherData, Activity } from '../types';
import { PRONUNCIATIONS, DATE_OF_VISIT } from '../constants';

interface GuideProps {
    userLocation: Coordinates | null;
    itinerary: Activity[];
    weather: WeatherData | null;
}

const Guide: React.FC<GuideProps> = ({ userLocation, itinerary, weather }) => {
    const [playing, setPlaying] = useState<string | null>(null);

    const getWeatherIcon = (code: number, size = 20) => {
        if (code <= 1) return <Sun size={size} className="text-amber-500" />;
        if (code <= 3) return <Cloud size={size} className="text-slate-400" />;
        if (code <= 67) return <CloudRain size={size} className="text-blue-500" />;
        if (code <= 99) return <CloudLightning size={size} className="text-purple-500" />;
        return <Wind size={size} className="text-slate-400" />;
    };

    const play = (word: string) => {
        const ut = new SpeechSynthesisUtterance(word);
        ut.lang = 'fr-FR'; 
        ut.onend = () => setPlaying(null);
        setPlaying(word);
        window.speechSynthesis.speak(ut);
    };

    const handleSOS = () => {
        const msg = `¡SOS! Necesito ayuda en Marsella. Ubicación: ${userLocation ? `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}` : 'GPS no disponible'}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(30, 58, 138); // Blue 900
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text("GUÍA DE ESCALA: MARSELLA", 14, 13);
        doc.setFontSize(10);
        doc.text(DATE_OF_VISIT, 160, 13);

        // Intro info
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Resumen generado desde Marsella 2026 PWA", 14, 30);

        const tableBody = itinerary.map(act => [
            `${act.startTime} - ${act.endTime}`,
            act.title,
            act.locationName,
            `${act.description}\n${act.keyDetails ? `Nota: ${act.keyDetails}` : ''}`,
            act.priceEUR > 0 ? `${act.priceEUR}€` : '-'
        ]);

        autoTable(doc, {
            startY: 35,
            head: [['Horario', 'Actividad', 'Ubicación', 'Detalles', 'Coste']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 25 }, // Horario
                1: { cellWidth: 40, fontStyle: 'bold' }, // Actividad
                2: { cellWidth: 30 }, // Ubicación
                3: { cellWidth: 'auto' }, // Detalles
                4: { cellWidth: 15, halign: 'center' } // Coste
            },
            alternateRowStyles: { fillColor: [241, 245, 249] }
        });

        // Save
        doc.save(`marsella-itinerario-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric' }).format(date);
    };

    const visitSummary = {
        totalWindow: "9h 30min",
        sightseeingTime: "4h 00min",
        estimatedDistance: "4.5 km",
        stepsApprox: "~6.000",
        poiCount: 12,
        accessibility: "Mayoría llano"
    };

    return (
        <div className="pb-32 px-4 pt-6 max-w-lg mx-auto h-full overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-900 uppercase tracking-tight">Guía Marsella</h2>
                <button 
                    onClick={downloadPDF} 
                    className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-900 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                >
                    <FileDown size={16} />
                    <span>PDF</span>
                </button>
            </div>

            {/* Resumen de la Visita */}
            <div className="mb-8 bg-white rounded-[2rem] border border-blue-50 shadow-md p-6 overflow-hidden relative">
                <div className="flex items-center gap-2 mb-4">
                    <ActivityIcon size={18} className="text-blue-700" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Resumen de la Visita</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Escala Total</span>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-blue-600" />
                            <span className="text-sm font-black text-blue-950">{visitSummary.totalWindow}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Turismo Activo</span>
                        <div className="flex items-center gap-1.5">
                            <Sun size={14} className="text-amber-500" />
                            <span className="text-sm font-black text-blue-950">{visitSummary.sightseeingTime}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Distancia a pie</span>
                        <div className="flex items-center gap-1.5">
                            <ActivityIcon size={14} className="text-emerald-600" />
                            <span className="text-sm font-black text-blue-950">{visitSummary.estimatedDistance}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Pasos aprox.</span>
                        <div className="flex items-center gap-1.5">
                            <Footprints size={14} className="text-slate-600" />
                            <span className="text-sm font-black text-blue-950">{visitSummary.stepsApprox}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[9px] font-bold uppercase text-slate-500">
                    <span>{visitSummary.poiCount} Puntos de Interés</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{visitSummary.accessibility}</span>
                </div>
            </div>
            
            <div className="mb-8 bg-rose-700 rounded-[2rem] p-6 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center mb-3">
                        <PhoneCall size={24} className="mr-3 animate-pulse" />
                        <h3 className="font-black text-lg uppercase tracking-widest">ASISTENCIA SOS</h3>
                    </div>
                    <p className="text-xs text-rose-50 mb-6 leading-relaxed">Envía tu ubicación exacta por WhatsApp si te has desorientado en Marsella.</p>
                    <button onClick={handleSOS} className="w-full py-4 bg-white text-rose-700 font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Enviar Localización</button>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <Thermometer size={20} className="text-blue-700"/>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Clima Marsella</h3>
                </div>

                {!weather ? (
                        <div className="h-24 bg-white rounded-3xl animate-pulse border border-blue-50"></div>
                ) : (
                    <>
                    {/* Hourly Forecast */}
                    <div className="bg-white p-2 pb-5 rounded-[2.5rem] border border-blue-50 shadow-xl overflow-hidden mb-4">
                        <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-widest text-center mt-2 mb-2">Hoy</h4>
                        <div className="flex overflow-x-auto custom-h-scrollbar gap-3 px-6 py-2 items-stretch">
                            {weather.hourly.time.map((time, i) => {
                                const date = new Date(time);
                                const hour = date.getHours();
                                const now = new Date();
                                const diffMs = date.getTime() - now.getTime();
                                const diffHrs = diffMs / (1000 * 60 * 60);
                                
                                if (diffHrs >= -1 && diffHrs <= 12) {
                                    return (
                                        <div key={time} className="flex flex-col items-center justify-between min-w-[70px] p-3 bg-blue-50/50 rounded-3xl border border-blue-100">
                                            <span className="text-[10px] font-black text-blue-400 mb-2">{hour}:00</span>
                                            <div className="p-2 bg-white rounded-2xl mb-2 shadow-sm">{getWeatherIcon(weather.hourly.code[i], 24)}</div>
                                            <span className="text-base font-black text-blue-900 tracking-tighter">{Math.round(weather.hourly.temperature[i])}°</span>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>

                    {/* 5 Day Forecast */}
                    <div className="bg-white rounded-[2rem] border border-blue-50 shadow-lg p-5">
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <CalendarDays size={16} className="text-blue-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximos 5 días</span>
                        </div>
                        <div className="space-y-1">
                            {weather.daily.time.slice(0, 5).map((day, i) => (
                            <div key={day} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <span className="w-16 text-xs font-bold text-slate-600 capitalize">{formatDate(day)}</span>
                                <div className="flex items-center gap-3">
                                    {getWeatherIcon(weather.daily.weathercode[i], 18)}
                                </div>
                                <div className="flex items-center gap-3 w-20 justify-end">
                                    <span className="text-xs font-bold text-slate-800">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                                    <span className="text-xs font-medium text-slate-400">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                    </>
                )}
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center uppercase tracking-widest px-1">
                <Languages size={20} className="mr-2.5 text-blue-700"/> Francés Básico
            </h3>
            <div className="bg-white rounded-3xl shadow-md border border-blue-50 overflow-hidden mb-12">
                {PRONUNCIATIONS.map((item, idx) => (
                    <div key={idx} className="p-5 flex justify-between items-center border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors group">
                        <div>
                            <div className="flex items-center gap-3">
                                <p className="font-black text-blue-950 text-lg tracking-tight">{item.word}</p>
                                <button onClick={() => play(item.word)} className={`p-2 rounded-full transition-all ${playing === item.word ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                    <Volume2 size={16} className={playing === item.word ? 'animate-pulse' : ''} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-1 font-medium tracking-tight">"{item.simplified}"</p>
                        </div>
                        <div className="text-right ml-4">
                            <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase border border-blue-100 tracking-tighter">{item.meaning}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Guide;