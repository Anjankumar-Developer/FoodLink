import React, { useState } from 'react';
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

export default function AnalyticsPage() {
  const { addToast } = useToast();
  const [timeframe, setTimeframe] = useState('6m');

  const handleExportData = () => {
    addToast({
      title: 'Analytics Export Generated',
      message: 'HACCP food rescue and carbon offset report compiled into CSV format.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-8">
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
          value={formatNumber(DASHBOARD_STATS.mealsRescued)}
          trend="+24% YoY"
          trendPositive={true}
          icon={UtensilsCrossed}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Food Rescued"
          value={DASHBOARD_STATS.foodRescuedFormatted}
          trend="24.1 metric tons"
          trendPositive={true}
          icon={Scale}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Donations"
          value={formatNumber(DASHBOARD_STATS.successfulMatches + 48)}
          trend="1,468 manifests"
          trendPositive={true}
          icon={Calendar}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Successful Rescues"
          value={formatNumber(DASHBOARD_STATS.successfulMatches)}
          trend="98.4% success"
          trendPositive={true}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Average Matching Time"
          value={`${DASHBOARD_STATS.avgMatchTimeMinutes} min`}
          trend="-2.1m vs benchmark"
          trendPositive={true}
          icon={Clock}
          iconBg="bg-blue-50 text-blue-600"
        />
      </div>

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
