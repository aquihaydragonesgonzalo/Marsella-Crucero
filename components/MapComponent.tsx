import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Plus, MapPin, Trash2, Save, X, AlignLeft } from 'lucide-react';
import { Activity, Coordinates, CustomWaypoint } from '../types';
import { GPX_WAYPOINTS, MARSEILLE_TRACK } from '../constants';
import { createRoot } from 'react-dom/client';

interface MapComponentProps {
    activities: Activity[];
    userLocation: Coordinates | null;
    focusedLocation: Coordinates | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ activities, userLocation, focusedLocation }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.Layer[]>([]);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    
    const [isSatellite, setIsSatellite] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false);
    const [customWaypoints, setCustomWaypoints] = useState<CustomWaypoint[]>(() => {
        const saved = localStorage.getItem('marsella_custom_waypoints');
        return saved ? JSON.parse(saved) : [];
    });

    // State for the Add Waypoint Modal
    const [pendingCoords, setPendingCoords] = useState<Coordinates | null>(null);
    const [newWpName, setNewWpName] = useState('');
    const [newWpDesc, setNewWpDesc] = useState('');

    // Persist custom waypoints
    useEffect(() => {
        localStorage.setItem('marsella_custom_waypoints', JSON.stringify(customWaypoints));
    }, [customWaypoints]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        
        // Create map instance
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([43.2965, 5.3698], 13);
        
        mapInstanceRef.current = map;
        return () => { map.remove(); mapInstanceRef.current = null; };
    }, []);

    // Handle Map Clicks for Adding Waypoints
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const handleMapClick = (e: L.LeafletMouseEvent) => {
            if (isAddMode) {
                setPendingCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
                setNewWpName('');
                setNewWpDesc('');
                // Don't disable add mode yet, wait for user input in modal
            }
        };

        map.on('click', handleMapClick);

        // Update cursor based on mode
        if (mapContainerRef.current) {
            mapContainerRef.current.style.cursor = isAddMode ? 'crosshair' : 'grab';
        }

        return () => {
            map.off('click', handleMapClick);
        };
    }, [isAddMode]);

    const handleSaveWaypoint = () => {
        if (pendingCoords && newWpName.trim() !== "") {
            const newWaypoint: CustomWaypoint = {
                id: Date.now().toString(),
                name: newWpName.trim(),
                description: newWpDesc.trim(),
                lat: pendingCoords.lat,
                lng: pendingCoords.lng,
                timestamp: Date.now()
            };
            setCustomWaypoints(prev => [...prev, newWaypoint]);
            setPendingCoords(null);
            setIsAddMode(false);
        }
    };

    const handleCancelWaypoint = () => {
        setPendingCoords(null);
        setIsAddMode(false);
    };

    // Handle Tile Layer Switching
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Remove existing tile layer if it exists
        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        // Define URLs and Attributions
        const url = isSatellite 
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        
        const attribution = isSatellite
            ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, IGN, IGP'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

        // Add new layer
        const newLayer = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(map);
        newLayer.bringToBack(); // Ensure markers stay on top
        tileLayerRef.current = newLayer;

    }, [isSatellite]);

    const handleDeleteWaypoint = (id: string) => {
        if(window.confirm("¿Borrar este punto?")) {
            setCustomWaypoints(prev => prev.filter(wp => wp.id !== id));
        }
    };

    // Handle Markers, Track and Waypoints
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        // Clear existing layers
        layersRef.current.forEach(layer => layer.remove());
        layersRef.current = [];

        // 1. Activity Markers
        activities.forEach(act => {
            if(act.coords && act.coords.lat) {
                const marker = L.marker([act.coords.lat, act.coords.lng]).addTo(map);
                marker.bindPopup(`
                    <div style="padding: 10px; font-family: 'Roboto Condensed', sans-serif; max-width: 200px;">
                        <h3 style="margin: 0 0 4px 0; font-weight: bold; color: #1e3a8a; font-size: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">${act.title}</h3>
                        <p style="margin: 6px 0; font-size: 11px; color: #1e3a8a; font-weight: bold;">${act.locationName}</p>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${act.coords.lat},${act.coords.lng}" 
                           target="_blank" style="display: block; background: #1e3a8a; color: white; text-align: center; padding: 8px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 10px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                           INDICACIONES
                        </a>
                    </div>
                `);
                layersRef.current.push(marker);
            }
        });

        // 2. Custom Waypoints Markers
        customWaypoints.forEach(wp => {
            // Using a distinct visual style for custom points (Purple Circle)
            const marker = L.circleMarker([wp.lat, wp.lng], {
                radius: 8,
                fillColor: "#9333ea", // Purple-600
                color: "#ffffff",
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(map);

            // Create popup content wrapper
            const container = document.createElement('div');
            
            // Render React component into the popup container
            const root = createRoot(container);
            root.render(
                <div className="p-2 min-w-[160px] font-sans">
                    <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1">
                            <h3 className="font-bold text-purple-700 text-sm m-0 leading-tight break-words">{wp.name}</h3>
                            {wp.description && (
                                <p className="text-[11px] text-slate-600 mt-1 mb-0 leading-snug break-words border-l-2 border-purple-200 pl-2">
                                    {wp.description}
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={() => handleDeleteWaypoint(wp.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 bg-rose-50 rounded-full shrink-0 mt-0.5"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 mb-2 flex items-center gap-1">
                         <MapPin size={10} /> Mis guardados
                    </div>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${wp.lat},${wp.lng}`} 
                       target="_blank" 
                       className="block w-full text-center bg-purple-600 text-white text-[10px] font-bold py-1.5 rounded-lg uppercase tracking-wider hover:bg-purple-700 transition-colors"
                    >
                        Ir aquí
                    </a>
                </div>
            );

            marker.bindPopup(container);
            layersRef.current.push(marker);
        });

        // 3. Static Waypoints
        GPX_WAYPOINTS.forEach(wpt => {
            const circleMarker = L.circleMarker([wpt.lat, wpt.lng], {
                radius: 6, fillColor: "#BE123C", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(map);
            circleMarker.bindPopup(`<div style="font-family: 'Roboto Condensed', sans-serif; font-size: 12px; font-weight: bold; color: #BE123C;">${wpt.name}</div>`);
            layersRef.current.push(circleMarker);
        });

        // 4. Track Polyline
        const polyline = L.polyline(MARSEILLE_TRACK, { color: '#1e3a8a', weight: 4, opacity: 0.7, dashArray: '8, 12' }).addTo(map);
        layersRef.current.push(polyline);
        
        // 5. User Location
        if (userLocation) {
            const uMarker = L.circleMarker([userLocation.lat, userLocation.lng], { radius: 8, color: 'white', weight: 3, fillColor: '#3b82f6', fillOpacity: 1 }).addTo(map);
            layersRef.current.push(uMarker);
        }
    }, [activities, userLocation, customWaypoints]); // Re-run when customWaypoints change

    // Handle Focus
    useEffect(() => {
        if (mapInstanceRef.current && focusedLocation) {
            mapInstanceRef.current.flyTo([focusedLocation.lat, focusedLocation.lng], 16);
        }
    }, [focusedLocation]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            
            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3">
                <button 
                    onClick={() => setIsSatellite(!isSatellite)}
                    className="bg-white/95 backdrop-blur-sm text-blue-900 px-3 py-2 rounded-xl shadow-lg border border-blue-100 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform hover:bg-white"
                >
                    <Layers size={16} />
                    {isSatellite ? 'Mapa' : 'Satélite'}
                </button>

                <button 
                    onClick={() => {
                        setIsAddMode(!isAddMode);
                        setPendingCoords(null); // Reset pending if cancelling via toggle
                    }}
                    className={`px-3 py-2 rounded-xl shadow-lg border font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all ${
                        isAddMode 
                        ? 'bg-purple-600 text-white border-purple-700 animate-pulse' 
                        : 'bg-white/95 backdrop-blur-sm text-purple-900 border-purple-100'
                    }`}
                >
                    {isAddMode ? <MapPin size={16} /> : <Plus size={16} />}
                    {isAddMode ? 'Toca Mapa' : 'Añadir'}
                </button>
            </div>

            {/* Hint Toast for Add Mode */}
            {isAddMode && !pendingCoords && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] bg-purple-900/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl backdrop-blur-md animate-bounce">
                    Toca cualquier punto del mapa
                </div>
            )}

            {/* Add Waypoint Modal */}
            {pendingCoords && (
                <div className="absolute inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                                <MapPin size={20} /> Nuevo Punto
                            </h3>
                            <button onClick={handleCancelWaypoint} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-wider">Nombre</label>
                                <input 
                                    type="text" 
                                    autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-300"
                                    placeholder="Ej. Restaurante favorito"
                                    value={newWpName}
                                    onChange={(e) => setNewWpName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-wider flex items-center gap-1">
                                    <AlignLeft size={10} /> Descripción <span className="text-slate-300 font-normal normal-case">(Opcional)</span>
                                </label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-300 min-h-[80px] resize-none"
                                    placeholder="Añade notas, horarios o detalles..."
                                    value={newWpDesc}
                                    onChange={(e) => setNewWpDesc(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={handleCancelWaypoint}
                                    className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveWaypoint}
                                    disabled={!newWpName.trim()}
                                    className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
                                >
                                    <Save size={16} /> Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapComponent;