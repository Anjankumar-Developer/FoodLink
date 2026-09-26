import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  MapPin,
  Phone,
  Clock,
  Users,
  Utensils,
  Refrigerator,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { SHELTERS_DATA } from '../data/mockData';
import { useToast } from '../components/common/Toast';
import GoogleMapsGroundingSearch from '../components/maps/GoogleMapsGroundingSearch';

export default function SheltersPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [shelters, setShelters] = useState(SHELTERS_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newMealsNeeded, setNewMealsNeeded] = useState(30);
  const [showMapsGrounding, setShowMapsGrounding] = useState(false);

  const filteredShelters = shelters.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dietaryFocus.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUpdateDemandSubmit = () => {
    if (!selectedShelter) return;
    setShelters((prev) =>
      prev.map((s) =>
        s.id === selectedShelter.id ? { ...s, mealsNeededTonight: Number(newMealsNeeded) } : s
      )
    );
    setIsUpdateModalOpen(false);
    addToast({
      title: 'Shelter Demand Updated',
      message: `Updated demand to ${newMealsNeeded} meals for ${selectedShelter.name}. Shelter Agent notified.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Verified Shelter Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Certified partner facilities, safe storage capacities, and immediate meal intake demand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowMapsGrounding(!showMapsGrounding)}
            variant={showMapsGrounding ? 'primary' : 'secondary'}
            size="sm"
            icon={MapPin}
          >
            {showMapsGrounding ? 'Hide Maps Grounding' : 'Google Maps Place Grounding'}
          </Button>
          <Button
            onClick={() => navigate('/donations/new')}
            variant="primary"
            size="sm"
            icon={Utensils}
          >
            Direct Surplus
          </Button>
        </div>
      </div>

      {/* Google Maps Grounding Panel (expandable) */}
      {showMapsGrounding && (
        <div className="animate-in fade-in duration-200">
          <GoogleMapsGroundingSearch />
        </div>
      )}

      {/* Search Bar */}
      <Card bodyClassName="p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search shelters by name, dietary capability, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </Card>

      {/* Shelter Cards Grid */}
      {filteredShelters.length === 0 ? (
        <Card bodyClassName="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Home className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No Shelters Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No partner shelters matched your search criteria. Try a different search term or clear the filter.
          </p>
          <Button
            onClick={() => setSearchTerm('')}
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            Clear Filter
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShelters.map((shelter) => {
          const occupancyRate = Math.round((shelter.currentOccupancy / shelter.capacityTotal) * 100);

          return (
            <div
              key={shelter.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      {shelter.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {shelter.name}
                    </h3>
                  </div>
                  <Badge status={shelter.status} />
                </div>

                <p className="text-xs text-slate-500 mt-1">{shelter.category}</p>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{shelter.address}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Intake: {shelter.intakeSchedule}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{shelter.phone} · {shelter.contactPerson}</span>
                  </div>
                </div>

                {/* Capacity and Demand Gauge */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Beds Occupied</span>
                    <span className="font-mono font-bold text-slate-900">
                      {shelter.currentOccupancy} / {shelter.capacityTotal} ({occupancyRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        occupancyRate > 90 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Needed Tonight:</span>
                    <span className="font-mono font-bold text-red-600">
                      +{shelter.mealsNeededTonight} meals
                    </span>
                  </div>
                </div>

                {/* Dietary Tags (unboxed or clean subtle text with separators) */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Dietary Needs: </span>
                  {shelter.dietaryFocus.join(' · ')}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                <Button
                  onClick={() => {
                    setSelectedShelter(shelter);
                    setNewMealsNeeded(shelter.mealsNeededTonight);
                    setIsUpdateModalOpen(true);
                  }}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  Adjust Census
                </Button>
                <Button
                  onClick={() => navigate('/matches')}
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  className="flex-1"
                >
                  Allocate
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Adjust Census Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Shelter Demand"
        subtitle={selectedShelter ? selectedShelter.name : ''}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsUpdateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateDemandSubmit}
            >
              Save & Notify Agents
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Hot Meals Tonight (Portions)
            </label>
            <input
              type="number"
              min="0"
              max="250"
              value={newMealsNeeded}
              onChange={(e) => setNewMealsNeeded(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Shelter Agent automatically adjusts matching bids for donor kitchens within a 10-mile radius.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
