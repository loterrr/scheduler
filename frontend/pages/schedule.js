import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import api from '../utils/api';
import { CalendarDays, FileDown, GripVertical, X, BookOpen, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastContext';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday' };
const TIMES = ['07:00:00', '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00'];
const COLORS = [
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-green-100 text-green-800 border-green-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-orange-100 text-orange-800 border-orange-300',
    'bg-pink-100 text-pink-800 border-pink-300',
    'bg-teal-100 text-teal-800 border-teal-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
    'bg-red-100 text-red-800 border-red-300',
];

export default function Schedule() {
    const { showToast } = useToast();
    const [schedules, setSchedules] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTerm, setSelectedTerm] = useState('');
    const [dragSubject, setDragSubject] = useState(null);
    const [dropTarget, setDropTarget] = useState(null); // { day, time }
    const [modal, setModal] = useState(null); // { subject, day, time }
    const [modalForm, setModalForm] = useState({ teacher_id: '', room_id: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [schedRes, subRes, roomRes, termRes] = await Promise.all([
                api.get('/schedules'),
                api.get('/schedules/subjects'),
                api.get('/rooms'),
                api.get('/terms')
            ]);
            setSchedules(schedRes.data);
            setSubjects(subRes.data);
            setRooms(roomRes.data);
            setTerms(termRes.data);
            const active = termRes.data.find(t => parseInt(t.is_active));
            if (active) setSelectedTerm(active.id);
        } catch (err) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Drag Handlers ---
    const handleDragStart = (e, subject) => {
        setDragSubject(subject);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', subject.id);
    };

    const handleDragOver = (e, day, time) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget({ day, time });
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = (e, day, time) => {
        e.preventDefault();
        setDropTarget(null);
        if (!dragSubject) return;

        // Open modal to pick teacher + room
        setModal({ subject: dragSubject, day, time });
        const defaultTeacher = dragSubject.teachers?.[0]?.id || '';
        setModalForm({ teacher_id: defaultTeacher, room_id: rooms[0]?.id || '' });
        setDragSubject(null);
    };

    // --- Save schedule entry ---
    const handleSaveEntry = async () => {
        if (!modal || !modalForm.teacher_id || !modalForm.room_id) {
            showToast('Please select a teacher and room', 'error');
            return;
        }
        setSaving(true);
        const endTime = getEndTime(modal.time);
        try {
            const res = await api.post('/schedules', {
                term_id: selectedTerm || 1,
                subject_id: modal.subject.id,
                teacher_id: modalForm.teacher_id,
                room_id: modalForm.room_id,
                day_of_week: modal.day,
                start_time: modal.time,
                end_time: endTime
            });
            if (res.data.error) {
                showToast(res.data.message, 'error');
            } else {
                setSchedules(prev => [...prev, res.data]);
                showToast('Class scheduled!', 'success');
                setModal(null);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to schedule — conflict detected', 'error');
        } finally {
            setSaving(false);
        }
    };

    // --- Delete schedule entry ---
    const handleDelete = async (id) => {
        if (!confirm('Remove this class from the schedule?')) return;
        try {
            await api.delete(`/schedules/${id}`);
            setSchedules(prev => prev.filter(s => s.id !== id && s.id !== String(id)));
            showToast('Class removed', 'success');
        } catch (err) {
            showToast('Failed to remove', 'error');
        }
    };

    // --- PDF Export ---
    const handleExportPDF = async () => {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        const doc = new jsPDF('landscape');
        doc.setFontSize(18);
        doc.text('Class Schedule', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.autoTable({
            startY: 35,
            head: [['Subject', 'Teacher', 'Room', 'Day', 'Start', 'End']],
            body: schedules.map(s => [
                s.subject_name || s.subject_id,
                s.teacher_name || s.teacher_id,
                s.room_name || s.room_id,
                s.day_of_week,
                formatTime(s.start_time),
                formatTime(s.end_time)
            ]),
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] }
        });
        doc.save('schedule.pdf');
        showToast('PDF exported!', 'success');
    };

    // --- Helpers ---
    const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
    };

    const getEndTime = (startTime) => {
        const [h, m, s] = startTime.split(':').map(Number);
        return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const getColor = (id) => COLORS[(id || 0) % COLORS.length];
    const getScheduleAt = (day, time) => schedules.filter(s => s.day_of_week === day && s.start_time === time);
    const isDropHere = (day, time) => dropTarget?.day === day && dropTarget?.time === time;

    if (loading) return <Layout><Spinner /></Layout>;

    return (
        <Layout>
            <div className="p-6">
                <Head><title>Schedule Builder - EduScheduler</title></Head>

                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays /> Schedule Builder</h1>
                    <div className="flex gap-2 items-center">
                        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 text-sm">
                            {terms.map(t => <option key={t.id} value={t.id}>{t.name} {parseInt(t.is_active) ? '(Active)' : ''}</option>)}
                        </select>
                        <button onClick={handleExportPDF} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center gap-2 text-sm">
                            <FileDown size={16} /> Export PDF
                        </button>
                    </div>
                </div>

                <div className="flex gap-4" style={{ height: 'calc(100vh - 140px)' }}>
                    {/* Left Panel — Draggable Subjects */}
                    <div className="w-64 flex-shrink-0 bg-white rounded-lg shadow-md overflow-y-auto">
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><BookOpen size={16} /> Subjects</h2>
                            <p className="text-xs text-gray-500 mt-1">Drag onto the calendar</p>
                        </div>
                        <div className="p-2 space-y-2">
                            {subjects.map(sub => (
                                <div
                                    key={sub.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, sub)}
                                    className={`p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${getColor(sub.id)}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <GripVertical size={14} className="opacity-40 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="font-bold text-xs truncate">{sub.code}</div>
                                            <div className="text-xs truncate">{sub.name}</div>
                                            <div className="text-xs opacity-60 mt-0.5">
                                                {sub.teachers?.length > 0
                                                    ? sub.teachers.map(t => t.name.split(' ')[0]).join(', ')
                                                    : 'No teachers'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {subjects.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-4">No subjects found</p>
                            )}
                        </div>
                    </div>

                    {/* Right Panel — Timetable Grid */}
                    <div className="flex-1 bg-white rounded-lg shadow-md overflow-auto">
                        <table className="min-w-full">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20 bg-gray-50">Time</th>
                                    {DAYS.map(d => (
                                        <th key={d} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-gray-50">
                                            {DAY_LABELS[d]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TIMES.map(time => (
                                    <tr key={time} className="border-t border-gray-100">
                                        <td className="px-3 py-1 text-xs text-gray-600 font-medium whitespace-nowrap align-top pt-3">
                                            {formatTime(time)}
                                        </td>
                                        {DAYS.map(day => {
                                            const entries = getScheduleAt(day, time);
                                            const isDrop = isDropHere(day, time);
                                            return (
                                                <td
                                                    key={day}
                                                    className={`px-1 py-1 min-w-[150px] align-top transition-colors ${isDrop ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-300' : ''}`}
                                                    onDragOver={(e) => handleDragOver(e, day, time)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, day, time)}
                                                >
                                                    {entries.length > 0 ? entries.map((s) => (
                                                        <div key={s.id} className={`group p-2 rounded-lg border text-xs relative ${getColor(s.subject_id)}`}>
                                                            <button
                                                                onClick={() => handleDelete(s.id)}
                                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 shadow hover:bg-red-100"
                                                                title="Remove"
                                                            >
                                                                <Trash2 size={12} className="text-red-500" />
                                                            </button>
                                                            <div className="font-bold">{s.subject_code || s.subject_name}</div>
                                                            <div>{s.teacher_name}</div>
                                                            <div className="opacity-60">{s.room_name}</div>
                                                        </div>
                                                    )) : (
                                                        <div className={`h-14 rounded-lg border-2 border-dashed flex items-center justify-center text-xs transition-colors ${isDrop ? 'border-indigo-400 text-indigo-400' : 'border-gray-200 text-gray-300'}`}>
                                                            {isDrop ? 'Drop here' : ''}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Assignment Modal */}
                {modal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Assign Class</h3>
                                <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>

                            <div className="mb-4 p-3 rounded-lg bg-gray-50">
                                <p className="text-sm font-semibold">{modal.subject.code} — {modal.subject.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {DAY_LABELS[modal.day]} • {formatTime(modal.time)} – {formatTime(getEndTime(modal.time))}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                                    <select
                                        value={modalForm.teacher_id}
                                        onChange={e => setModalForm({ ...modalForm, teacher_id: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                    >
                                        <option value="">Select teacher...</option>
                                        {modal.subject.teachers?.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    {modal.subject.teachers?.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">No teachers assigned to this subject</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                                    <select
                                        value={modalForm.room_id}
                                        onChange={e => setModalForm({ ...modalForm, room_id: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                    >
                                        <option value="">Select room...</option>
                                        {rooms.map(r => (
                                            <option key={r.id} value={r.id}>{r.name} ({r.type}, {r.capacity} seats)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setModal(null)}
                                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEntry}
                                    disabled={saving || !modalForm.teacher_id || !modalForm.room_id}
                                    className={`flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 ${saving || !modalForm.teacher_id || !modalForm.room_id ? 'opacity-50' : ''}`}
                                >
                                    {saving ? 'Saving...' : 'Schedule Class'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
