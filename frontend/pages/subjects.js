import { useState, useEffect } from 'react';
import Head from 'next/head';
import api from '../utils/api';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastContext';

export default function Subjects() {
    const { showToast } = useToast();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSubject, setNewSubject] = useState({ code: '', name: '', units: 3, required_hours: 3, room_type_required: 'ANY' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => { fetchSubjects(); }, []);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data);
        } catch (err) {
            showToast('Failed to load subjects', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/subjects', newSubject);
            setNewSubject({ code: '', name: '', units: 3, required_hours: 3, room_type_required: 'ANY' });
            showToast('Subject created!', 'success');
            fetchSubjects();
        } catch (err) {
            showToast('Failed to create subject', 'error');
        }
    };

    const handleUpdate = async (id) => {
        try {
            await api.put(`/subjects/${id}`, editForm);
            setEditingId(null);
            showToast('Subject updated!', 'success');
            fetchSubjects();
        } catch (err) {
            showToast('Failed to update subject', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this subject?')) return;
        try {
            await api.delete(`/subjects/${id}`);
            showToast('Subject deleted', 'success');
            fetchSubjects();
        } catch (err) {
            showToast('Failed to delete subject', 'error');
        }
    };

    if (loading) return <Layout><Spinner /></Layout>;

    return (
        <Layout>
            <div className="p-8">
                <Head><title>Subjects - EduScheduler</title></Head>
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <BookOpen /> Subject Management
                    </h1>

                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4">Add New Subject</h2>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Code</label>
                                <input type="text" value={newSubject.code}
                                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required placeholder="e.g. CS101" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" value={newSubject.name}
                                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Units</label>
                                <input type="number" value={newSubject.units}
                                    onChange={(e) => setNewSubject({ ...newSubject, units: parseInt(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Required Hours</label>
                                <input type="number" value={newSubject.required_hours}
                                    onChange={(e) => setNewSubject({ ...newSubject, required_hours: parseInt(e.target.value) })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Room Type</label>
                                <select value={newSubject.room_type_required} onChange={(e) => setNewSubject({ ...newSubject, room_type_required: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                                    <option value="ANY">Any</option>
                                    <option value="LECTURE">Lecture</option>
                                    <option value="LAB">Lab</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button type="submit" className="bg-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
                                    <Plus size={18} /> Add Subject
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {subjects.map((subject) => (
                                    <tr key={subject.id}>
                                        {editingId === subject.id ? (
                                            <>
                                                <td className="px-6 py-4"><input value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} className="border p-1 rounded w-full" /></td>
                                                <td className="px-6 py-4"><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="border p-1 rounded w-full" /></td>
                                                <td className="px-6 py-4"><input type="number" value={editForm.units} onChange={e => setEditForm({ ...editForm, units: parseInt(e.target.value) })} className="border p-1 rounded w-16" /></td>
                                                <td className="px-6 py-4"><input type="number" value={editForm.required_hours} onChange={e => setEditForm({ ...editForm, required_hours: parseInt(e.target.value) })} className="border p-1 rounded w-16" /></td>
                                                <td className="px-6 py-4">
                                                    <select value={editForm.room_type_required} onChange={e => setEditForm({ ...editForm, room_type_required: e.target.value })} className="border p-1 rounded">
                                                        <option value="ANY">Any</option><option value="LECTURE">Lecture</option><option value="LAB">Lab</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => handleUpdate(subject.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="bg-gray-500 text-white px-3 py-1 rounded text-sm">Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{subject.code}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{subject.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{subject.units}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{subject.required_hours}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${subject.room_type_required === 'LAB' ? 'bg-purple-100 text-purple-800' : subject.room_type_required === 'LECTURE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {subject.room_type_required}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => { setEditingId(subject.id); setEditForm({ ...subject }); }} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                                                    <button onClick={() => handleDelete(subject.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {subjects.length === 0 && (
                                    <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No subjects found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
