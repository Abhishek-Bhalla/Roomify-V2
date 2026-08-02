import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, Ban, CheckCircle, X, UserPlus } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import PasswordInput from '../../components/common/PasswordInput';
import { userAPI } from '../../services/api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'requester', password: '', employeeId: '' });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAll();
      setUsers(response.data.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'requester', password: '', employeeId: '' });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, password: '', employeeId: user.employeeId || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.email || !formData.employeeId) {
        alert('Please fill in all required fields');
        return;
      }

      if (editingUser) {
        const dataToUpdate = { name: formData.name, email: formData.email, role: formData.role, employeeId: formData.employeeId };
        if (formData.password) {
          dataToUpdate.password = formData.password;
        }
        await userAPI.update(editingUser._id, dataToUpdate);
      } else {
        if (!formData.password) {
          alert('Password is required for new users');
          return;
        }
        await userAPI.create(formData);
      }
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(id);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const toggleStatus = async (user) => {
    try {
      if (user.status === 'active') {
        await userAPI.block(user._id);
      } else {
        await userAPI.unblock(user._id);
      }
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return { background: '#EDE9FE', color: '#5B21B6' };
      case 'approver':
        return { background: '#DBEAFE', color: '#1E40AF' };
      case 'maintenance':
        return { background: '#FFEDD5', color: '#9A3412' };
      default:
        return { background: '#E5E7EB', color: '#374151' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all system users and their roles</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" onClick={fetchUsers} className="flex-1 sm:flex-none">
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAdd} className="flex-1 sm:flex-none">
            <Plus size={18} className="mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Employee ID (Primary Key)</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50" style={{ borderColor: '#F3F4F6' }}>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {user.employeeId || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                          style={{ background: '#034DA2' }}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className="px-3 py-1 text-xs font-medium rounded-full"
                        style={getRoleBadgeColor(user.role)}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => toggleStatus(user)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                        >
                          {user.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found</div>
        ) : (
          users.map((user) => (
            <div key={user._id} className="bg-white rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                    style={{ background: '#034DA2' }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.employeeId && (
                      <p className="text-xs text-gray-400 mt-1">ID: {user.employeeId}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={user.status} />
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="px-3 py-1 text-xs font-medium rounded-full"
                  style={getRoleBadgeColor(user.role)}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(user)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => toggleStatus(user)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                  >
                    {user.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="EMP001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingUser && '(leave blank to keep same)'}</label>
                <PasswordInput
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank' : 'Enter password'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="requester">Requester</option>
                  <option value="approver">Approver</option>
                  <option value="admin">Admin</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1">
                {editingUser ? 'Update' : 'Add User'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
