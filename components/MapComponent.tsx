import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers } from 'lucide-react';
import { Activity, Coordinates } from '../types';
import { GPX_WAYPOINTS, MARSEILLE_TRACK } from '../constants';

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

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        
        // Create map instance without adding tile layer yet
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([43.2965, 5.3698], 13);
        
        mapInstanceRef.current = map;
        return () => { map.remove(); mapInstanceRef.current = null; };
    }, []);

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
            ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

        // Add new layer
        const newLayer = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(map);
        newLayer.bringToBack(); // Ensure markers stay on top
        tileLayerRef.current = newLayer;

    }, [isSatellite]);

    // Handle Markers, Track and Waypoints
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        // Clear existing layers (markers, polyline)
        layersRef.current.forEach(layer => layer.remove());
        layersRef.current = [];

        // Add activity markers
        activities.forEach(act => {
            if(act.coords && act.coords.lat) {
                const marker = L.marker([act.coords.lat, act.coords.lng]).addTo(map);
                marker.bindPopup(`
                    <div style="padding: 10px; font-family: 'Roboto Condensed', sans-serif; max-width: 200px;">
                        <h3 style="margin: 0 0 4px 0; font-weight: bold; color: #1e3a8a; font-size: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">${act.title}</h3>
                        <p style="margin: 6px 0; font-size: 11px; color: #1e3a8a; font-weight: bold;">${act.locationName}</p>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${act.coords.lat},${act.coords.lng}" 
                           target="_blank" style="display: block; background: #1e3a8a; color: white; text-align: center; padding: 8px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 10px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                           INDICACIONES (Google Maps)
                        </a>
                    </div>
                `);
                layersRef.current.push(marker);
            }
        });

        // Add Waypoints
        GPX_WAYPOINTS.forEach(wpt => {
            const circleMarker = L.circleMarker([wpt.lat, wpt.lng], {
                radius: 6, fillColor: "#BE123C", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(map);
            circleMarker.bindPopup(`<div style="font-family: 'Roboto Condensed', sans-serif; font-size: 12px; font-weight: bold; color: #BE123C;">${wpt.name}</div>`);
            layersRef.current.push(circleMarker);
        });

        // Add Track
        const polyline = L.polyline(MARSEILLE_TRACK, { color: '#1e3a8a', weight: 4, opacity: 0.7, dashArray: '8, 12' }).addTo(map);
        layersRef.current.push(polyline);
        
        // Add User Location
        if (userLocation) {
            const uMarker = L.circleMarker([userLocation.lat, userLocation.lng], { radius: 8, color: 'white', weight: 3, fillColor: '#3b82f6', fillOpacity: 1 }).addTo(map);
            layersRef.current.push(uMarker);
        }
    }, [activities, userLocation]);

    // Handle Focus
    useEffect(() => {
        if (mapInstanceRef.current && focusedLocation) {
            mapInstanceRef.current.flyTo([focusedLocation.lat, focusedLocation.lng], 16);
        }
    }, [focusedLocation]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            
            {/* Layer Toggle Button */}
            <button 
                onClick={() => setIsSatellite(!isSatellite)}
                className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-sm text-blue-900 px-3 py-2 rounded-xl shadow-lg border border-blue-100 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform hover:bg-white"
            >
                <Layers size={16} />
                {isSatellite ? 'Mapa' : 'Satélite'}
            </button>
        </div>
    );
};

export default MapComponent;