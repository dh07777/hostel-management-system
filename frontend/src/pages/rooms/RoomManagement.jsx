import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, getStatusBadgeClass } from '../../utils/formatters';
import Modal from '../../components/common/Modal';
import {
  DoorOpen,
  Building2,
  Users,
  Plus,
  ArrowRightLeft,
  LogOut,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Wind,
  Bath,
  Layers
} from 'lucide-react';

const RoomManagement = () => {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Unallocated students list for allocation modal
  const [unallocatedStudents, setUnallocatedStudents] = useState([]);

  // Allocation Modal state
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateData, setAllocateData] = useState({
    student_id: '',
    room_id: '',
    bed_id: '',
    room_number: '',
    bed_number: '',
    remarks: 'Hostel allocation',
  });
  const [allocating, setAllocating] = useState(false);

  // Transfer Modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    student_id: '',
    student_name: '',
    old_room_number: '',
    new_room_id: '',
    new_bed_id: '',
    reason: 'Room transfer request',
  });
  const [transferring, setTransferring] = useState(false);

  // Create Room Modal state
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    building_id: '',
    floor_id: '',
    room_number: '',
    room_type: 'double',
    capacity: 2,
    base_price_per_month: 320,
    is_ac: false,
    has_attached_bathroom: true,
    facilities: 'Wi-Fi, Study Desk, Wardrobe, Balcony',
  });
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    fetchInitialMeta();
    fetchRooms();
  }, [selectedBuilding, selectedFloor, selectedType, selectedStatus]);

  const fetchInitialMeta = async () => {
    try {
      const [bRes, fRes, sRes] = await Promise.all([
        api.get('/rooms/buildings'),
        api.get('/rooms/floors'),
        api.get('/students/?status=active&per_page=100'),
      ]);
      setBuildings(bRes.data || []);
      setFloors(fRes.data || []);
      // Filter unallocated students
      const unalloc = (sRes.data.students || []).filter((s) => !s.current_room_id);
      setUnallocatedStudents(unalloc);
    } catch (err) {}
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBuilding) params.append('building_id', selectedBuilding);
      if (selectedFloor) params.append('floor_id', selectedFloor);
      if (selectedType) params.append('room_type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await api.get(`/rooms/?${params.toString()}`);
      setRooms(res.data || []);
    } catch (err) {
      toast.error('Failed to load room allocation grid');
    } finally {
      setLoading(false);
    }
  };

  const openAllocateModal = (room, bed) => {
    setAllocateData({
      student_id: unallocatedStudents[0]?.id || '',
      room_id: room.id,
      bed_id: bed.id,
      room_number: room.room_number,
      bed_number: bed.bed_number,
      remarks: 'Allocated by Warden',
    });
    setShowAllocateModal(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocateData.student_id) {
      toast.error('Please select a student');
      return;
    }
    setAllocating(true);
    try {
      await api.post('/rooms/allocate', {
        student_id: allocateData.student_id,
        room_id: allocateData.room_id,
        bed_id: allocateData.bed_id,
        remarks: allocateData.remarks,
      });
      toast.success(`Successfully allocated ${allocateData.bed_number} in Room ${allocateData.room_number}`);
      setShowAllocateModal(false);
      fetchRooms();
      fetchInitialMeta();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Allocation failed');
    } finally {
      setAllocating(false);
    }
  };

  const handleVacate = async (studentId, studentName, roomNumber) => {
    if (!window.confirm(`Vacate ${studentName} from Room ${roomNumber}? This will mark the bed available.`)) return;
    try {
      await api.post('/rooms/vacate', { student_id: studentId, remarks: 'Vacated via Room Control' });
      toast.success(`Student vacated from Room ${roomNumber}`);
      fetchRooms();
      fetchInitialMeta();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to vacate room');
    }
  };

  const openTransferModal = (bed, room) => {
    setTransferData({
      student_id: bed.student_id,
      student_name: bed.student_name,
      old_room_number: room.room_number,
      new_room_id: '',
      new_bed_id: '',
      reason: 'Room change request',
    });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferData.new_room_id || !transferData.new_bed_id) {
      toast.error('Please select destination room and bed');
      return;
    }
    setTransferring(true);
    try {
      await api.post('/rooms/transfer', {
        student_id: transferData.student_id,
        new_room_id: transferData.new_room_id,
        new_bed_id: transferData.new_bed_id,
        reason: transferData.reason,
      });
      toast.success('Student transferred successfully');
      setShowTransferModal(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreatingRoom(true);
    try {
      await api.post('/rooms/', newRoomData);
      toast.success(`Room ${newRoomData.room_number} created successfully`);
      setShowCreateRoomModal(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create room');
    } finally {
      setCreatingRoom(false);
    }
  };

  // Find all beds currently free across all rooms for transfer target dropdown
  const availableTargetBeds = [];
  rooms.forEach((r) => {
    (r.beds || []).forEach((b) => {
      if (!b.is_occupied) {
        availableTargetBeds.push({
          room_id: r.id,
          room_number: r.room_number,
          bed_id: b.id,
          bed_number: b.bed_number,
          building: r.building_name,
        });
      }
    });
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Visual Room Allocation Grid
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time interactive bed occupancy, duplicate prevention & room transfers
          </p>
        </div>

        <button
          onClick={() => {
            if (buildings.length > 0 && floors.length > 0) {
              setNewRoomData((prev) => ({
                ...prev,
                building_id: buildings[0].id,
                floor_id: floors[0].id,
              }));
            }
            setShowCreateRoomModal(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/25 transition text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Legend & Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>Full (100%)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            <span>Maintenance</span>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
          >
            <option value="">All Buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
          >
            <option value="">All Types</option>
            <option value="single">Single Room</option>
            <option value="double">Double Sharing</option>
            <option value="triple">Triple Sharing</option>
            <option value="four_sharing">Four Sharing</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="available">Has Free Beds</option>
            <option value="full">Completely Full</option>
          </select>
        </div>
      </div>

      {/* Visual Interactive Room Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading interactive room allocation grid...</div>
      ) : rooms.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">No rooms match the selected criteria.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rooms.map((room) => {
            const isFull = room.status === 'full';
            const isPartial = room.occupied_beds > 0 && !isFull;
            const borderAccent = isFull
              ? 'border-rose-300 dark:border-rose-900/60'
              : isPartial
              ? 'border-amber-300 dark:border-amber-900/60'
              : 'border-emerald-300 dark:border-emerald-900/60';

            return (
              <div
                key={room.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 ${borderAccent} shadow-sm hover:shadow-md transition flex flex-col justify-between`}
              >
                {/* Room top info */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          Room {room.room_number}
                        </span>
                        {room.is_ac && (
                          <span className="p-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300" title="Air Conditioned">
                            <Wind className="w-3 h-3" />
                          </span>
                        )}
                        {room.has_attached_bathroom && (
                          <span className="p-1 rounded bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-300" title="Attached Bathroom">
                            <Bath className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {room.building_name} &bull; {room.floor_name}
                      </div>
                    </div>

                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(room.status)}`}>
                      {room.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="capitalize">{room.room_type.replace('_', ' ')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(room.base_price_per_month)}/mo</span>
                  </div>

                  {/* Beds Visualization Box */}
                  <div className="mt-4 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Beds ({room.occupied_beds}/{room.capacity})
                    </div>
                    {room.beds?.map((bed) => (
                      <div
                        key={bed.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                          bed.is_occupied
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4 shrink-0" />
                          <div>
                            <span className="font-bold">{bed.bed_number}</span>
                            {bed.is_occupied ? (
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                                {bed.student_name}
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Available</div>
                            )}
                          </div>
                        </div>

                        {/* Bed Action buttons */}
                        <div className="flex items-center gap-1">
                          {bed.is_occupied ? (
                            <>
                              <button
                                onClick={() => openTransferModal(bed, room)}
                                className="p-1 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-600 border border-slate-200 dark:border-slate-700 shadow-xs"
                                title="Transfer Student to Another Room"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleVacate(bed.student_id, bed.student_name, room.room_number)}
                                className="p-1 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 border border-slate-200 dark:border-slate-700 shadow-xs"
                                title="Vacate Bed"
                              >
                                <LogOut className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openAllocateModal(room, bed)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition"
                            >
                              Allocate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Allocate Room Modal */}
      <Modal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        title={`Allocate Room ${allocateData.room_number} (${allocateData.bed_number})`}
      >
        <form onSubmit={handleAllocateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Resident Student *
            </label>
            {unallocatedStudents.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl">
                No unallocated students available. Please register or admit a new student first.
              </div>
            ) : (
              <select
                value={allocateData.student_id}
                onChange={(e) => setAllocateData({ ...allocateData, student_id: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {unallocatedStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_id_code}) &bull; {s.course}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={allocateData.remarks}
              onChange={(e) => setAllocateData({ ...allocateData, remarks: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAllocateModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={allocating || unallocatedStudents.length === 0}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {allocating ? 'Assigning...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Room Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title={`Transfer Student: ${transferData.student_name}`}
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
            Current Location: <b>Room {transferData.old_room_number}</b>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Destination Bed *
            </label>
            <select
              value={`${transferData.new_room_id}:${transferData.new_bed_id}`}
              onChange={(e) => {
                const [rId, bId] = e.target.value.split(':');
                setTransferData({ ...transferData, new_room_id: rId, new_bed_id: bId });
              }}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">Select available room & bed...</option>
              {availableTargetBeds.map((t) => (
                <option key={`${t.room_id}:${t.bed_id}`} value={`${t.room_id}:${t.bed_id}`}>
                  Room {t.room_number} ({t.bed_number}) &bull; {t.building}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Transfer Reason
            </label>
            <input
              type="text"
              value={transferData.reason}
              onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferring}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {transferring ? 'Transferring...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        title="Add New Room & Bed Configuration"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building</label>
              <select
                value={newRoomData.building_id}
                onChange={(e) => setNewRoomData({ ...newRoomData, building_id: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor</label>
              <select
                value={newRoomData.floor_id}
                onChange={(e) => setNewRoomData({ ...newRoomData, floor_id: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>{f.floor_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Number *</label>
              <input
                type="text"
                placeholder="e.g. E105"
                required
                value={newRoomData.room_number}
                onChange={(e) => setNewRoomData({ ...newRoomData, room_number: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Type</label>
              <select
                value={newRoomData.room_type}
                onChange={(e) => setNewRoomData({ ...newRoomData, room_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="single">Single (1 Bed)</option>
                <option value="double">Double (2 Beds)</option>
                <option value="triple">Triple (3 Beds)</option>
                <option value="four_sharing">Four Sharing (4 Beds)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Rent ($)</label>
              <input
                type="number"
                value={newRoomData.base_price_per_month}
                onChange={(e) => setNewRoomData({ ...newRoomData, base_price_per_month: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRoomData.is_ac}
                  onChange={(e) => setNewRoomData({ ...newRoomData, is_ac: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="font-bold">Air Conditioned</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRoomData.has_attached_bathroom}
                  onChange={(e) => setNewRoomData({ ...newRoomData, has_attached_bathroom: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="font-bold">Attached Bath</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateRoomModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingRoom}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {creatingRoom ? 'Creating...' : 'Create Room & Beds'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomManagement;
