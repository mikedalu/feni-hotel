'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useCheckinPolling } from '@/hooks/useCheckinPolling';
import { QrCodeIcon, CheckCircleIcon, ArrowPathIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/apiClient';
import { RoomResponse } from '@/types/room';

interface RecoverableSession {
  sessionId: string;
  submittedAt: string;
  data: {
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    [key: string]: unknown;
  };
}


// We would usually get this from context or local storage

export default function ReceptionCheckinPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Receptionist Inputs
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Standard');
  const [paymentMethod, setPaymentMethod] = useState('POS');
  const [checkOutDate, setCheckOutDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [totalCost, setTotalCost] = useState('0');
  const [systemCalculatedCost, setSystemCalculatedCost] = useState<number>(0);
  const [smartPosTerminalId, setSmartPosTerminalId] = useState('');

  const { data: terminals = [] } = useQuery({
    queryKey: ['smartPosTerminals'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/admin/smart-pos');
      if (!res.ok) return [];
      return res.json();
    }
  });
  const activeTerminals = terminals.filter((t: { id: string; name: string; isActive: boolean }) => t.isActive);

  const { data: rooms = [] } = useQuery<RoomResponse[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await apiClient('/api/proxy/rooms');
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      return data.filter((room: RoomResponse) => room.active);
    }
  });

  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE');
  const availableRoomTypes = Array.from(new Set(availableRooms.map(r => r.roomType)));

  const handleRoomTypeChange = (type: string) => {
    setRoomType(type);
    setRoomNumber('');
    setTotalCost('0');
    setSystemCalculatedCost(0);
  };

  const calculateCost = (roomNum: string, outDateStr: string) => {
    const room = rooms.find(r => r.roomNumber === roomNum);
    if (room && room.currentPrice) {
      const inDate = new Date();
      const outDate = new Date(outDateStr);
      const diffTime = Math.abs(outDate.getTime() - inDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const nights = diffDays > 0 ? diffDays : 1;
      const autoCost = room.currentPrice * nights;
      setSystemCalculatedCost(autoCost);
      setTotalCost(autoCost.toString());
    }
  };

  const handleRoomNumberChange = (num: string) => {
    setRoomNumber(num);
    calculateCost(num, checkOutDate);
  };

  const handleCheckOutDateChange = (date: string) => {
    setCheckOutDate(date);
    if (roomNumber) {
      calculateCost(roomNumber, date);
    }
  };

  const [recoverableSessions, setRecoverableSessions] = useState<RecoverableSession[]>([]);
  const [recovering, setRecovering] = useState(false);
  const [mockSessionData, setMockSessionData] = useState<RecoverableSession['data'] | null>(null);

  // If we recovered a session, we bypass polling and just use the mockSessionData
  const pollingData = useCheckinPolling(mockSessionData ? null : sessionId);
  const sessionData = mockSessionData || pollingData.data;
  // const pollError = mockSessionData ? null : pollingData.error;

  const startSession = async () => {
    setLoading(true);
    setLoading(true);
    setError(null);
    setMockSessionData(null);
    setRecoverableSessions([]);
    try {
      const res = await apiClient('/api/proxy/checkin/self-checkin/start', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to start session on local backend');
      const data = await res.json();
      setSessionId(data.sessionId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmSession = async () => {
    if (!sessionData) return;
    setConfirming(true);
    setError(null);

    // Transform sessionData back to what the backend expects (BookingRequest + idScanBase64)
    const confirmPayload = {
      bookingRequest: {
        guestFirstName: sessionData.guestFirstName,
        guestLastName: sessionData.guestLastName,
        guestEmail: sessionData.guestEmail,
        guestPhone: sessionData.guestPhone,
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: checkOutDate,
        roomNumber: roomNumber,
        roomType: roomType,
        paymentMethod: paymentMethod,
        smartPosTerminalId: (paymentMethod === 'POS' || paymentMethod === 'TRANSFER') && smartPosTerminalId ? smartPosTerminalId : null,
        totalCost: Number(totalCost),
        title: sessionData.title,
        occupation: sessionData.occupation,
        nextOfKinPhone: sessionData.nextOfKinPhone,
        address: sessionData.address,
        lga: sessionData.lga,
        nationality: sessionData.nationality,
        stateOfOrigin: sessionData.stateOfOrigin,
        passportNo: sessionData.passportNo,
        purposeOfVisit: sessionData.purposeOfVisit,
        arrivingFrom: sessionData.arrivingFrom,
        goingTo: sessionData.goingTo,
      },
      idScanBase64: sessionData.idScanBase64 || '',
    };

    try {
      const res = await apiClient(`/api/proxy/checkin/confirm/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(confirmPayload),
      });

      if (!res.ok) throw new Error('Failed to confirm check-in on backend');
      setConfirmed(true);
      setSessionId(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setConfirming(false);
    }
  };

  const fetchRecoverableSessions = async () => {
    setRecovering(true);
    setError(null);
    try {
      const res = await apiClient('/api/proxy/checkin/recover');
      if (!res.ok) throw new Error('Failed to fetch recoverable sessions');
      const data = await res.json();
      setRecoverableSessions(data);
      if (data.length === 0) {
        setError('No stranded sessions found.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setRecovering(false);
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_CLOUD_URL || 'https://feni-hotel-test.vercel.app';
  const checkinUrl = sessionId ? `${baseUrl}/checkin/${sessionId}` : '';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="bg-white rounded-2xl shadow p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Self Check-in Dashboard</h1>
            <p className="text-gray-500 text-sm">Generate QR codes for guests and monitor submissions in real-time.</p>
          </div>
          {!sessionId && !confirmed && (
            <div className="flex gap-4">
              <button
                onClick={fetchRecoverableSessions}
                disabled={recovering}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                {recovering ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CloudArrowDownIcon className="h-5 w-5" />}
                Recover Sessions
              </button>
              <button
                onClick={startSession}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow transition-colors flex items-center gap-2"
              >
                {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <QrCodeIcon className="h-5 w-5" />}
                Start New Session
              </button>
            </div>
          )}
          {sessionId && (
            <button
              onClick={() => { setSessionId(null); setConfirmed(false); setMockSessionData(null); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel Session
            </button>
          )}
          {confirmed && (
            <button
              onClick={() => setConfirmed(false)}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Start Another Session
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            {error}
          </div>
        )}

        {!sessionId && !confirmed && recoverableSessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recoverable Sessions</h2>
              <span className="text-sm text-gray-500">{recoverableSessions.length} stranded session(s) found</span>
            </div>
            <ul className="divide-y divide-gray-200">
              {recoverableSessions.map((session, idx) => (
                <li key={session.sessionId || idx} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">
                      {session.data.guestFirstName} {session.data.guestLastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.data.guestEmail} • Submitted at {new Date(session.submittedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSessionId(session.sessionId);
                      setMockSessionData(session.data);
                      setRecoverableSessions([]);
                    }}
                    className="text-indigo-600 font-semibold hover:text-indigo-900 px-4 py-2 bg-indigo-50 rounded-lg"
                  >
                    Recover
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {confirmed && (
          <div className="bg-green-50 border border-green-200 p-12 rounded-2xl text-center space-y-4">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-800">Check-in Confirmed!</h2>
            <p className="text-green-600">The guest&apos;s details have been saved, journal entry posted, and the ID is uploading to the cloud.</p>
          </div>
        )}

        {sessionId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Col: QR Code */}
            <div className="bg-white rounded-2xl shadow p-8 text-center space-y-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Guest QR Code</h2>
              <p className="text-sm text-gray-500">Ask the guest to scan this code with their smartphone camera to fill out their details securely.</p>
              
              <div className="p-4 bg-white border rounded-xl shadow-sm inline-block">
                <QRCodeSVG value={checkinUrl} size={250} level="H" />
              </div>
              
              <a href={checkinUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline break-all">
                {checkinUrl}
              </a>
            </div>

            {/* Right Col: Live Polling Data */}
            <div className="bg-white rounded-2xl shadow flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  Live Status 
                  {sessionData?.status !== 'submitted' && <ArrowPathIcon className="h-5 w-5 text-indigo-500 animate-spin" />}
                </h2>
                {sessionData?.status === 'waiting' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold uppercase rounded-full tracking-wide">
                    Waiting for Guest
                  </span>
                )}
                {sessionData?.status === 'submitted' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase rounded-full tracking-wide">
                    Submitted
                  </span>
                )}
              </div>

              <div className="p-6 flex-1 bg-gray-50 rounded-b-2xl">
                {sessionData?.status === 'waiting' ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <QrCodeIcon className="h-16 w-16 opacity-20" />
                    <p>Waiting for guest to scan and submit...</p>
                  </div>
                ) : sessionData?.status === 'submitted' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold">First Name</div>
                        <div className="text-gray-900 font-medium">{sessionData.guestFirstName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold">Last Name</div>
                        <div className="text-gray-900 font-medium">{sessionData.guestLastName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold">Phone</div>
                        <div className="text-gray-900 font-medium">{sessionData.guestPhone}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold">Email</div>
                        <div className="text-gray-900 font-medium truncate" title={sessionData.guestEmail}>{sessionData.guestEmail}</div>
                      </div>
                    </div>

                    {sessionData.idScanBase64 && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold mb-2">ID Scan Attached</div>
                        <div className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircleIcon className="h-4 w-4" /> Valid Image Received
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-gray-200 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Room & Payment Assignment</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Room Type</label>
                          <select value={roomType} onChange={e => handleRoomTypeChange(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border">
                            <option value="">Select a type...</option>
                            {availableRoomTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Room Number</label>
                          <select 
                            required 
                            value={roomNumber} 
                            onChange={e => handleRoomNumberChange(e.target.value)} 
                            disabled={!roomType}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100"
                          >
                            <option value="">Select a room...</option>
                            {availableRooms
                              .filter(r => r.roomType === roomType)
                              .map(room => (
                                <option key={room.id} value={room.roomNumber}>
                                  {room.roomNumber} (₦{room.currentPrice?.toLocaleString()})
                                </option>
                              ))
                            }
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
                          <input type="date" required value={checkOutDate} min={new Date().toISOString().split('T')[0]} onChange={e => handleCheckOutDateChange(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border">
                            <option value="POS">Card (POS)</option>
                            <option value="CASH">Cash</option>
                            <option value="TRANSFER">Transfer</option>
                          </select>
                        </div>
                        {(paymentMethod === 'POS' || paymentMethod === 'TRANSFER') && activeTerminals.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Smart POS Terminal</label>
                            <select 
                              value={smartPosTerminalId} 
                              onChange={e => setSmartPosTerminalId(e.target.value)} 
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                            >
                              <option value="">-- Select Terminal (Optional) --</option>
                              {activeTerminals.map((term: { id: string; name: string; isActive: boolean }) => (
                                <option key={term.id} value={term.id}>{term.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 flex justify-between">
                            <span>Total Cost (₦)</span>
                            {systemCalculatedCost > 0 && (
                              <span className="text-gray-500 text-xs">Calculated: ₦{systemCalculatedCost.toLocaleString()}</span>
                            )}
                          </label>
                          <input type="number" required value={totalCost} onChange={e => setTotalCost(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border" />
                          <p className="text-xs text-gray-500 mt-1">You can override this value manually to apply discounts or promos.</p>
                        </div>
                      </div>

                      <button
                        onClick={confirmSession}
                        disabled={confirming || !roomNumber}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium shadow-lg transition-colors flex justify-center items-center gap-2 disabled:bg-gray-400"
                      >
                        {confirming ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />}
                        Confirm Check-in
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Initializing...
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
