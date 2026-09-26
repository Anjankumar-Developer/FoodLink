import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Truck,
  RotateCcw,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { RECOMMENDED_MATCHES } from '../data/mockData';
import { useToast } from '../components/common/Toast';

export default function MatchesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [matches, setMatches] = useState(RECOMMENDED_MATCHES);
  const [approvedMatches, setApprovedMatches] = useState({});

  const handleApproveMatch = (matchId, shelterName) => {
    setApprovedMatches((prev) => ({ ...prev, [matchId]: true }));
    addToast({
      title: 'Rescue Operation Dispatched',
      message: `Match approved for ${shelterName}. Route Agent has assigned volunteer transit.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Autonomous Rescue Matches
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Algorithmic recommendations evaluating dietary alignment, shelter headcounts, transit ETAs, and storage capacity.
          </p>
        </div>

        <Button
          onClick={() => {
            addToast({
              title: 'Re-evaluating Network',
              message: 'Shelter Agent queried latest census updates from 14 facilities.',
              type: 'info',
            });
          }}
          variant="secondary"
          size="sm"
          icon={RotateCcw}
        >
          Re-Score Matches
        </Button>
      </div>

      {/* Match Cards List */}
      {matches.length === 0 ? (
        <Card bodyClassName="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No Pending Matches</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All registered surplus items have been paired and dispatched to partner shelters.
          </p>
          <Button
            onClick={() => navigate('/donations/new')}
            variant="primary"
            size="sm"
            className="mt-4"
          >
            Log New Surplus
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {matches.map((item) => {
          const isDispatched = approvedMatches[item.id];

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden"
            >
              {/* Card Header: Surplus Information */}
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{item.donationId}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-semibold text-slate-800">{item.restaurantName}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.foodName}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Top Match Score</p>
                    <p className="text-lg font-mono font-bold text-emerald-600 tabular-nums">
                      {item.matchScore}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Body: Recommended Match */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Primary Recommendation Details */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recommended Recipient</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">
                        {item.recommendedShelter.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.recommendedShelter.address}
                      </p>
                    </div>

                    {isDispatched ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                        <Truck className="w-4 h-4" />
                        <span>Dispatched & En Route</span>
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleApproveMatch(item.id, item.recommendedShelter.name)}
                        variant="primary"
                        size="md"
                        icon={CheckCircle2}
                      >
                        Approve & Dispatch
                      </Button>
                    )}
                  </div>

                  {/* 4 Feature Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-medium">Distance & ETA</p>
                      <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                        {item.recommendedShelter.distanceMiles} mi · {item.recommendedShelter.etaMinutes}m
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-medium">Shelter Census</p>
                      <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                        {item.recommendedShelter.currentCapacity}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-medium">Compatibility</p>
                      <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                        {item.recommendedShelter.dietCompatibility.split(' ')[0]}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-medium">Equipment</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                        Commercial Hot Racks
                      </p>
                    </div>
                  </div>

                  {/* Explainable AI Rationale Section */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>AI Multi-Agent Consensus Reasoning</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                </div>

                {/* Right Col: Alternative Shelter Matches */}
                <div className="border-t lg:border-t-0 lg:border-l border-slate-200/80 lg:pl-6 space-y-4">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Alternative Evaluated Matches
                  </h5>

                  <div className="space-y-3">
                    {item.alternativeMatches.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-3 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{alt.name}</span>
                          <span className="text-xs font-mono font-semibold text-slate-500">
                            {alt.matchScore}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>{alt.distanceMiles} mi</span>
                          <span>·</span>
                          <span>ETA {alt.etaMinutes} min</span>
                          <span>·</span>
                          <span>Cap: {alt.capacity}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {alt.reason}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/shelters')}
                      className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Explore all 14 network shelters</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
