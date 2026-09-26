import React, { useState } from 'react';
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Bell,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { USER_PROFILE_DATA } from '../data/mockData';
import { useToast } from '../components/common/Toast';

export default function ProfilePage() {
  const { addToast } = useToast();
  const [profile, setProfile] = useState(USER_PROFILE_DATA);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (key) => {
    setProfile((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast({
        title: 'Profile Settings Updated',
        message: 'Logistics parameters and notification preferences successfully saved.',
        type: 'success',
      });
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Coordinator Profile & Logistics Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure regional dispatch corridors, automated matching confidence limits, and emergency channels.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity & Organization Card */}
        <Card title="Identity & Organization">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Role Title
              </label>
              <input
                type="text"
                name="role"
                value={profile.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Operating Organization
              </label>
              <input
                type="text"
                name="organization"
                value={profile.organization}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Direct Contact Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Phone (SMS Dispatch)
              </label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Metro Hub
              </label>
              <input
                type="text"
                name="operatingHub"
                value={profile.operatingHub}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>
        </Card>

        {/* Dispatch Controls Card */}
        <Card title="Autonomous Dispatch Parameters">
          <div className="space-y-6 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-700">
                  Maximum Courier Radius (Miles)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {profile.dispatchRadiusMiles} miles
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={profile.dispatchRadiusMiles}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    dispatchRadiusMiles: Number(e.target.value),
                  }))
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Volunteers beyond this radius are not auto-assigned without manual authorization.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-700">
                  Auto-Match Confidence Threshold
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {profile.autoMatchConfidenceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={profile.autoMatchConfidenceThreshold}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    autoMatchConfidenceThreshold: Number(e.target.value),
                  }))
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Matches with scores lower than this threshold require coordinator approval.
              </p>
            </div>

            {/* Safety Certification Seal */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  {profile.safetyComplianceLevel}
                </p>
                <p className="text-[11px] text-emerald-800">
                  Compliant with California Department of Public Health guidelines & Federal Good Samaritan Food Act.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Subscriptions Card */}
        <Card title="Autonomous Alert Channels">
          <div className="space-y-3 text-xs">
            {Object.entries({
              urgentExpiryAlerts: 'Urgent Food Expiration Warnings (< 2 Hours remaining)',
              routeDeviations: 'Dynamic Courier Re-routing & Traffic Delay Notifications',
              newDonationAvailable: 'Incoming Commercial Surplus Registered In Metro Region',
              shelterSurgeUpdates: 'Shelter Census Emergency Demand Spikes',
              smsDispatches: 'Critical SMS Dispatch Notifications to Mobile Terminal',
            }).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={profile.notifications[key] ?? false}
                  onChange={() => handleNotificationToggle(key)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="font-medium text-slate-800">{label}</span>
              </label>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSaving}
          >
            {isSaving ? 'Saving Changes...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
