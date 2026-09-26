import React, { useState } from 'react';
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
  URGENT_ALERTS,
  ACTIVE_OPERATIONS,
  AGENT_MONITOR_DATA,
} from '../data/mockData';
import { formatNumber } from '../utils/formatters';
import { useToast } from '../components/common/Toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState(URGENT_ALERTS);

  const handleDismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    addToast({
      title: 'Alert Acknowledged',
      message: 'Dispatch routing updated.',
      type: 'info',
    });
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Logistics Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time multi-agent food rescue coordination across SF Bay Area Metro.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/map')}
            variant="secondary"
            size="sm"
            icon={MapPin}
          >
            Live Map
          </Button>
          <Button
            onClick={() => navigate('/donations/new')}
            variant="primary"
            size="sm"
            icon={UtensilsCrossed}
          >
            Log Surplus
          </Button>
        </div>
      </div>

      {/* 2. Urgent Rescue Alerts Banner (if any) */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                alert.severity === 'critical'
                  ? 'bg-red-50/70 border-red-200 text-red-900'
                  : alert.severity === 'warning'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-blue-50/70 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {alert.severity === 'critical' ? (
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {alert.severity} Alert
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 font-mono">{alert.timestamp}</span>
                  </div>
                  <h4 className="text-sm font-semibold mt-0.5">{alert.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{alert.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Button
                  onClick={() => {
                    if (alert.donationId) {
                      navigate(`/matches`);
                    } else {
                      navigate(`/shelters`);
                    }
                  }}
                  variant={alert.severity === 'critical' ? 'danger' : 'primary'}
                  size="sm"
                >
                  {alert.actionRequired}
                </Button>
                <button
                  onClick={() => handleDismissAlert(alert.id)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Primary KPI Metric Cards (6 core metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Meals Rescued"
          value={formatNumber(DASHBOARD_STATS.mealsRescued)}
          trend="+18% vs last wk"
          trendPositive={true}
          icon={UtensilsCrossed}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Active Donations"
          value={DASHBOARD_STATS.activeDonations}
          trend="8 awaiting pickup"
          trendPositive={true}
          icon={Clock}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="At-Risk Donations"
          value={DASHBOARD_STATS.atRiskDonations}
          trend="Expiring < 2h"
          trendPositive={false}
          icon={AlertTriangle}
          iconBg="bg-red-50 text-red-600"
        />
        <StatCard
          title="Successful Matches"
          value={formatNumber(DASHBOARD_STATS.successfulMatches)}
          trend="99.4% fulfill"
          trendPositive={true}
          icon={Sparkles}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Food Rescued"
          value={DASHBOARD_STATS.foodRescuedFormatted}
          trend="24,150 kg diverted"
          trendPositive={true}
          icon={Scale}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Avg Match Time"
          value={`${DASHBOARD_STATS.avgMatchTimeMinutes}m`}
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
                  {RECENT_DONATIONS.slice(0, 4).map((d) => (
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

        {/* Right Col: AI Agent Live Monitor & Map Preview */}
        <div className="space-y-6">
          {/* AI Agents Live Card */}
          <Card
            title="AI Multi-Agent Monitor"
            subtitle="Autonomous negotiation state"
            action={
              <button
                onClick={() => navigate('/agents')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Full Telemetry</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-4">
              {AGENT_MONITOR_DATA.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{agent.name}</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-tight">
                    {agent.currentAction}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Updated {agent.lastUpdated}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Interactive Map Preview Card */}
          <Card
            title="Network Topology"
            subtitle="Current rescue fleet & donor nodes"
            action={
              <Button
                onClick={() => navigate('/map')}
                variant="primary"
                size="sm"
                icon={MapPin}
              >
                Open Map
              </Button>
            }
          >
            <div
              onClick={() => navigate('/map')}
              className="relative h-48 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group bg-slate-100 flex items-center justify-center"
            >
              {/* Visual Map Backdrop Mock Graphic */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/40 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-white/90 backdrop-blur-xs px-2 py-1 rounded text-[11px] font-medium text-slate-700 border border-slate-200">
                    4 Active Hubs · 2 Routes Live
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-xs font-bold text-slate-800">Launch Interactive Leaflet View</p>
                  <p className="text-[11px] text-slate-500">View real-time coordinates of shelters, volunteers & donors</p>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>LAT: 37.7749° N</span>
                  <span>LNG: -122.4194° W</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
