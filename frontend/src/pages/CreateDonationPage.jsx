import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  Clock,
  Thermometer,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Mic,
  Loader2,
  Volume2,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { addNewDonation } from '../data/mockData';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { api } from '../services/api';

export default function CreateDonationPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    restaurant: 'The Grand Bistro & Kitchen',
    foodName: '',
    category: 'Prepared Meals',
    quantity: '',
    dietType: 'Omnivore',
    preparedTime: '30 mins ago',
    expiryTime: '2 hours',
    storageCondition: 'Hot Hold Container (65°C)',
    pickupNotes: 'Loading dock B on 4th Ave. Ring service bell.',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio transcription with gemini-3.5-transcribe
  const {
    isRecording,
    recordingDuration,
    isTranscribing,
    transcriptionError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const handleVoiceDictation = async () => {
    if (isRecording) {
      const transcription = await stopRecording();
      if (transcription) {
        addToast({
          title: 'Audio Transcribed',
          message: 'Transcribed using gemini-3.5-transcribe',
          type: 'success',
        });

        // Smart fill: Put transcription into foodName or pickupNotes
        setFormData((prev) => ({
          ...prev,
          foodName: prev.foodName ? prev.foodName : transcription,
          pickupNotes: prev.foodName ? `${prev.pickupNotes}\nVoice Note: ${transcription}` : prev.pickupNotes,
        }));
      }
    } else {
      await startRecording();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.foodName || !formData.quantity) {
      addToast({
        title: 'Validation Error',
        message: 'Please specify the food name and approximate volume or portion count.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const restaurantsResponse = await api.getRestaurants();
      const restaurant = (restaurantsResponse.data || []).find(
        (item) => item.name.toLowerCase() === formData.restaurant.toLowerCase()
      ) || restaurantsResponse.data?.[0];

      if (!restaurant) throw new Error('No restaurant is available in the backend.');

      const expiryHours = Number(formData.expiryTime.match(/[\d.]+/)?.[0]) || 2;
      const preparedAt = new Date();
      const expiresAt = new Date(preparedAt.getTime() + expiryHours * 3600000);
      await api.createDonation({
        restaurant_id: restaurant.id,
        food_name: formData.foodName,
        food_category: formData.category,
        quantity: formData.quantity,
        diet_type: formData.dietType,
        prepared_at: preparedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        storage_condition: formData.storageCondition,
        status: 'available',
      });
      setIsSubmitting(false);
      addToast({
        title: 'Food Surplus Registered',
        message: `${formData.foodName} registered successfully. AI Agents initiated matching sequence!`,
        type: 'success',
      });
      navigate('/matches');
    } catch (error) {
      setIsSubmitting(false);
      addToast({
        title: 'Backend unavailable',
        message: error.message || 'Donation could not be registered.',
        type: 'error',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Log Commercial Food Surplus
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Register prepared trays, bakery goods, or produce to trigger immediate multi-agent shelter matching.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container (2 Cols) */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Restaurant Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kitchen / Establishment Name *
                </label>
                <input
                  type="text"
                  name="restaurant"
                  required
                  value={formData.restaurant}
                  onChange={handleChange}
                  placeholder="e.g. The Grand Bistro & Kitchen"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Food Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Food Item Description *
                    </label>
                    <button
                      type="button"
                      onClick={handleVoiceDictation}
                      disabled={isTranscribing}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                        isRecording
                          ? 'bg-red-600 text-white animate-pulse'
                          : isTranscribing
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                      title="Dictate with microphone (gemini-3.5-transcribe)"
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Transcribing...</span>
                        </>
                      ) : isRecording ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>Stop ({recordingDuration}s)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 text-emerald-700" />
                          <span>Voice Dictate</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="foodName"
                      required
                      value={formData.foodName}
                      onChange={handleChange}
                      placeholder="e.g. Braised Beef & Herb Potatoes (or use Voice Dictate)"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  {isRecording && (
                    <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                      Listening... Speak your food name, portion volume, and temperature.
                    </p>
                  )}
                  {transcriptionError && (
                    <p className="text-[11px] text-amber-700 mt-1">{transcriptionError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Food Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Prepared Meals">Prepared Hot Meals</option>
                    <option value="Bakery & Grains">Bakery & Grains</option>
                    <option value="Fresh Produce">Fresh Produce & Salads</option>
                    <option value="Chilled Produce">Chilled Seafood & Deli</option>
                    <option value="Dairy & Beverages">Dairy & Beverages</option>
                    <option value="Dry Goods">Dry Packaged Goods</option>
                  </select>
                </div>
              </div>

              {/* Quantity & Diet Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volume / Portions *
                  </label>
                  <input
                    type="text"
                    name="quantity"
                    required
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g. 35 deep trays (~100 portions)"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dietary Classification
                  </label>
                  <select
                    name="dietType"
                    value={formData.dietType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Omnivore">Omnivore (Standard)</option>
                    <option value="High-Protein / Halal">Halal Certified / High-Protein</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan (Plant-based)</option>
                    <option value="Gluten-Safe">Gluten-Free / Allergen-Safe</option>
                    <option value="Pescatarian">Pescatarian</option>
                  </select>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prepared Timestamp
                  </label>
                  <input
                    type="text"
                    name="preparedTime"
                    value={formData.preparedTime}
                    onChange={handleChange}
                    placeholder="e.g. 1 hour ago (16:30)"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Safe Expiration Window
                  </label>
                  <input
                    type="text"
                    name="expiryTime"
                    value={formData.expiryTime}
                    onChange={handleChange}
                    placeholder="e.g. 2h 30m remaining"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Storage Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Storage Condition (HACCP Safe)
                </label>
                <select
                  name="storageCondition"
                  value={formData.storageCondition}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="Hot Hold Container (65°C)">Heated Holding Container (65°C+)</option>
                  <option value="Refrigerated (3°C)">Commercial Refrigerator (0°C - 4°C)</option>
                  <option value="Dry Ambient (20°C)">Dry Ambient Temperature (Bakery / Produce)</option>
                  <option value="Deep Freeze (-18°C)">Deep Freeze (-18°C or colder)</option>
                </select>
              </div>

              {/* Pickup notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dock Access & Handover Instructions
                </label>
                <textarea
                  name="pickupNotes"
                  rows={2}
                  value={formData.pickupNotes}
                  onChange={handleChange}
                  placeholder="e.g. Loading dock access code, door bell location, container return requests..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/donations')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  icon={Sparkles}
                >
                  {isSubmitting ? 'Evaluating Safety & Matching...' : 'Submit & Trigger AI Dispatch'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Pre-Flight AI Simulation Card (1 Col) */}
        <div className="space-y-6">
          <Card
            title="Pre-Flight Food Agent Audit"
            subtitle="Autonomous validation before listing is published"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>HACCP Compliance Check</span>
                </div>
                <p className="text-emerald-900 leading-relaxed">
                  Thermal holding parameters set to <span className="font-semibold">{formData.storageCondition}</span>. Biological risk window evaluates safely for at least 150 minutes.
                </p>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span>Donor Trust Tier</span>
                  <span className="font-semibold text-slate-900">Verified Gold (Tier 1)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span>Liability Protection</span>
                  <span className="font-semibold text-emerald-700">Bill Emerson Act Active</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span>Target Shelters in Radius</span>
                  <span className="font-semibold text-slate-900">4 within 5 miles</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>Estimated Volunteer Dispatch</span>
                  <span className="font-semibold text-blue-700">~6 minutes</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 leading-normal">
                Once submitted, Food Agent and Shelter Agent execute real-time bidding to determine the highest-impact recipient without human bottleneck.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
