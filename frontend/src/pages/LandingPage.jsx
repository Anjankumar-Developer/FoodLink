import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  MapPin,
  Bot,
  HeartHandshake,
  Utensils,
  Truck,
  CheckCircle2,
  Lock,
  Scale,
  Sparkles,
} from 'lucide-react';
import Button from '../components/common/Button';
import { DASHBOARD_STATS } from '../data/mockData';
import { formatNumber } from '../utils/formatters';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-24 py-12 md:py-20">
      {/* 1. Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/90 rounded-full text-xs font-semibold text-emerald-800">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-Time Autonomous Food Logistics</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] text-balance">
          Don't Let Good Food Expire.
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed text-balance">
          FOODLINK AI connects surplus food with verified shelters using real-time multi-agent coordination.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button
            onClick={() => navigate('/donations/new')}
            size="lg"
            variant="primary"
            icon={ArrowRight}
            className="shadow-sm hover:shadow-md"
          >
            Start Rescue
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
            variant="secondary"
          >
            View Live Network
          </Button>
        </div>

        {/* Live Operational Metrics Ribbon */}
        <div id="impact" className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-slate-200/80 text-left scroll-mt-24">
          <div>
            <p className="text-xs text-slate-500 uppercase font-medium">Meals Rescued</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {formatNumber(DASHBOARD_STATS.mealsRescued)}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Across 42 partners</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-medium">Food Diverted</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {DASHBOARD_STATS.foodRescuedFormatted}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Zero landfill waste</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-medium">Avg Match Time</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {DASHBOARD_STATS.avgMatchTimeMinutes} min
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Sub-5 minute dispatch</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-medium">Network Efficiency</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {DASHBOARD_STATS.networkEfficiencyRate}%
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">HACCP verified transit</p>
          </div>
        </div>
      </section>

      {/* 2. Rescue Workflow Visualization */}
      <section id="workflow" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Autonomous Pipeline
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How Surplus Becomes Sustenance in Minutes
          </h2>
          <p className="text-sm text-slate-600">
            A synchronized multi-agent loop that eliminates logistical delays before biological degradation begins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Utensils className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">01. SURPLUS NOTIFICATION</span>
            <h3 className="text-base font-semibold text-slate-900 mt-2">Commercial Kitchen Log</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Kitchens log prepared pans or perishable trays with quantity, temperature, and safe expiry window.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-blue-700">02. MULTI-AGENT TRIAGE</span>
            <h3 className="text-base font-semibold text-slate-900 mt-2">Harmonized Scoring</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Food & Shelter agents evaluate HACCP compliance, shelter dining headcount, and dietary match criteria in parallel.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-700">03. DISPATCH & TRANSIT</span>
            <h3 className="text-base font-semibold text-slate-900 mt-2">Dynamic Routing</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Route Agent selects nearest verified volunteer with thermal carriers, bypassing traffic hotspots.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">04. SAFE HANDOVER</span>
            <h3 className="text-base font-semibold text-slate-900 mt-2">Dignified Dinner Service</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Verified intake at shelter dock with electronic temperature confirmation and chain-of-custody logging.
            </p>
          </div>
        </div>
      </section>

      {/* 2b. How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-slate-200 rounded-2xl bg-white p-8 md:p-12 shadow-xs space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              System Ecosystem
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              How It Works for Every Network Partner
            </h2>
            <p className="text-sm text-slate-600">
              A friction-free coordination infrastructure tailored to the operational realities of kitchens, shelters, and drivers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">For Restaurants & Kitchens</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log surplus in under 60 seconds from any phone or kitchen POS. Receive automated liability protection under the Bill Emerson Good Samaritan Act and electronic pickup receipts.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">For Shelters & Pantries</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Update daily guest headcounts and dietary restrictions. The system delivers compatible hot meals directly to your intake door without overwhelming your refrigerator space.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">For Volunteer Drivers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Turn-by-turn routing with thermal transit guidance. Accept rescues that match your vehicle capacity and route along your daily commute or neighborhood errands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI Agents Section */}
      <section id="agents" className="bg-slate-100/70 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Autonomous Intelligence
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Specialized Multi-Agent Coordination
            </h2>
            <p className="text-sm text-slate-600">
              Unlike monolithic algorithms, FOODLINK AI deploys four decoupled agents that negotiate in real-time to solve complex logistics constraints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 uppercase">Food Safety Agent</span>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  99.2% Accuracy
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Perishability & Safety Verification</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Calculates biological decay windows using ambient temperature, dish preparation timestamp, and thermal container ratings to ensure zero spoilage risk.
              </p>
              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <p>· Analyzes allergens, dietary classifications (Halal, Kosher, Vegan)</p>
                <p>· Locks irrevocable expiration deadlines into smart dispatch tokens</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700 uppercase">Shelter Demand Agent</span>
                <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Real-Time Intake
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Demand Forecaster & Capacity Harmonizer</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aggregates bed check-ins, dining headcounts, and available kitchen heating equipment across shelters to match exact dietary demands without oversupplying.
              </p>
              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <p>· Prevents shelter refrigeration bottlenecks and food dumping</p>
                <p>· Prioritizes high-need family and youth transitional facilities</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase">Route Agent</span>
                <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Traffic Heuristics
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Dynamic Dispatch & Corridor Navigation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Evaluates vehicle types (cargo vans vs passenger hatchbacks), driver proximity, and dynamic urban road congestion to guarantee delivery inside safety bounds.
              </p>
              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <p>· Multi-stop cluster rescue optimization for adjacent restaurants</p>
                <p>· Automated real-time re-routing if transit delays exceed 10 minutes</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase">Coordinator Agent</span>
                <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Consensus Engine
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Master Orchestrator & Safety Audit</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Synthesizes decisions from all three sub-agents. Issues the final digital dispatch authorization only when transit ETA arrives well within food safety limits.
              </p>
              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <p>· Maintains tamper-proof handoff logs for health compliance</p>
                <p>· Automatically reallocates resources upon unexpected cancellations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Responsible AI & Safety Section */}
      <section id="responsible-ai" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-slate-200 rounded-2xl bg-white p-8 md:p-12 shadow-xs">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ethical AI Constitution</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Built on Principles of Equity, Safety & Human Dignity
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Autonomous logistics in humanitarian sectors require higher ethical standards than commercial delivery platforms. Every algorithmic allocation respects community needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-8 border-t border-slate-100">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Equitable Shelter Distribution</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The matching model prevents favoritism, ensuring smaller community pantries receive nutritious proteins alongside large central facilities.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Zero-Compromise Food Safety</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Any donation whose calculated delivery ETA falls within 30 minutes of biological danger thresholds is redirected or safely discarded.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Human-In-The-Loop Overrides</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Shelter directors and kitchen coordinators retain manual override control at every phase of matching, pickup, and intake.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Final CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Ready to Turn Surplus Into Impact?
        </h2>
        <p className="text-base text-slate-600 max-w-xl mx-auto">
          Join restaurants, bakeries, corporate kitchens, and certified shelters coordinating rescues on FOODLINK AI.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button
            onClick={() => navigate('/donations/new')}
            size="lg"
            variant="primary"
          >
            Log Food Surplus Now
          </Button>
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            variant="secondary"
          >
            Partner Portal Access
          </Button>
        </div>
      </section>
    </div>
  );
}
