import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Utensils,
  Home,
  Truck,
  Layers,
  Info,
  Maximize2,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import GoogleMapsGroundingSearch from '../components/maps/GoogleMapsGroundingSearch';
import { api } from '../services/api';

const urgencyRank = { SAFE: 0, 'AT RISK': 1, URGENT: 2, CRITICAL: 3 };

const classifyDonation = (donation, rescue) => {
  const remainingMinutes = donation.expires_at
    ? (new Date(donation.expires_at).getTime() - Date.now()) / 60000
    : Number.POSITIVE_INFINITY;
  const eta = Number(rescue?.eta_minutes || 0);
  const buffer = remainingMinutes - eta;
  if (remainingMinutes <= 0) return 'CRITICAL';
  if (buffer <= 0) return 'CRITICAL';
  if (remainingMinutes <= 60 || buffer <= 30) return 'URGENT';
  if (remainingMinutes <= 120 || buffer <= 60) return 'AT RISK';
  return 'SAFE';
};

const coordinate = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
    ? [lat, lng]
    : null;
};

export default function RescueMapPage() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routesLayerRef = useRef(null);

  const [activeFilters, setActiveFilters] = useState({
    all: true,
    restaurants: true,
    recipients: true,
    volunteers: true,
    rescues: true,
    urgent: false,
  });

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [mapEntities, setMapEntities] = useState([]);
  const [activeRescues, setActiveRescues] = useState([]);
  const [selectedRescue, setSelectedRescue] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    api.getMapData()
      .then(({ data }) => {
        const rescues = data.rescues || [];
        const donationsByRestaurant = (data.donations || []).reduce((result, donation) => {
          const rescue = rescues.find((item) => item.donation_id === donation.id);
          const status = classifyDonation(donation, rescue);
          const key = donation.restaurant_id;
          result[key] = [...(result[key] || []), { ...donation, urgency: status }];
          return result;
        }, {});
        setActiveRescues(rescues);
        setMapEntities([
          ...(data.restaurants || []).map((item) => {
            const donations = donationsByRestaurant[item.id] || [];
            const urgency = donations.reduce((highest, donation) => (
              urgencyRank[donation.urgency] > urgencyRank[highest] ? donation.urgency : highest
            ), 'SAFE');
            return { ...item, type: 'restaurant', position: coordinate(item.latitude, item.longitude), donations, urgency };
          }),
          ...(data.recipients || []).map((item) => ({ ...item, type: 'recipient', position: coordinate(item.latitude, item.longitude) })),
          ...(data.volunteers || []).map((item) => ({ ...item, type: 'volunteer', position: coordinate(item.latitude, item.longitude) })),
          ...rescues.map((item) => ({
            ...item,
            id: `rescue-${item.rescue_id}`,
            type: 'rescue',
            name: `Rescue #${item.rescue_id}`,
            position: coordinate(item.volunteer?.latitude, item.volunteer?.longitude)
              || coordinate(item.restaurant?.latitude, item.restaurant?.longitude),
          })),
        ].filter((item) => item.position));
      })
      .catch(() => setMapError('Backend unavailable'))
      .finally(() => setMapLoading(false));
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double init

    // San Francisco Metro Center
    const map = L.map(mapContainerRef.current, {
      center: [37.778, -122.416],
      zoom: 13,
      zoomControl: true,
    });

    // CartoDB Positron clean map tiles (high reliability, clean light aesthetic)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Ensure map tiles calculate full dimensions smoothly
    const invalidateTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(invalidateTimer);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polylines when filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !routesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routesLayerRef.current.clearLayers();

    // Custom Icon Factory using HTML/Tailwind for crisp vector markers
    const createCustomIcon = (type) => {
      let bg = 'bg-emerald-600';
      let symbol = 'F';

      if (type === 'restaurant') {
        bg = 'bg-amber-500';
        symbol = '🍽';
      } else if (type === 'recipient') {
        bg = 'bg-emerald-600';
        symbol = '🏠';
      } else if (type === 'volunteer') {
        bg = 'bg-blue-600';
        symbol = '🚚';
      } else if (type === 'rescue') {
        bg = 'bg-red-600';
        symbol = '↗';
      }

      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full ${bg} text-white shadow-md border-2 border-white flex items-center justify-center text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform">
              ${symbol}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    const visibleEntities = mapEntities.filter((entity) => {
      if (activeFilters.all) return true;
      if (entity.type === 'restaurant' && !activeFilters.restaurants) return false;
      if (entity.type === 'recipient' && !activeFilters.recipients) return false;
      if (entity.type === 'volunteer' && !activeFilters.volunteers) return false;
      if (entity.type === 'rescue' && !activeFilters.rescues) return false;
      if (activeFilters.urgent && entity.type === 'restaurant' && entity.urgency === 'SAFE') return false;
      return true;
    });

    // Render Markers
    visibleEntities.forEach((entity) => {
      const marker = L.marker(entity.position, {
        icon: createCustomIcon(entity.type),
      });

      marker.on('click', () => {
        setSelectedEntity(entity);
        if (entity.type === 'rescue') {
          setSelectedRescue(entity);
        }
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 4px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${entity.name}</div>
          <div style="color: #64748b; font-size: 11px;">${entity.address || entity.vehicle || ''}</div>
          <div style="color: #16a34a; font-weight: 600; margin-top: 4px;">${entity.urgency || entity.status || entity.capacity || ''}</div>
        </div>
      `;
      marker.bindPopup(popupContent);
      markersLayerRef.current.addLayer(marker);
    });

    // Render only the selected rescue route from backend coordinates.
    if (activeFilters.rescues && selectedRescue) {
      const routeCoordinates = [
        coordinate(selectedRescue.restaurant?.latitude, selectedRescue.restaurant?.longitude),
        coordinate(selectedRescue.volunteer?.latitude, selectedRescue.volunteer?.longitude),
        coordinate(selectedRescue.recipient?.latitude, selectedRescue.recipient?.longitude),
      ].filter(Boolean);
      const polyline = L.polyline(routeCoordinates, {
        color: '#16a34a',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8,
      });

      routesLayerRef.current.addLayer(polyline);
    }
  }, [activeFilters, mapEntities, selectedRescue]);

  const toggleFilter = (filterKey) => {
    setActiveFilters((prev) => {
      if (filterKey === 'all') {
        return { ...prev, all: true, restaurants: true, recipients: true, volunteers: true, rescues: true, urgent: false };
      }
      if (prev.all) {
        return { all: false, restaurants: false, recipients: false, volunteers: false, rescues: false, urgent: false, [filterKey]: true };
      }
      return { ...prev, all: false, [filterKey]: !prev[filterKey] };
    });
  };

  const centerOnEntity = (entity) => {
    setSelectedEntity(entity);
    if (entity.type === 'rescue') setSelectedRescue(entity);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(entity.position, 15, {
        animate: true,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Real-Time Rescue Geospatial Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live telemetry tracking of surplus food batches, verified shelters, and courier corridors.
          </p>
        </div>

        {/* Layer Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => toggleFilter('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeFilters.all
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => toggleFilter('restaurants')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeFilters.restaurants && !activeFilters.all
                ? 'bg-amber-100 text-amber-900 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Restaurants
          </button>
          <button
            type="button"
            onClick={() => toggleFilter('recipients')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeFilters.recipients && !activeFilters.all
                ? 'bg-emerald-100 text-emerald-900 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Recipients
          </button>
          <button
            type="button"
            onClick={() => toggleFilter('volunteers')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeFilters.volunteers && !activeFilters.all
                ? 'bg-blue-100 text-blue-900 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Volunteers
          </button>
          <button
            type="button"
            onClick={() => toggleFilter('rescues')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeFilters.rescues && !activeFilters.all
                ? 'bg-red-100 text-red-900 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Rescues
          </button>
          <button
            type="button"
            onClick={() => toggleFilter('urgent')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeFilters.urgent && !activeFilters.all
                ? 'bg-amber-100 text-amber-900 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Urgent Donations
          </button>
        </div>
      </div>
      {mapError && <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{mapError}</div>}

      {/* Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map Viewport (3 Cols) */}
        <div className="lg:col-span-3">
          <div className="relative h-[650px] w-full rounded-xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Over-map Legend overlay */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5">
              <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                Active Corridor Legend
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Donor Kitchen (Surplus Ready)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Verified Shelter (Needs Meals)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Courier Van In Transit</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-600" />
                <span>Optimized Dispatch Corridor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Nodes Explorer (1 Col) */}
        <div className="space-y-4">
          <Card
            title="Active Network Nodes"
            subtitle="Click node to center view"
            bodyClassName="p-3 max-h-[590px] overflow-y-auto space-y-2.5"
          >
            {mapLoading && <div className="p-3 text-xs text-slate-500">Loading live map data...</div>}
            {!mapLoading && mapEntities.length === 0 && !mapError && <div className="p-3 text-xs text-slate-500">No live map entities found.</div>}
            {mapEntities.map((entity) => (
              <div
                key={entity.id}
                onClick={() => centerOnEntity(entity)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedEntity?.id === entity.id
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {entity.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase font-semibold text-slate-500">
                    {entity.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {entity.address || entity.vehicle}
                </p>
                <p className="text-xs font-medium text-emerald-700 mt-1">
                  {entity.urgency || entity.status || entity.capacity || 'Live backend entity'}
                </p>
              </div>
            ))}
          </Card>
          {selectedRescue && (
            <Card title={`Rescue #${selectedRescue.rescue_id}`} subtitle="Selected active rescue" bodyClassName="p-3 space-y-2 text-xs">
              <div className="font-semibold text-slate-900">{selectedRescue.status}</div>
              <div className="text-slate-600">{selectedRescue.restaurant?.name || 'Restaurant'} <span className="mx-1">↓</span> {selectedRescue.volunteer?.name || 'Volunteer'} <span className="mx-1">↓</span> {selectedRescue.recipient?.name || 'Recipient'}</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-600">
                <span>Distance: {selectedRescue.distance_km ?? 'n/a'} km</span>
                <span>ETA: {selectedRescue.eta_minutes ?? 'n/a'} min</span>
                <span>Expires: {selectedRescue.expires_at ? new Date(selectedRescue.expires_at).toLocaleString() : 'n/a'}</span>
                <span>Status: {selectedRescue.status}</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Google Maps Live Grounding Search Panel */}
      <div className="pt-2">
        <GoogleMapsGroundingSearch />
      </div>
    </div>
  );
}
