'use client';

import React, { useState, useEffect, use } from 'react';
import { CameraIcon, CheckCircleIcon, UserIcon, MapPinIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export default function GuestCheckinPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestPhone: '',
    title: '',
    occupation: '',
    nextOfKinPhone: '',
    address: '',
    lga: '',
    nationality: '',
    stateOfOrigin: '',
    passportNo: '',
    purposeOfVisit: '',
    arrivingFrom: '',
    goingTo: '',
    idScanBase64: '',
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/checkin/session/${sessionId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Session expired or not found. Please ask the receptionist to generate a new QR code.');
          } else {
            setError('Failed to load check-in session.');
          }
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        if (data.status === 'submitted') {
          setSuccess(true);
        }
        setLoading(false);
      } catch (err) {
        setError('Network error loading session.');
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, idScanBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/checkin/session/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit check-in details.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Network error submitting check-in.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Oops!</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900">You're All Set!</h2>
          <p className="text-gray-500">Your details have been submitted to the front desk. Please wait while the receptionist completes your check-in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Welcome to Feni Hotel
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Please provide your details below for a seamless self check-in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white/60 backdrop-blur-xl shadow-2xl rounded-3xl p-8 sm:p-12 border border-white/20">
          
          <div className="space-y-6">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
              <UserIcon className="h-5 w-5 text-indigo-500" /> Personal Information
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <select name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-white/50">
                  <option value="">Select Title (Optional)</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                  <option value="Chief">Chief</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">First name *</label>
                <input required type="text" name="guestFirstName" value={formData.guestFirstName} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last name *</label>
                <input required type="text" name="guestLastName" value={formData.guestLastName} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email address *</label>
                <input required type="email" name="guestEmail" value={formData.guestEmail} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                <input required type="tel" name="guestPhone" value={formData.guestPhone} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
              <MapPinIcon className="h-5 w-5 text-indigo-500" /> Location & Travel
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Home Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">LGA</label>
                <input type="text" name="lga" value={formData.lga} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">State of Origin</label>
                <input type="text" name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nationality</label>
                <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Arriving From</label>
                <input type="text" name="arrivingFrom" value={formData.arrivingFrom} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Going To</label>
                <input type="text" name="goingTo" value={formData.goingTo} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
              <BriefcaseIcon className="h-5 w-5 text-indigo-500" /> Other Details
            </h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Occupation</label>
                <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose of Visit</label>
                <input type="text" name="purposeOfVisit" value={formData.purposeOfVisit} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Next of Kin Phone</label>
                <input type="tel" name="nextOfKinPhone" value={formData.nextOfKinPhone} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Passport / ID Number</label>
                <input type="text" name="passportNo" value={formData.passportNo} onChange={handleChange} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-xl py-3 px-4 bg-white/50" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
              <CameraIcon className="h-5 w-5 text-indigo-500" /> ID Scan
            </h3>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-indigo-500 transition-colors bg-white/50">
              <div className="space-y-1 text-center">
                {formData.idScanBase64 ? (
                  <div className="text-green-600 font-medium">Image Captured Successfully!</div>
                ) : (
                  <>
                    <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 px-2 py-1">
                        <span>Capture or Upload ID</span>
                        <input id="file-upload" name="file-upload" type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFileChange} />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-medium text-white ${submitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-95`}
            >
              {submitting ? 'Submitting...' : 'Complete Self Check-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
