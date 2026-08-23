'use client';

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, CheckCircleIcon, UserIcon, MapPinIcon, BriefcaseIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

const steps = [
  { id: 'personal', name: 'Personal Info', icon: UserIcon },
  { id: 'location', name: 'Travel Details', icon: MapPinIcon },
  { id: 'other', name: 'Additional Info', icon: BriefcaseIcon },
  { id: 'idScan', name: 'ID Scan', icon: CameraIcon },
];

export default function GuestCheckinPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);

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
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height *= MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width *= MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG
            setFormData((prev) => ({ ...prev, idScanBase64: compressedBase64 }));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== steps.length - 1) {
      nextStep();
      return;
    }

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Oops!</h2>
          <p className="text-gray-500">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <CheckCircleIcon className="mx-auto h-20 w-20 text-green-500" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">You're All Set!</h2>
          <p className="text-gray-500 text-lg">Your details have been submitted to the front desk. Please wait while the receptionist completes your check-in.</p>
        </motion.div>
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-indigo-950 tracking-tight">
            Self Check-in
          </h1>
          <p className="mt-3 text-lg text-slate-500 max-w-lg mx-auto">
            Please provide your details below for a seamless experience.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10 px-4">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0">
              <motion.div 
                className="h-full bg-indigo-600 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </div>
            
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <motion.div 
                    initial={false}
                    animate={{
                      backgroundColor: isActive || isCompleted ? '#4f46e5' : '#ffffff',
                      borderColor: isActive || isCompleted ? '#4f46e5' : '#cbd5e1',
                      color: isActive || isCompleted ? '#ffffff' : '#94a3b8',
                      scale: isActive ? 1.2 : 1
                    }}
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm"
                  >
                    {isCompleted ? <CheckCircleIcon className="w-6 h-6 text-white" /> : <Icon className="w-5 h-5" />}
                  </motion.div>
                  <span className={`absolute -bottom-6 text-xs font-medium whitespace-nowrap ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-3xl overflow-hidden border border-slate-100 min-h-[400px] flex flex-col mt-12 relative">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 p-8 sm:p-10">
              <AnimatePresence mode="wait" custom={1}>
                {currentStep === 0 && (
                  <motion.div
                    key="step0"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Personal Information</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <select name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors">
                          <option value="">Select Title (Optional)</option>
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Ms">Ms</option>
                          <option value="Dr">Dr</option>
                          <option value="Chief">Chief</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">First name *</label>
                        <input required type="text" name="guestFirstName" value={formData.guestFirstName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Last name *</label>
                        <input required type="text" name="guestLastName" value={formData.guestLastName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email address *</label>
                        <input required type="email" name="guestEmail" value={formData.guestEmail} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                        <input required type="tel" name="guestPhone" value={formData.guestPhone} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Location & Travel</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Home Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">LGA</label>
                        <input type="text" name="lga" value={formData.lga} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State of Origin</label>
                        <input type="text" name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
                        <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Arriving From</label>
                        <input type="text" name="arrivingFrom" value={formData.arrivingFrom} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Going To</label>
                        <input type="text" name="goingTo" value={formData.goingTo} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Additional Information</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Occupation</label>
                        <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Purpose of Visit</label>
                        <input type="text" name="purposeOfVisit" value={formData.purposeOfVisit} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Next of Kin Phone</label>
                        <input type="tel" name="nextOfKinPhone" value={formData.nextOfKinPhone} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Passport / ID Number</label>
                        <input type="text" name="passportNo" value={formData.passportNo} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Verify Identity</h3>
                    <p className="text-slate-500 mb-4">Please upload a clear picture of your government issued ID.</p>
                    <div className="mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-slate-300 border-dashed rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors bg-slate-50/50 group cursor-pointer relative overflow-hidden">
                      <input id="file-upload" name="file-upload" type="file" accept="image/*" capture="environment" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} />
                      <div className="space-y-3 text-center pointer-events-none relative z-0">
                        {formData.idScanBase64 ? (
                          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-2" />
                            <div className="text-green-600 font-semibold text-lg">Image Captured Successfully!</div>
                            <p className="text-sm text-slate-500 mt-1">Tap to capture again</p>
                          </motion.div>
                        ) : (
                          <>
                            <CameraIcon className="mx-auto h-16 w-16 text-indigo-400 group-hover:scale-110 transition-transform" />
                            <div className="flex text-lg text-slate-600 justify-center font-medium">
                              <span className="text-indigo-600">Capture or Upload ID</span>
                            </div>
                            <p className="text-sm text-slate-500">JPG, PNG up to 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="bg-slate-50 px-8 py-5 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0 || submitting}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  currentStep === 0 || submitting
                    ? 'text-slate-400 cursor-not-allowed opacity-50'
                    : 'text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-100'
                }`}
              >
                <ChevronLeftIcon className="w-5 h-5" /> Back
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {currentStep === steps.length - 1 ? (
                  submitting ? 'Submitting...' : 'Complete Check-in'
                ) : (
                  <>Next Step <ChevronRightIcon className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
