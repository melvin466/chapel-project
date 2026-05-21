import React, { useEffect, useMemo, useState } from 'react';
import cellService from '../services/cellService';
import userService from '../services/userService';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm = {
  name: '',
  code: '',
  zone: '',
  location: '',
  meetingDay: 'Sunday',
  meetingTime: '',
  meetingVenue: '',
  leader: '',
  assistantLeader: '',
  maxCapacity: 30,
  description: '',
  isActive: true,
};

const AdminCells = () => {
  const [cells, setCells] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const leaders = useMemo(() => users.filter((user) => ['admin', 'chaplain', 'student_leader'].includes(user.role)), [users]);
  const assignableUsers = useMemo(() => users.filter((user) => user.role !== 'admin'), [users]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cellsRes, usersRes] = await Promise.all([
        cellService.getManageCells(),
        userService.getUsers(),
      ]);
      setCells(cellsRes.data?.cells || []);
      setUsers(usersRes.data?.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cells');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData(emptyForm);
  };

  const handleEdit = (cell) => {
    setEditing(cell);
    setFormData({
      name: cell.name || '',
      code: cell.code || '',
      zone: cell.zone || '',
      location: cell.location || '',
      meetingDay: cell.meetingDay || 'Sunday',
      meetingTime: cell.meetingTime || '',
      meetingVenue: cell.meetingVenue || '',
      leader: cell.leader?._id || cell.leader || '',
      assistantLeader: cell.assistantLeader?._id || cell.assistantLeader || '',
      maxCapacity: cell.maxCapacity || 30,
      description: cell.description || '',
      isActive: cell.isActive !== false,
    });
  };

  const saveCell = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      if (editing) {
        await cellService.updateCell(editing._id, formData);
        setMessage('Cell updated.');
      } else {
        await cellService.createCell(formData);
        setMessage('Cell created.');
      }
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save cell');
    }
  };

  const deleteCell = async () => {
    if (!deleteTarget) return;
    try {
      await cellService.deleteCell(deleteTarget._id);
      setMessage('Cell deleted.');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete cell');
    }
  };

  const assignMember = async (cellId) => {
    const userId = assignments[cellId];
    if (!userId) return;
    try {
      await cellService.assignMember(cellId, userId);
      setAssignments({ ...assignments, [cellId]: '' });
      setMessage('Member assigned.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign member');
    }
  };

  const removeMember = async (cellId, userId) => {
    try {
      await cellService.removeMember(cellId, userId);
      setMessage('Member removed.');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const reviewJoinRequest = async (requestId, status) => {
    try {
      await cellService.reviewJoinRequest(requestId, { status });
      setMessage(`Join request ${status}.`);
      setError('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review join request');
    }
  };

  if (loading) return <div className="loading">Loading cells...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Cells</h1>
        {editing && <button className="btn-secondary" onClick={resetForm}>New Cell</button>}
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <section className="admin-form">
        <h2>{editing ? 'Edit Cell' : 'Create Cell'}</h2>
        <form onSubmit={saveCell}>
          <div className="form-row">
            <input placeholder="Cell name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <input placeholder="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            <select value={formData.zone} onChange={(e) => setFormData({ ...formData, zone: e.target.value })} required>
              <option value="">Select zone</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
              <option value="Central">Central</option>
            </select>
          </div>
          <div className="form-row">
            <input placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
            <select value={formData.meetingDay} onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            <input type="time" value={formData.meetingTime} onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })} required />
          </div>
          <div className="form-row">
            <input placeholder="Meeting venue" value={formData.meetingVenue} onChange={(e) => setFormData({ ...formData, meetingVenue: e.target.value })} required />
            <input type="number" min="1" placeholder="Max capacity" value={formData.maxCapacity} onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })} />
          </div>
          <div className="form-row">
            <select value={formData.leader} onChange={(e) => setFormData({ ...formData, leader: e.target.value })} required>
              <option value="">Select leader</option>
              {leaders.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName} ({user.role})</option>)}
            </select>
            <select value={formData.assistantLeader} onChange={(e) => setFormData({ ...formData, assistantLeader: e.target.value })}>
              <option value="">No assistant</option>
              {leaders.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName} ({user.role})</option>)}
            </select>
          </div>
          <textarea rows="3" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <label className="checkbox-label">
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
            Active cell
          </label>
          <button className="btn-primary" type="submit">{editing ? 'Update Cell' : 'Create Cell'}</button>
        </form>
      </section>

      <div className="cells-admin-grid">
        {cells.map((cell) => (
          <article className="cell-admin-card" key={cell._id}>
            <div className="cell-admin-header">
              <div>
                <h3>{cell.name}</h3>
                <p>{cell.zone} - {cell.meetingDay} {cell.meetingTime}</p>
              </div>
              <span>{cell.memberCount || 0}/{cell.maxCapacity || 30}</span>
            </div>
            <p><strong>Leader:</strong> {cell.leader ? `${cell.leader.firstName} ${cell.leader.lastName}` : '-'}</p>
            <p><strong>Venue:</strong> {cell.meetingVenue}</p>
            <div className="member-list">
              {(cell.members || []).length === 0 ? <p>No assigned members.</p> : cell.members.map((member) => (
                <div key={member._id} className="member-row">
                  <span>{member.firstName} {member.lastName}</span>
                  <button onClick={() => removeMember(cell._id, member._id)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="join-request-list">
              <strong>Join requests</strong>
              {(cell.joinRequests || []).length === 0 ? <p>No pending requests.</p> : cell.joinRequests.map((request) => (
                <div key={request._id} className="join-request-row">
                  <span>{request.user?.firstName} {request.user?.lastName}</span>
                  <div>
                    <button onClick={() => reviewJoinRequest(request._id, 'approved')}>Approve</button>
                    <button className="btn-delete" onClick={() => reviewJoinRequest(request._id, 'denied')}>Deny</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="assign-row">
              <select value={assignments[cell._id] || ''} onChange={(e) => setAssignments({ ...assignments, [cell._id]: e.target.value })}>
                <option value="">Assign member</option>
                {assignableUsers.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName} {user.cellId ? '(move)' : ''}</option>)}
              </select>
              <button onClick={() => assignMember(cell._id)}>Assign</button>
            </div>
            <div className="cell-actions">
              <button className="btn-edit" onClick={() => handleEdit(cell)}>Edit</button>
              <button className="btn-delete" onClick={() => setDeleteTarget(cell)}>Delete</button>
            </div>
          </article>
        ))}
      </div>

      <style>{`
        .admin-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .admin-header h1 { color: white; }
        .admin-form { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .admin-form h2 { color: white; margin-bottom: 1rem; }
        .admin-form form { display: grid; gap: 1rem; }
        .form-row { display: flex; flex-wrap: wrap; gap: 1rem; }
        .form-row > *, .admin-form textarea, .admin-form select { flex: 1 1 190px; min-width: 0; width: 100%; padding: 0.8rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; background: rgba(255,255,255,0.05); }
        .form-row > *::placeholder, .admin-form textarea::placeholder { color: rgba(255,255,255,0.5); }
        .checkbox-label { display: flex; gap: 0.5rem; align-items: center; color: white; }
        .cells-admin-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
        .cell-admin-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 1rem; color: white; }
        .cell-admin-header { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.75rem; margin-bottom: 0.75rem; }
        .cell-admin-header h3 { margin-bottom: 0.2rem; color: white; }
        .cell-admin-header span { font-weight: 700; color: #a8ff78; }
        .member-list, .join-request-list { margin: 1rem 0; display: grid; gap: 0.4rem; }
        .join-request-list strong { color: white; }
        .member-list p, .join-request-list p { color: rgba(255,255,255,0.6); }
        .member-row, .assign-row, .cell-actions, .join-request-row { display: flex; gap: 0.5rem; align-items: center; }
        .member-row { justify-content: space-between; padding: 0.45rem; background: rgba(255,255,255,0.05); border-radius: 6px; }
        .join-request-row { justify-content: space-between; padding: 0.45rem; background: rgba(255,255,255,0.05); border-radius: 6px; }
        .join-request-row div { display: flex; gap: 0.4rem; }
        .member-row span, .join-request-row span { color: white; }
        .assign-row select { flex: 1; min-width: 0; padding: 0.6rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: white; }
        .assign-row select option { background: #1f2933; color: white; }
        .assign-row button, .member-row button, .join-request-row button, .btn-edit, .btn-delete, .btn-secondary { padding: 0.45rem 0.75rem; border: 0; border-radius: 6px; cursor: pointer; color: white; }
        .assign-row button, .join-request-row button, .btn-edit { background: #315f72; }
        .member-row button, .btn-delete { background: #c2413a; }
        .btn-secondary { background: #4c5f7a; }
        .cell-actions { margin-top: 1rem; }
      `}</style>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete cell"
        message={`Delete "${deleteTarget?.name || 'this cell'}" and remove its member assignments? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteCell}
      />
    </div>
  );
};

export default AdminCells;
