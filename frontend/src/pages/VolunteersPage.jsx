import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Truck,
  MapPin,
  Star,
  ShieldCheck,
  Phone,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { VOLUNTEERS_DATA } from '../data/mockData';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

export default function VolunteersPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadVolunteers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getVolunteers();
      setVolunteers((response.data || []).map((item) => ({
        ...item,
        vehicleType: item.vehicleType || item.vehicle_type || 'Vehicle unavailable',
        vehicleCapacity: item.vehicleCapacity || 'Backend capacity unavailable',
        status: item.status || item.availability || 'Unknown',
        rating: item.rating || 'n/a',
        operatingRadiusMiles: item.operatingRadiusMiles || 'n/a',
        phone: item.phone || 'Backend contact unavailable',
        completedRescues: item.completedRescues || 0,
        foodHandlerCertified: Boolean(item.foodHandlerCertified),
      })));
    } catch (requestError) {
      setError('Backend unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVolunteers(); }, []);

  const handleToggleStatus = (id) => {
    setVolunteers((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const nextStatus =
            v.status === 'Available'
              ? 'Off Duty'
              : v.status === 'Off Duty'
              ? 'Available'
              : v.status;
          return { ...v, status: nextStatus };
        }
        return v;
      })
    );
    addToast({
      title: 'Volunteer Status Toggled',
      message: 'Route Agent updated autonomous dispatch queue.',
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Volunteer Transport Fleet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Community couriers, refrigerated van operators, and thermal transport volunteers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/map')}
            variant="secondary"
            size="sm"
            icon={MapPin}
          >
            Live Courier Map
          </Button>
        </div>
      </div>

      {error && <Card bodyClassName="p-4"><div className="flex items-center justify-between text-sm text-red-700"><span>{error}</span><Button onClick={loadVolunteers} variant="secondary" size="sm">Retry</Button></div></Card>}
      {loading && <Card bodyClassName="p-8 text-center text-sm text-slate-500">Loading volunteers...</Card>}

      {/* Volunteer Grid */}
      {!loading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {volunteers.map((vol) => (
          <div
            key={vol.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{vol.id}</span>
                    <Badge status={vol.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{vol.name}</h3>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{vol.rating}</span>
                </div>
              </div>

              {/* Vehicle & Capacity Specs */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vehicle Type</span>
                  <span className="font-semibold text-slate-800">{vol.vehicleType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Payload Capacity</span>
                  <span className="font-mono text-slate-700">{vol.vehicleCapacity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Operating Radius</span>
                  <span className="font-mono text-slate-700">{vol.operatingRadiusMiles} miles</span>
                </div>
              </div>

              {/* Status & Active Mission */}
              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{vol.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{vol.completedRescues} Verified Rescues Completed</span>
                </div>

                {vol.foodHandlerCertified && (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Food Safety & Thermal Handling Certified</span>
                  </div>
                )}

                {vol.currentMission && (
                  <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-[11px] mt-2 font-mono">
                    <span className="font-bold">Active Mission:</span> {vol.currentMission}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center gap-2 border-t border-slate-100">
              {vol.status === 'On Mission' ? (
                <Button
                  onClick={() => navigate('/map')}
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center"
                >
                  Track Transit Route
                </Button>
              ) : (
                <Button
                  onClick={() => handleToggleStatus(vol.id)}
                  variant={vol.status === 'Available' ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full justify-center"
                >
                  {vol.status === 'Available' ? 'Set Off Duty' : 'Mark Available'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
