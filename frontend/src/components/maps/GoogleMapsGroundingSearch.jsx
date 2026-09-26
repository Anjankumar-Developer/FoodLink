import React, { useState } from 'react';
import {
  MapPin,
  Search,
  ExternalLink,
  Loader2,
  Navigation,
  Compass,
  Star,
  Building,
  RefreshCw,
} from 'lucide-react';
import Button from '../common/Button';
import { api } from '../../services/api';

const PRESET_QUERIES = [
  'Emergency homeless shelters and meal missions in San Francisco',
  'Food banks and community pantries near Mission District',
  'Hot meal soup kitchens open this evening',
  'Commercial bakeries and surplus food distribution points',
];

export default function GoogleMapsGroundingSearch({ onSelectPlace }) {
  const [query, setQuery] = useState(PRESET_QUERIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get browser location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          location = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
              () => resolve({ latitude: 37.7749, longitude: -122.4194 }),
              { timeout: 3000 }
            );
          });
        } catch (e) {
          location = { latitude: 37.7749, longitude: -122.4194 };
        }
      }

      const res = await api.mapsGrounding({
        query: q,
        location,
      });

      setResult(res);
    } catch (err) {
      console.error('Maps Grounding error:', err);
      setError(err.message || 'Failed to query Google Maps data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Google Maps Verified Grounding Explorer</span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                gemini-3.5-flash
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Query real-time geographic data with live Google Maps place links and reviews.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nearby shelters, emergency pantries, soup kitchens..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-colors"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isLoading || !query.trim()}
          icon={isLoading ? Loader2 : Search}
        >
          {isLoading ? 'Grounding...' : 'Find Places'}
        </Button>
      </form>

      {/* Preset Query Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
        <span className="text-slate-400 font-medium shrink-0">Suggestions:</span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(preset);
              handleSearch(preset);
            }}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-colors"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Results Container */}
      {result && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          {/* AI Synthesis Summary */}
          {result.text && (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {result.text}
            </div>
          )}

          {/* Place Cards with MUST-HAVE Grounding URLs */}
          {result.places && result.places.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Google Maps Grounded Locations ({result.places.length})</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Live Places API</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.places.map((place, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-slate-200/80 bg-white hover:border-emerald-500/80 hover:shadow-xs transition-all space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {place.title}
                      </h4>
                      {place.uri && (
                        <a
                          href={place.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold hover:underline shrink-0 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Review Snippets from Google Maps */}
                    {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                      <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100 leading-normal">
                        "{place.reviewSnippets[0]}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !isLoading && (
              <p className="text-xs text-slate-500 italic">
                No specific Google Maps places returned for this query. Try one of the suggested location prompts above.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
