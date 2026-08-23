'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import TaxEngineTab from './TaxEngineTab';
import SmartPosTerminalTab from './SmartPosTerminalTab';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'tax' | 'smart-pos'>('general');
  const [facilityName, setFacilityName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [address, setAddress] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      if (data.facilityName) setFacilityName(data.facilityName);
      if (data.timezone) setTimezone(data.timezone);
      if (data.address) setAddress(data.address);
      if (data.adminEmail) setAdminEmail(data.adminEmail);
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      setSuccessMsg('');
      
      if (newPassword && newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const payload = {
        facilityName: facilityName || null,
        timezone: timezone || null,
        address: address || null,
        adminEmail: adminEmail || null,
        newPassword: newPassword || null
      };

      const res = await apiClient('/api/proxy/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update settings');
      }
    },
    onSuccess: () => {
      setSuccessMsg('Settings updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'An error occurred');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="w-full max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Settings</h1>
          <p className="text-gray-500 mt-2">Manage facility configuration and admin credentials.</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'general' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('tax')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tax' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Tax Engine
            </button>
            <button
              onClick={() => setActiveTab('smart-pos')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'smart-pos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Smart POS Terminals
            </button>
          </nav>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            {activeTab === 'general' && (
              isLoading ? (
                <p className="text-gray-500">Loading settings...</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {errorMsg && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
                      {errorMsg}
                    </div>
                  )}
                  
                  {successMsg && (
                    <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                      {successMsg}
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Facility Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facility Name
                      </label>
                      <input
                        type="text"
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Feni Hotel Downtown"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Timezone
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select Timezone</option>
                          <option value="Africa/Lagos">Africa/Lagos</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="America/New_York">America/New_York</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Admin Email Address
                        </label>
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="admin@example.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facility Address
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Full facility address..."
                        rows={3}
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      System emails and alerts will be sent to the Admin Email Address.
                    </p>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Update Password</h3>
                    <p className="text-sm text-gray-500">Leave blank if you do not wish to change your password.</p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
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
                      disabled={updateMutation.isPending}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>

                </form>
              )
            )}
            
            {activeTab === 'tax' && (
              <TaxEngineTab />
            )}

            {activeTab === 'smart-pos' && (
              <SmartPosTerminalTab />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
