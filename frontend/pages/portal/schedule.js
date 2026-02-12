import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import { CalendarDays, FileDown } from 'lucide-react';
import Layout from '../../components/Layout';
import Spinner from '../../components/Spinner';
import { useToast } from '../../components/ToastContext';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const TIMES = ['07:00:00', '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00'];
const COLORS = ['bg-blue-100 text-blue-800 border-blue-300', 'bg-green-100 text-green-800 border-green-300', 'bg-purple-100 text-purple-800 border-purple-300', 'bg-orange-100 text-orange-800 border-orange-300'];

export default function MySchedule() {
    const router = useRouter();
    const { showToast } = useToast();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teacherName, setTeacherName] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || user.role !== 'TEACHER') {
            router.push('/');
            return;
        }
        setTeacherName(user.name || user.username);
        fetchMySchedule();
    }, []);

    const fetchMySchedule = async () => {
        try {
            const res = await api.get('/portal/schedule');
            setSchedules(res.data);
        } catch (err) {
            if (err.response?.status === 401) {
                router.push('/');
                return;
            }
            showToast('Failed to load schedule', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    const getColor = (subjectId) => COLORS[(subjectId || 0) % COLORS.length];

    const getScheduleAt = (day, time) => schedules.filter(s => s.day_of_week === day && s.start_time === time);

    const handleExportPDF = async () => {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        const doc = new jsPDF('landscape');
        doc.setFontSize(18);
        doc.text(`Schedule — ${teacherName}`, 14, 22);
        doc.autoTable({
            startY: 30,
            head: [['Subject', 'Room', 'Day', 'Start', 'End', 'Section']],
            body: schedules.map(s => [s.subject_name || s.subject_id, s.room_name || s.room_id, s.day_of_week, formatTime(s.start_time), formatTime(s.end_time), s.section || '—']),
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] }
        });
        doc.save('my-schedule.pdf');
        showToast('PDF exported!', 'success');
    };

    if (loading) return <Layout><Spinner /></Layout>;

    return (
        <Layout>
            <div className="p-8">
                <Head><title>My Schedule - EduScheduler</title></Head>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold flex items-center gap-2"><CalendarDays /> My Schedule</h1>
                        <button onClick={handleExportPDF} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center gap-2">
                            <FileDown size={18} /> Export PDF
                        </button>
                    </div>
                    <p className="text-gray-600 mb-4">Teacher: <strong>{teacherName}</strong></p>

                    <div className="bg-white rounded-lg shadow-md overflow-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Time</th>
                                    {DAYS.map(d => (
                                        <th key={d} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                            {d.charAt(0) + d.slice(1).toLowerCase()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TIMES.map(time => (
                                    <tr key={time} className="border-t border-gray-200">
                                        <td className="px-4 py-2 text-xs text-gray-700 font-medium whitespace-nowrap">{formatTime(time)}</td>
                                        {DAYS.map(day => {
                                            const entries = getScheduleAt(day, time);
                                            return (
                                                <td key={day} className="px-2 py-1 min-w-[140px]">
                                                    {entries.map((s, i) => (
                                                        <div key={i} className={`p-2 rounded-lg mb-1 border text-xs ${getColor(s.subject_id)}`}>
                                                            <div className="font-bold">{s.subject_name || `Sub#${s.subject_id}`}</div>
                                                            <div className="opacity-70">{s.room_name || `R#${s.room_id}`}</div>
                                                        </div>
                                                    ))}
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
