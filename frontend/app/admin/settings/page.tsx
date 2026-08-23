'use client';

import React, { useState, useEffect } from 'react';
import { Settings, User, Key, Copy, Check, RefreshCw } from 'lucide-react';

export default function CloudAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api'>('profile');
  
  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // API Integration state
  const [facility, setFacility] = useState<any>(null);
  const [facilityLoading, setFacilityLoading] = useState(true);
  const [facilitySaving, setFacilitySaving] = useState(false);
  const [apiMessage, setApiMessage] = useState({ text: '', type: '' });
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchFacility();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/settings/profile');
      if (res.ok) {
        const data = await res.json();
        setProfileName(data.name || '');
        setProfileEmail(data.email || '');
      }
    } catch (error) {
      console.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchFacility = async () => {
    try {
      const res = await fetch('/api/settings/facilities');
      if (res.ok) {
        const data = await res.json();
        setFacility(data.facility);
      }
    } catch (error) {
      console.error('Failed to load facility');
    } finally {
      setFacilityLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: '' });
    
    if (newPassword && newPassword !== confirmPassword) {
      setProfileMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          ...(newPassword ? { password: newPassword } : {})
        })
      });

      if (res.ok) {
        setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        setProfileMessage({ text: err.error || 'Failed to update profile', type: 'error' });
      }
    } catch (error) {
      setProfileMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure you want to regenerate the API key? Local facilities will stop syncing until they are updated with the new key.')) {
      return;
    }
    
    setApiMessage({ text: '', type: '' });
    setFacilitySaving(true);
    
    try {
      const res = await fetch('/api/settings/facilities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerateKey' })
      });

      if (res.ok) {
        const data = await res.json();
        setFacility(data.facility);
        setApiMessage({ text: 'API key regenerated successfully.', type: 'success' });
        setShowKey(true);
      } else {
        setApiMessage({ text: 'Failed to regenerate API key.', type: 'error' });
      }
    } catch (error) {
      setApiMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setFacilitySaving(false);
    }
  };

  const handleUpdateFacilityName = async () => {
    if (!facility?.name) return;
    
    setApiMessage({ text: '', type: '' });
    setFacilitySaving(true);
    
    try {
      const res = await fetch('/api/settings/facilities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateName', name: facility.name })
      });

      if (res.ok) {
        setApiMessage({ text: 'Facility name updated successfully.', type: 'success' });
      } else {
        setApiMessage({ text: 'Failed to update facility name.', type: 'error' });
      }
    } catch (error) {
      setApiMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setFacilitySaving(false);
    }
  };
  
  const handleBootstrapFacility = async () => {
    setApiMessage({ text: '', type: '' });
    setFacilitySaving(true);
    
    try {
      const res = await fetch('/api/settings/facilities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerateKey', name: 'Feni Hotel (Primary)' })
      });

      if (res.ok) {
        const data = await res.json();
        setFacility(data.facility);
        setApiMessage({ text: 'Facility initialized successfully.', type: 'success' });
      } else {
        setApiMessage({ text: 'Failed to initialize facility.', type: 'error' });
      }
    } catch (error) {
      setApiMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setFacilitySaving(false);
    }
  };

  const copyToClipboard = () => {
    if (!facility?.apiKey) return;
    navigator.clipboard.writeText(facility.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-2">Manage your cloud admin profile and facility API integration.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50/50">
          <nav className="flex px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'api'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Key className="w-4 h-4" />
              API Integration
            </button>
          </nav>
        </div>

        <div className="p-6 md:p-8">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Settings</h2>
              
              {profileLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-100 rounded w-full"></div>
                  <div className="h-10 bg-gray-100 rounded w-full"></div>
                  <div className="h-10 bg-gray-100 rounded w-full"></div>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {profileMessage.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${
                      profileMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {profileMessage.text}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profileEmail}
                        disabled
                        className="w-full px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-400 mt-1">Email address cannot be changed.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <h3 className="text-md font-bold text-gray-900">Change Password</h3>
                    <p className="text-sm text-gray-500 mb-4">Leave blank if you don&apos;t want to change your password.</p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* API INTEGRATION TAB */}
          {activeTab === 'api' && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Local Sync Integration</h2>
              <p className="text-sm text-gray-500 mb-6">
                Use this API key to connect your local facility server to this cloud instance.
                This ensures your local POS and Reception data syncs correctly.
              </p>

              {facilityLoading ? (
                <div className="animate-pulse h-32 bg-gray-100 rounded-xl w-full"></div>
              ) : !facility ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Facility Initialized</h3>
                  <p className="text-sm text-gray-500 mb-6">Initialize a facility to generate your first API key.</p>
                  <button
                    onClick={handleBootstrapFacility}
                    disabled={facilitySaving}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    {facilitySaving ? 'Initializing...' : 'Initialize Facility'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {apiMessage.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${
                      apiMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {apiMessage.text}
                    </div>
                  )}

                  <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={facility.name}
                          onChange={(e) => setFacility({ ...facility, name: e.target.value })}
                          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleUpdateFacilityName}
                          disabled={facilitySaving}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                          Save Name
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secret API Key</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <input
                            type={showKey ? "text" : "password"}
                            value={facility.apiKey}
                            readOnly
                            className="w-full px-4 py-3 bg-gray-50 font-mono text-sm rounded-xl border border-gray-200 text-gray-700 pr-12"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            {showKey ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center justify-center p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
                          title="Copy API Key"
                        >
                          {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Keep this key secure. If compromised, you can regenerate a new one below.
                      </p>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <button
                        onClick={handleRegenerateKey}
                        disabled={facilitySaving}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        {facilitySaving ? 'Regenerating...' : 'Regenerate API Key'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
