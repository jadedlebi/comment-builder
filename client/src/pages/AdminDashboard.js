import React, { useState, useEffect } from 'react';
import { FileText, Users, TrendingUp, Download, Plus, Edit, Eye, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [rulemakings, setRulemakings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [selectedRulemaking, setSelectedRulemaking] = useState(null);
  const [newRulemaking, setNewRulemaking] = useState({
    title: '',
    agency: '',
    docket: '',
    comment_deadline: '',
    description: '',
    ncrc_comment_letter: ''
  });
  const [editRulemaking, setEditRulemaking] = useState({
    title: '',
    agency: '',
    docket: '',
    comment_deadline: '',
    description: '',
    ncrc_comment_letter: ''
  });
  
  const { user, logout } = useAuth();

  // Helper function to extract date string from BigQuery format
  const getDateString = (dateObj) => {
    return typeof dateObj === 'object' && dateObj.value ? dateObj.value : dateObj;
  };

  // Helper function to safely format dates
  const formatDate = (dateObj, formatStr = 'MMM dd, yyyy') => {
    try {
      const dateString = getDateString(dateObj);
      const parsedDate = parseISO(dateString);
      if (isNaN(parsedDate.getTime())) {
        return 'Invalid Date';
      }
      return format(parsedDate, formatStr);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulemakingsRes, submissionsRes, statsRes] = await Promise.all([
        api.get('/rulemakings'),
        api.get('/submissions'),
        api.get('/stats')
      ]);
      
      setRulemakings(rulemakingsRes.data);
      setSubmissions(submissionsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalAnimating(false);
    setTimeout(() => {
      setShowAddModal(false);
      setShowViewModal(false);
      setShowEditModal(false);
      setSelectedRulemaking(null);
      setNewRulemaking({
        title: '',
        agency: '',
        docket: '',
        comment_deadline: '',
        description: '',
        ncrc_comment_letter: ''
      });
      setEditRulemaking({
        title: '',
        agency: '',
        docket: '',
        comment_deadline: '',
        description: '',
        ncrc_comment_letter: ''
      });
    }, 300);
  };

  const openModal = (modalType, rulemaking = null) => {
    if (rulemaking) {
      setSelectedRulemaking(rulemaking);
      if (modalType === 'edit') {
        setEditRulemaking({
          title: rulemaking.title || '',
          agency: rulemaking.agency || '',
          docket: rulemaking.docket_id || '',
          comment_deadline: rulemaking.comment_deadline ? formatDate(rulemaking.comment_deadline, 'yyyy-MM-dd') : '',
          description: rulemaking.description || '',
          ncrc_comment_letter: rulemaking.ncrc_comment_letter || ''
        });
      }
    }
    
    if (modalType === 'add') setShowAddModal(true);
    if (modalType === 'view') setShowViewModal(true);
    if (modalType === 'edit') setShowEditModal(true);
    
    setTimeout(() => setIsModalAnimating(true), 10);
  };

  const handleAddRulemaking = async (e) => {
    e.preventDefault();
    try {
      const apiData = {
        title: newRulemaking.title,
        agency: newRulemaking.agency,
        docket_id: newRulemaking.docket,
        comment_deadline: new Date(newRulemaking.comment_deadline).toISOString(),
        description: newRulemaking.description,
        ncrc_comment_letter: newRulemaking.ncrc_comment_letter,
        status: 'active'
      };
      
      await api.post('/rulemakings', apiData);
      closeModal();
      loadData();
    } catch (err) {
      console.error('Error creating rulemaking:', err);
      setError('Failed to create rulemaking');
    }
  };

  const handleEditRulemaking = async (e) => {
    e.preventDefault();
    try {
      const apiData = {
        title: editRulemaking.title,
        agency: editRulemaking.agency,
        docket_id: editRulemaking.docket,
        comment_deadline: new Date(editRulemaking.comment_deadline).toISOString(),
        description: editRulemaking.description,
        ncrc_comment_letter: editRulemaking.ncrc_comment_letter,
        status: selectedRulemaking?.status || 'active'
      };
      
      await api.put(`/rulemakings/${selectedRulemaking.id}`, apiData);
      closeModal();
      loadData();
    } catch (err) {
      console.error('Error updating rulemaking:', err);
      setError('Failed to update rulemaking');
    }
  };

  const handleDeleteRulemaking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rulemaking?')) return;
    
    try {
      await api.delete(`/rulemakings/${id}`);
      loadData();
    } catch (err) {
      console.error('Error deleting rulemaking:', err);
      setError('Failed to delete rulemaking');
    }
  };

  const exportData = async (type) => {
    try {
      const response = await api.get(`/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage rulemakings and submissions</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'rulemakings', name: 'Rulemakings', icon: FileText },
              { id: 'submissions', name: 'Submissions', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Rulemakings</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalRulemakings || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalSubmissions || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Rulemakings</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeRulemakings || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => exportData('rulemakings')}
                  className="btn btn-outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Rulemakings
                </button>
                <button
                  onClick={() => exportData('submissions')}
                  className="btn btn-outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Submissions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rulemakings Tab */}
        {activeTab === 'rulemakings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Rulemakings</h2>
              <button
                onClick={() => openModal('add')}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Rulemaking
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {rulemakings.map((rulemaking) => (
                  <li key={rulemaking.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {rulemaking.title}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              rulemaking.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rulemaking.status}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <p className="truncate">
                            {rulemaking.agency} • {rulemaking.docket_id}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p>Deadline: {formatDate(rulemaking.comment_deadline)}</p>
                        </div>
                      </div>
                      <div className="ml-5 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => openModal('view', rulemaking)}
                          className="btn btn-outline btn-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal('edit', rulemaking)}
                          className="btn btn-outline btn-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRulemaking(rulemaking.id)}
                          className="btn btn-outline btn-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <li key={submission.id}>
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {submission.rulemaking_title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(submission.created_at)}
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Submitted by: {submission.user_name || 'Anonymous'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Add Rulemaking Modal */}
        {showAddModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            onClick={closeModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              backgroundColor: isModalAnimating ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
              transition: 'background-color 300ms ease-out'
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl relative border border-gray-200"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                position: 'relative', 
                zIndex: 10000, 
                width: '700px',
                maxHeight: '90vh',
                transform: isModalAnimating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-20px)',
                opacity: isModalAnimating ? 1 : 0,
                transition: 'all 300ms ease-out'
              }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Add New Rulemaking</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <form id="add-rulemaking-form" onSubmit={handleAddRulemaking}>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        required
                        value={newRulemaking.title}
                        onChange={(e) => setNewRulemaking({...newRulemaking, title: e.target.value})}
                        className="form-input"
                        placeholder="Enter rulemaking title"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Agency *</label>
                      <input
                        type="text"
                        required
                        value={newRulemaking.agency}
                        onChange={(e) => setNewRulemaking({...newRulemaking, agency: e.target.value})}
                        className="form-input"
                        placeholder="e.g., CFPB"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Docket Number *</label>
                      <input
                        type="text"
                        required
                        value={newRulemaking.docket}
                        onChange={(e) => setNewRulemaking({...newRulemaking, docket: e.target.value})}
                        className="form-input"
                        placeholder="e.g., CFPB-2025-0018"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Comment Deadline *</label>
                      <input
                        type="date"
                        required
                        value={newRulemaking.comment_deadline}
                        onChange={(e) => setNewRulemaking({...newRulemaking, comment_deadline: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        value={newRulemaking.description}
                        onChange={(e) => setNewRulemaking({...newRulemaking, description: e.target.value})}
                        className="form-input"
                        rows="3"
                        placeholder="Enter rulemaking description"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">NCRC Comment Letter</label>
                      <textarea
                        value={newRulemaking.ncrc_comment_letter}
                        onChange={(e) => setNewRulemaking({...newRulemaking, ncrc_comment_letter: e.target.value})}
                        className="form-input"
                        rows="4"
                        placeholder="Paste the NCRC comment letter here. This will be used as context for AI-generated personalized comments."
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-rulemaking-form"
                  className="btn btn-primary"
                >
                  Create Rulemaking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Rulemaking Modal */}
        {showViewModal && selectedRulemaking && (
          <div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowViewModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              backgroundColor: isModalAnimating ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
              transition: 'background-color 300ms ease-out'
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl relative border border-gray-200"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                position: 'relative', 
                zIndex: 10000, 
                width: '700px',
                maxHeight: '90vh',
                transform: isModalAnimating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-20px)',
                opacity: isModalAnimating ? 1 : 0,
                transition: 'all 300ms ease-out'
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Rulemaking Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="text-gray-900">{selectedRulemaking.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Agency</label>
                    <p className="text-gray-900">{selectedRulemaking.agency}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Docket Number</label>
                    <p className="text-gray-900">{selectedRulemaking.docket_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Comment Deadline</label>
                    <p className="text-gray-900">{formatDate(selectedRulemaking.comment_deadline)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-gray-900">{selectedRulemaking.status}</p>
                  </div>
                  {selectedRulemaking.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-900">{selectedRulemaking.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Rulemaking Modal */}
        {showEditModal && selectedRulemaking && (
          <div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            onClick={closeModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              backgroundColor: isModalAnimating ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
              transition: 'background-color 300ms ease-out'
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl relative border border-gray-200"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                position: 'relative', 
                zIndex: 10000, 
                width: '700px',
                maxHeight: '90vh',
                transform: isModalAnimating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-20px)',
                opacity: isModalAnimating ? 1 : 0,
                transition: 'all 300ms ease-out'
              }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Edit Rulemaking</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <form id="edit-rulemaking-form" onSubmit={handleEditRulemaking}>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        required
                        value={editRulemaking.title}
                        onChange={(e) => setEditRulemaking({...editRulemaking, title: e.target.value})}
                        className="form-input"
                        placeholder="Enter rulemaking title"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Agency *</label>
                      <input
                        type="text"
                        required
                        value={editRulemaking.agency}
                        onChange={(e) => setEditRulemaking({...editRulemaking, agency: e.target.value})}
                        className="form-input"
                        placeholder="e.g., CFPB"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Docket Number *</label>
                      <input
                        type="text"
                        required
                        value={editRulemaking.docket}
                        onChange={(e) => setEditRulemaking({...editRulemaking, docket: e.target.value})}
                        className="form-input"
                        placeholder="e.g., CFPB-2025-0018"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Comment Deadline *</label>
                      <input
                        type="date"
                        required
                        value={editRulemaking.comment_deadline}
                        onChange={(e) => setEditRulemaking({...editRulemaking, comment_deadline: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        value={editRulemaking.description}
                        onChange={(e) => setEditRulemaking({...editRulemaking, description: e.target.value})}
                        className="form-input"
                        rows="3"
                        placeholder="Enter rulemaking description"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">NCRC Comment Letter</label>
                      <textarea
                        value={editRulemaking.ncrc_comment_letter}
                        onChange={(e) => setEditRulemaking({...editRulemaking, ncrc_comment_letter: e.target.value})}
                        className="form-input"
                        rows="4"
                        placeholder="Paste the NCRC comment letter here. This will be used as context for AI-generated personalized comments."
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-rulemaking-form"
                  className="btn btn-primary"
                >
                  Update Rulemaking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;