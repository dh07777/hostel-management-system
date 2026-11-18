import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { DoorOpen, Wind, Bath, BedDouble, Users, CheckCircle2, Shield } from 'lucide-react';

const StudentRoomView = () => {
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentRoom();
  }, []);

  const fetchStudentRoom = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students/');
      const s = res.data.students?.[0];
      setStudent(s);

      if (s?.current_room_id) {
        const roomRes = await api.get(`/rooms/${s.current_room_id}`);
        setRoom(roomRes.data);
      }
    } catch (err) {
      toast.error('Failed to load room details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-semibold text-slate-500">Loading accommodation details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Room & Roommates
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Assigned hostel residential quarters, bed allocation & shared amenities
        </p>
      </div>

      {!student?.current_room_id ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <DoorOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Room Allocated Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your admission is active, but you have not yet been assigned a specific room and bed. Please contact the Hostel Warden desk.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room Specs & Facilities (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary-600 dark:text-primary-400 tracking-wider">
                    Official Residential Quarter
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    Room {room?.room_number} &bull; {student?.current_bed_number}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Monthly Boarding Fee</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(room?.base_price_per_month)}</div>
                </div>
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850">
                  <span className="text-slate-400 font-medium">Building</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{room?.building_name}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850">
                  <span className="text-slate-400 font-medium">Floor</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{room?.floor_name}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850">
                  <span className="text-slate-400 font-medium">Configuration</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5 capitalize">{room?.room_type?.replace('_', ' ')}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850">
                  <span className="text-slate-400 font-medium">Occupancy</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{room?.occupied_beds} of {room?.capacity} Beds</div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-3">
                  Room Features & Inclusions
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {room?.is_ac && (
                    <span className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
                      <Wind className="w-4 h-4" /> Air Conditioned
                    </span>
                  )}
                  {room?.has_attached_bathroom && (
                    <span className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
                      <Bath className="w-4 h-4" /> Attached En-Suite Bathroom
                    </span>
                  )}
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    High-Speed Wi-Fi
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    Individual Study Desk & Lamp
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    Personal Lockable Wardrobe
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Roommates Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600" />
              Bed Roster & Roommates
            </h3>

            <div className="space-y-3">
              {room?.beds?.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                    b.bed_number === student?.current_bed_number
                      ? 'bg-primary-50/70 border-primary-300 dark:bg-primary-950/60 dark:border-primary-800'
                      : 'bg-slate-50 dark:bg-slate-850 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold">
                      <BedDouble className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{b.bed_number}</span>
                        {b.bed_number === student?.current_bed_number && (
                          <span className="text-[10px] font-black uppercase text-primary-600 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/60">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {b.is_occupied ? b.student_name : 'Vacant Bed'}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${b.is_occupied ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                    {b.is_occupied ? 'Occupied' : 'Free'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRoomView;
