import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Clock,
  AlertTriangle,
  Sparkles,
  Scale,
  Truck,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  MapPin,
  Bot,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import {
  DASHBOARD_STATS,
  RECENT_DONATIONS,
  ACTIVE_OPERATIONS,
  AGENT_MONITOR_DATA,
} from '../data/mockData';
import { formatNumber } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [recentDonations, setRecentDonations] = useState([]);
  const [liveStats, setLiveStats] = useState(DASHBOARD_STATS);
  const [backendError, setBackendError] = useState(null);

  const loadDashboard = async () => {
    try {
      const [donationsResponse, matchesResponse, volunteersResponse] = await Promise.all([
        api.getDonations(),
        api.getMatches(),
        api.getVolunteers(),
      ]);
      const donations = donationsResponse.data || [];
      setRecentDonations(donations.slice(0, 4).map((item) => ({
        ...item,
        restaurant: item.restaurant?.name || `Restaurant #${item.restaurant_id}`,
        foodName: item.food_name,
        expiryTime: item.expires_at,
      })));
      setLiveStats((previous) => ({
        ...previous,
        activeDonations: donations.filter((item) => item.status !== 'completed').length,
        atRiskDonations: donations.filter((item) => item.expires_at && new Date(item.expires_at) - Date.now() < 7200000).length,
        successfulMatches: (matchesResponse.data || []).filter((item) => item.status === 'completed').length,
        activeVolunteers: (volunteersResponse.data || []).filter((item) => item.availability !== 'off_duty').length,
      }));
    } catch (requestError) {
      setBackendError('Backend unavailable');
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  return (
    <div className="space-y-8">
      {backendError && <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 flex justify-between"><span>{backendError}</span><button type="button" onClick={loadDashboard} className="font-semibold underline">Retry</button></div>}
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live Ops
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Food Rescue Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time coordination across India’s high-priority food rescue hubs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/analytics')}
          >
            View analytics
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/map')}
          >
            Open map
          </Button>
        </div>
      </div>

      {/* 2. Primary KPI Metric Cards (6 core metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Meals Rescued"
          value={formatNumber(liveStats.mealsRescued)}
          trend="+18% vs last wk"
          trendPositive={true}
          icon={UtensilsCrossed}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Active Donations"
          value={liveStats.activeDonations}
          trend="8 awaiting pickup"
          trendPositive={true}
          icon={Clock}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="At-Risk Donations"
          value={liveStats.atRiskDonations}
          trend="Expiring < 2h"
          trendPositive={false}
          icon={AlertTriangle}
          iconBg="bg-red-50 text-red-600"
        />
        <StatCard
          title="Successful Matches"
          value={formatNumber(liveStats.successfulMatches)}
          trend="99.4% fulfill"
          trendPositive={true}
          icon={Sparkles}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Food Rescued"
          value={liveStats.foodRescuedFormatted}
          trend="24,150 kg diverted"
          trendPositive={true}
          icon={Scale}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Avg Match Time"
          value={`${liveStats.avgMatchTimeMinutes}m`}
          trend="-1.2m vs SLA"
          trendPositive={true}
          icon={Truck}
          iconBg="bg-blue-50 text-blue-600"
        />
      </div>

      {/* 4. Active Operations & AI Agent Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Rescue Operations */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Active Rescue Operations"
            subtitle="Real-time volunteer transit tracking & temperature compliance"
            action={
              <button
                onClick={() => navigate('/volunteers')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Fleet</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-4">
              {ACTIVE_OPERATIONS.map((op) => (
                <div
                  key={op.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">{op.id}</span>
                        <Badge status={op.status} />
                        <span className="text-xs text-slate-500 font-mono">ETA {op.etaMinutes} min</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mt-1">{op.foodItem}</h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs font-medium text-slate-900">{op.volunteer}</p>
                      <p className="text-[11px] text-slate-500">{op.vehicle}</p>
                    </div>
                  </div>

                  {/* Origin to Destination Route */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                    <span className="font-medium text-slate-800">{op.origin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-emerald-800">{op.destination}</span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Dispatch Progress</span>
                      <span className="font-mono font-semibold">{op.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${op.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Donations Table */}
          <Card
            title="Recent Food Surplus Listings"
            subtitle="Verified listings registered by commercial kitchens"
            action={
              <button
                onClick={() => navigate('/donations')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View All Donations</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Donor Restaurant</th>
                    <th className="py-2.5 px-3">Food Item</th>
                    <th className="py-2.5 px-3">Portions</th>
                    <th className="py-2.5 px-3">Expiry SLA</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900">{d.restaurant}</p>
                        <p className="text-[11px] text-slate-500">{d.location}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800">{d.foodName}</p>
                        <p className="text-[11px] text-slate-500">{d.dietType}</p>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{d.quantity}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-mono font-medium ${
                            d.expiryHours <= 2 ? 'text-red-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {d.expiryTime}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={d.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          onClick={() => navigate('/matches')}
                          variant="secondary"
                          size="sm"
                          className="text-xs py-1 px-2.5"
                        >
                          Match
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
