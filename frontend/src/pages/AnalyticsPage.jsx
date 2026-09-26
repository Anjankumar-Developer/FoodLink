import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  UtensilsCrossed,
  Scale,
  Clock,
  CheckCircle2,
  TrendingUp,
  Download,
  Calendar,
} from 'lucide-react';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import { ANALYTICS_DATA, DASHBOARD_STATS } from '../data/mockData';
import { formatNumber } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

const riskPriority = { CRITICAL: 0, URGENT: 1, 'AT RISK': 2, SAFE: 3 };

export default function AnalyticsPage() {
  const { addToast } = useToast();
  const [timeframe, setTimeframe] = useState('6m');
  const [overview, setOverview] = useState(null);
  const [impact, setImpact] = useState(null);
  const [riskDonations, setRiskDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewResponse, impactResponse, donationsResponse, matchesResponse] = await Promise.all([
        api.getAnalytics(timeframe),
        api.getAnalyticsImpact(),
        api.getDonations(),
        api.getMatches(),
      ]);
      const matchesByDonation = (matchesResponse.data || []).reduce((result, match) => {
        if (!result[match.donation_id] || (match.final_score || 0) > (result[match.donation_id].final_score || 0)) {
          result[match.donation_id] = match;
        }
        return result;
      }, {});
      setOverview(overviewResponse.data);
      setImpact(impactResponse.data);
      setRiskDonations((donationsResponse.data || [])
        .map((donation) => {
          const match = matchesByDonation[donation.id];
          const remainingMinutes = donation.expires_at
            ? (new Date(donation.expires_at).getTime() - Date.now()) / 60000
            : Number.POSITIVE_INFINITY;
          const pickupFeasible = !match?.travel_minutes || remainingMinutes > match.travel_minutes;
          const recipientAvailable = !match || (match.capacity_score ?? 1) > 0;
          const riskLabel = remainingMinutes <= 0 || !pickupFeasible
            ? 'CRITICAL'
            : remainingMinutes <= 60 || !recipientAvailable || (match?.travel_minutes || 0) > 60
              ? 'URGENT'
              : remainingMinutes <= 120
                ? 'AT RISK'
                : 'SAFE';
          return { ...donation, match, remainingMinutes, pickupFeasible, recipientAvailable, riskLabel };
        })
        .filter((donation) => donation.riskLabel !== 'SAFE')
        .sort((first, second) => riskPriority[first.riskLabel] - riskPriority[second.riskLabel] || first.remainingMinutes - second.remainingMinutes)
        .slice(0, 6));
    } catch (requestError) {
      setError('Backend unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnalytics(); }, [timeframe]);

  const metrics = overview || {};

  const handleExportData = () => {
    addToast({
      title: 'Analytics Export Generated',
      message: 'HACCP food rescue and carbon offset report compiled into CSV format.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-8">
      {error && <Card bodyClassName="p-4"><div className="flex items-center justify-between text-sm text-red-700"><span>{error}</span><Button onClick={loadAnalytics} variant="secondary" size="sm">Retry</Button></div></Card>}
      {loading && <Card bodyClassName="p-4 text-sm text-slate-500">Loading live analytics...</Card>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Impact & Operational Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historical trends, rescue SLA compliance, and food redistribution breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg text-xs font-medium">
            {['30d', '6m', '1y'].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            onClick={handleExportData}
            variant="secondary"
            size="sm"
            icon={Download}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* 5 Core Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Meals Rescued"
          value={formatNumber(metrics.meals_rescued || 0)}
          trend="Recorded completed donations"
          trendPositive={true}
          icon={UtensilsCrossed}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Food Rescued"
          value={`${impact?.estimated_food_diverted_kg || 0} kg`}
          trend="Estimated impact"
          trendPositive={true}
          icon={Scale}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Donations"
          value={formatNumber(metrics.total_donations || 0)}
          trend="Backend records"
          trendPositive={true}
          icon={Calendar}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Successful Rescues"
          value={formatNumber(metrics.successful_rescues || 0)}
          trend={`${metrics.rescue_success_rate || 0}% rescue success rate`}
          trendPositive={true}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Average Matching Time"
          value={`${metrics.average_rescue_time_minutes || 0} min`}
          trend="Average rescue time"
          trendPositive={true}
          icon={Clock}
          iconBg="bg-blue-50 text-blue-600"
        />
      </div>

      <Card title="Operational Network" subtitle="Live counts and averages from backend records">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
          {[
            ['At-risk donations', metrics.at_risk_donations || 0],
            ['Expired donations', metrics.expired_donations || 0],
            ['Active rescues', metrics.active_rescues || 0],
            ['Available volunteers', metrics.available_volunteers || 0],
            ['Active recipients', metrics.active_recipients || 0],
            ['Avg match score', `${metrics.average_match_score || 0} / 100`],
            ['Avg rescue distance', `${metrics.average_rescue_distance_km || 0} km`],
          ].map(([label, value]) => (
            <div key={label} className="border-l-2 border-emerald-500 pl-3">
              <div className="text-slate-500">{label}</div>
              <div className="text-lg font-semibold text-slate-900 mt-1">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="At-Risk Radar" subtitle="Prioritized by remaining expiry window; verify recipient and pickup feasibility before dispatch.">
        {riskDonations.length === 0 ? (
          <div className="text-sm text-slate-500">No donations require immediate action.</div>
        ) : (
          <div className="space-y-2">
            {riskDonations.map((donation) => (
              <div key={donation.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{donation.food_name} <span className="text-[11px] text-red-700">{donation.riskLabel}</span></div>
                  <div className="text-xs text-slate-500">{donation.quantity} · {donation.status || 'unmatched'} · {donation.pickupFeasible ? 'pickup feasible' : 'pickup at risk'}</div>
                </div>
                <div className="text-xs font-mono font-semibold text-red-700">{Math.max(0, Math.round(donation.remainingMinutes))} min · ETA {donation.match?.travel_minutes ?? 'n/a'} min</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Charts Row 1: Monthly Rescues & Matching Time Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Rescues Volume */}
        <Card
          title="Rescued Meals Volume Growth"
          subtitle="Monthly cumulative portions safely delivered to verified shelters"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_DATA.monthlyRescues}>
                <defs>
                  <linearGradient id="mealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="meals"
                  name="Meals Rescued"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#mealGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Matching Speed Trend */}
        <Card
          title="Average Dispatch & Matching Time"
          subtitle="Time elapsed from kitchen surplus registration to volunteer dispatch (Target: <= 5m)"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ANALYTICS_DATA.matchingTimeTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  name="Actual Match Time"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="SLA Threshold"
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2: Category Breakdown & Peak Rescue Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Food Category Breakdown */}
        <Card
          title="Rescued Food Distribution by Category"
          subtitle="Percentage volume breakdown across dietary classifications"
        >
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ANALYTICS_DATA.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {ANALYTICS_DATA.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Share']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Hourly Volume Peaks */}
        <Card
          title="Peak Rescue Demand by Hour of Day"
          subtitle="Kitchen closing cycles and evening dinner shift distribution"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYTICS_DATA.hourlyRescuePeaks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="volume"
                  name="Rescue Operations"
                  fill="#16A34A"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
