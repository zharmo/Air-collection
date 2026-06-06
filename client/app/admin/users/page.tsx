'use client';

import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  created_at: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'customer' });

  useEffect(() => {
    // Mock data – replace with API call
    setUsers([
      { id: 1, name: 'Admin User', email: 'admin@aircollection.com', role: 'admin', is_active: true, created_at: '2024-01-01' },
      { id: 2, name: 'John Doe', email: 'john@example.com', role: 'customer', is_active: true, created_at: '2024-02-15' },
      { id: 3, name: 'Jane Smith', email: 'jane@example.com', role: 'customer', is_active: false, created_at: '2024-03-10' },
    ]);
  }, []);

  const handleDelete = (id: number) => {
    if (confirm('Delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: formData.name, email: formData.email, role: formData.role as any } : u));
    } else {
      const newUser = { id: Date.now(), ...formData, is_active: true, created_at: new Date().toISOString().split('T')[0] } as User;
      setUsers([...users, newUser]);
    }
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'customer' });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold">User Management</h1>
        <button className="btn btn-dark rounded-0" onClick={() => setShowModal(true)}>
          <FaUserPlus className="me-2" /> Add User
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className="badge bg-secondary">{user.role}</span></td>
                  <td>{user.is_active ? <span className="badge bg-success">Active</span> : <span className="badge bg-danger">Inactive</span>}</td>
                  <td>{user.created_at}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(user)}><FaEdit /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(user.id)}><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content rounded-0">
              <div className="modal-header">
                <h5 className="modal-title">{editingUser ? 'Edit User' : 'Add User'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <input type="text" className="form-control mb-2" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                <input type="email" className="form-control mb-2" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                {!editingUser && <input type="password" className="form-control mb-2" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />}
                <select className="form-select" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary rounded-0" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-dark rounded-0" onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}