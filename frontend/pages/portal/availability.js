import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import { Clock, Save } from 'lucide-react';
import Layout from '../../components/Layout';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/ToastContext';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const TIMES = [
    { start: '07:00:00', end: '08:00:00', label: '7-8 AM' },
    { start: '08:00:00', end: '09:00:00', label: '8-9 AM' },
    { start: '09:00:00', end: '10:00:00', label: '9-10 AM' },
    { start: '10:00:00', end: '11:00:00', label: '10-11 AM' },
    { start: '11:00:00', end: '12:00:00', label: '11-12 PM' },
    { start: '12:00:00', end: '13:00:00', label: '12-1 PM' },
    { start: '13:00:00', end: '14:00:00', label: '1-2 PM' },
    { start: '14:00:00', end: '15:00:00', label: '2-3 PM' },
    { start: '15:00:00', end: '16:00:00', label: '3-4 PM' },
    { start: '16:00:00', end: '17:00:00', label: '4-5 PM' },
];

export default function Availability() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selected, setSelected] = useState({}); // { "MONDAY_07:00:00": true, ... }

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || user.role !== 'TEACHER' || !user.teacher_id) {
            router.push('/');
            return;
        }
        fetchAvailability(user.teacher_id);
    }, []);

    const fetchAvailability = async (teacherId) => {
        try {
            const res = await api.get(`/teachers/${teacherId}/availability`);
            const sel = {};
            res.data.forEach(a => {
                sel[`${a.day_of_week}_${a.start_time}`] = true;
            });
            setSelected(sel);
        } catch (err) {
            showToast('Failed to load availability', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSlot = (day, start) => {
        const key = `${day}_${start}`;
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setSaving(true);
        const slots = [];
        Object.entries(selected).forEach(([key, val]) => {
            if (val) {
                const [day, start] = key.split('_');
                const time = TIMES.find(t => t.start === start);
                if (time) slots.push({ day_of_week: day, start_time: time.start, end_time: time.end });
            }
        });
        try {
            await api.post(`/teachers/${user.teacher_id}/availability`, { slots });
            showToast('Availability saved!', 'success');
        } catch (err) {
            showToast('Failed to save availability', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><Spinner /></Layout>;

    return (
        <Layout>
            <div className="p-8">
                <Head><title>My Availability - EduScheduler</title></Head>
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold flex items-center gap-2"><Clock /> My Availability</h1>
                        <button onClick={handleSave} disabled={saving}
                            className={`bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 ${saving ? 'opacity-50' : ''}`}>
                            <Save size={18} /> {saving ? 'Saving...' : 'Save Availability'}
                        </button>
                    </div>
                    <p className="text-gray-600 mb-4">Click on time slots to toggle your availability. Green = Available.</p>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Time</th>
                                    {DAYS.map(day => (
                                        <th key={day} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                            {day.charAt(0) + day.slice(1).toLowerCase()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TIMES.map(time => (
                                    <tr key={time.start} className="border-t border-gray-200">
                                        <td className="px-4 py-2 text-sm text-gray-700 font-medium">{time.label}</td>
                                        {DAYS.map(day => {
                                            const key = `${day}_${time.start}`;
                                            const isSelected = selected[key];
                                            return (
                                                <td key={day} className="px-2 py-1 text-center">
                                                    <button
                                                        onClick={() => toggleSlot(day, time.start)}
                                                        className={`w-full py-3 rounded-lg border-2 transition-all duration-200 ${isSelected
                                                            ? 'bg-green-100 border-green-400 text-green-700 hover:bg-green-200'
                                                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                                                    >
                                                        {isSelected ? '✓' : '—'}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
