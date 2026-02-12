import { useState, useEffect } from 'react';
import Head from 'next/head';
import api from '../utils/api';
import { GraduationCap, Plus, Pencil, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastContext';

export default function Teachers() {
    const { showToast } = useToast();
    const [teachers, setTeachers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTeacher, setNewTeacher] = useState({ name: '', max_load_units: 21, is_full_time: true, department_id: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newDept, setNewDept] = useState('');
    const [showNewDept, setShowNewDept] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [teacherRes, deptRes] = await Promise.all([
                api.get('/teachers'),
                api.get('/departments')
            ]);
            setTeachers(teacherRes.data);
            setDepartments(deptRes.data);
        } catch (err) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDept = async () => {
        if (!newDept.trim()) return;
        try {
            const res = await api.post('/departments', { name: newDept.trim() });
            setDepartments(prev => [...prev, res.data]);
            setNewTeacher({ ...newTeacher, department_id: res.data.id });
            setNewDept('');
            setShowNewDept(false);
            showToast('Department created!', 'success');
        } catch (err) {
            showToast('Failed to create department', 'error');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newTeacher };
            if (!payload.department_id) delete payload.department_id;
            const res = await api.post('/teachers', payload);
            setNewTeacher({ name: '', max_load_units: 21, is_full_time: true, department_id: '' });
            showToast(`Teacher created! Username: ${res.data.user?.username}, Default password: ${res.data.user?.default_password}`, 'success');
            fetchData();
        } catch (err) {
            showToast('Failed to create teacher', 'error');
        }
    };

    const handleUpdate = async (id) => {
        try {
            const payload = { ...editForm };
            if (!payload.department_id) payload.department_id = null;
            await api.put(`/teachers/${id}`, payload);
            setEditingId(null);
            showToast('Teacher updated!', 'success');
            fetchData();
        } catch (err) {
            showToast('Failed to update teacher', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this teacher? Their user account will also be removed.')) return;
        try {
            await api.delete(`/teachers/${id}`);
            showToast('Teacher deleted', 'success');
            fetchData();
        } catch (err) {
            showToast('Failed to delete teacher', 'error');
        }
    };

    if (loading) return <Layout><Spinner /></Layout>;

    return (
        <Layout>
            <div className="p-8">
                <Head><title>Teachers - EduScheduler</title></Head>
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <GraduationCap /> Teacher Management
                    </h1>

                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4">Add New Teacher</h2>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" value={newTeacher.name}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Department</label>
                                {!showNewDept ? (
                                    <div className="flex gap-1 mt-1">
                                        <select value={newTeacher.department_id}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, department_id: e.target.value })}
                                            className="block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                                            <option value="">None</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                        <button type="button" onClick={() => setShowNewDept(true)}
                                            className="px-2 text-primary hover:text-indigo-700 text-lg font-bold flex-shrink-0" title="Add new department">+</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1 mt-1">
                                        <input type="text" value={newDept} onChange={e => setNewDept(e.target.value)}
                                            placeholder="New department name" className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                                        <button type="button" onClick={handleCreateDept}
                                            className="px-2 text-green-600 hover:text-green-800 font-bold">✓</button>
                                        <button type="button" onClick={() => setShowNewDept(false)}
                                            className="px-2 text-gray-400 hover:text-gray-600 font-bold">✕</button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Max Load Units</label>
                                <input type="number" value={newTeacher.max_load_units}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, max_load_units: parseInt(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <div className="flex items-center gap-2 pt-5">
                                <input type="checkbox" checked={newTeacher.is_full_time}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, is_full_time: e.target.checked })} />
                                <label className="text-sm font-medium text-gray-700">Full-time</label>
                            </div>
                            <div className="flex items-end md:col-span-2">
                                <button type="submit" className="bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
                                    <Plus size={18} /> Add Teacher
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Load</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {teachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        {editingId === teacher.id ? (
                                            <>
                                                <td className="px-6 py-4"><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="border p-1 rounded w-full" /></td>
                                                <td className="px-6 py-4">
                                                    <select value={editForm.department_id || ''} onChange={e => setEditForm({ ...editForm, department_id: e.target.value || null })} className="border p-1 rounded w-full">
                                                        <option value="">None</option>
                                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4"><input type="number" value={editForm.max_load_units} onChange={e => setEditForm({ ...editForm, max_load_units: parseInt(e.target.value) })} className="border p-1 rounded w-20" /></td>
                                                <td className="px-6 py-4">
                                                    <label className="flex items-center gap-1"><input type="checkbox" checked={!!editForm.is_full_time} onChange={e => setEditForm({ ...editForm, is_full_time: e.target.checked ? 1 : 0 })} /> FT</label>
                                                </td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => handleUpdate(teacher.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="bg-gray-500 text-white px-3 py-1 rounded text-sm">Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{teacher.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{teacher.department_name || '—'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{teacher.max_load_units}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${parseInt(teacher.is_full_time) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {parseInt(teacher.is_full_time) ? 'Full-time' : 'Part-time'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => { setEditingId(teacher.id); setEditForm({ ...teacher }); }} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                                                    <button onClick={() => handleDelete(teacher.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {teachers.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No teachers found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
