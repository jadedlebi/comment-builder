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
  const [addModalStep, setAddModalStep] = useState(1);
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
      console.error('Date formatting error:', error, dateObj);
      return 'Invalid Date';
    }
  };

  // Helper function to check if rulemaking is expired
  const isRulemakingExpired = (deadline) => {
    try {
      const deadlineString = getDateString(deadline);
      const deadlineDate = parseISO(deadlineString);
      const now = new Date();
      return deadlineDate < now;
    } catch (error) {
      console.error('Date parsing error:', error, deadline);
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {

    if (showAddModal) {
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
      // Start animation after a brief delay to ensure DOM is ready
      setTimeout(() => {
        setIsModalAnimating(true);
      }, 10);
    } else {
      // Start exit animation
      setIsModalAnimating(false);
      // Restore body scrolling after animation completes
      setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 300);
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

  // Function to handle modal close with proper animation
  const closeModal = () => {
    setIsModalAnimating(false);
    setAddModalStep(1);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setShowAddModal(false);
    }, 300);
  };

  // Step navigation functions
  const nextStep = () => {
    if (addModalStep < 2) {
      setAddModalStep(addModalStep + 1);
    }
  };

  const prevStep = () => {
    if (addModalStep > 1) {
      setAddModalStep(addModalStep - 1);
    }
  };

  // Validation for step 1
  const isStep1Valid = () => {
    return newRulemaking.title.trim() && 
           newRulemaking.agency.trim() && 
           newRulemaking.docket.trim() && 
           newRulemaking.comment_deadline;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulemakingsRes, submissionsRes, statsRes] = await Promise.all([
        api.get('/rulemakings/admin'),
        api.get('/submissions?limit=50'),
        api.get('/submissions/stats')
      ]);

      setRulemakings(rulemakingsRes.data.rulemakings || []);
      setSubmissions(submissionsRes.data.submissions || []);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRulemaking = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/rulemakings', newRulemaking);
      setRulemakings([...rulemakings, response.data.rulemaking]);
      setShowAddModal(false);
      setNewRulemaking({
        title: '',
        agency: '',
        docket: '',
        comment_deadline: '',
        description: '',
        ncrc_comment_letter: ''
      });
    } catch (err) {
      setError('Failed to create rulemaking');
      console.error('Error creating rulemaking:', err);
    }
  };

  const handleViewRulemaking = (rulemaking) => {
    setSelectedRulemaking(rulemaking);
    setShowViewModal(true);
  };

  const handleEditRulemaking = (rulemaking) => {
    setSelectedRulemaking(rulemaking);
    setEditRulemaking({
      title: rulemaking.title,
      agency: rulemaking.agency,
      docket: rulemaking.docket_id,
      comment_deadline: getDateString(rulemaking.comment_deadline),
      description: rulemaking.description || '',
      ncrc_comment_letter: rulemaking.ncrc_comment_letter || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateRulemaking = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/rulemakings/${selectedRulemaking.id}`, editRulemaking);
      setRulemakings(rulemakings.map(r => r.id === selectedRulemaking.id ? response.data.rulemaking : r));
      setShowEditModal(false);
      setSelectedRulemaking(null);
      setEditRulemaking({
        title: '',
        agency: '',
        docket: '',
        comment_deadline: '',
        description: '',
        ncrc_comment_letter: ''
      });
    } catch (err) {
      setError('Failed to update rulemaking');
      console.error('Error updating rulemaking:', err);
    }
  };

  const exportSubmissions = async (format = 'csv') => {
    try {
      const response = await api.get(`/submissions/export?format=${format}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `submissions_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <FileText className="inline mr-2" size={20} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage rulemakings and view submission analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="flex flex-row gap-6 mb-8" style={{ width: '100%', display: 'flex' }}>
        <div className="card text-center flex-1" style={{ flex: '1 1 0%', minWidth: '0' }}>
          <div className="text-2xl font-bold text-blue-600 mb-2">{stats.total_submissions || 0}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </div>
        <div className="card text-center flex-1" style={{ flex: '1 1 0%', minWidth: '0' }}>
          <div className="text-2xl font-bold text-green-600 mb-2">{stats.unique_users || 0}</div>
          <div className="text-sm text-gray-600">Unique Users</div>
        </div>
        <div className="card text-center flex-1" style={{ flex: '1 1 0%', minWidth: '0' }}>
          <div className="text-2xl font-bold text-purple-600 mb-2">{stats.states_represented || 0}</div>
          <div className="text-sm text-gray-600">States Represented</div>
        </div>
        <div className="card text-center flex-1" style={{ flex: '1 1 0%', minWidth: '0' }}>
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {Math.round(stats.avg_comment_length || 0)}
          </div>
          <div className="text-sm text-gray-600">Avg Comment Length</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex space-x-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-xl shadow-sm" style={{ border: 'none !important', outline: 'none', borderColor: 'transparent !important', borderWidth: '0 !important', boxShadow: 'none !important' }}>
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'rulemakings', label: 'Rulemakings', icon: FileText },
            { id: 'submissions', label: 'Submissions', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center py-3 px-10 rounded-lg font-semibold text-sm transition-all duration-150 ease-in-out border-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-lg transform scale-105'
                    : 'text-blue-600 hover:text-blue-800 hover:bg-white/70 hover:shadow-md hover:transform hover:scale-102'
                }`}
                style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {submissions.slice(0, 10).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-900">{submission.user_name}</div>
                    <div className="text-sm text-gray-600">
                      Submitted comment for {submission.rulemaking_title || 'Unknown Rulemaking'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(submission.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rulemakings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Active Rulemakings</h2>
            <button 
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowAddModal(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <Plus size={16} />
              Add New Rulemaking
            </button>
          </div>

          <div className="space-y-4">
            {rulemakings.map((rulemaking) => {
              const isExpired = isRulemakingExpired(rulemaking.comment_deadline);
              const displayStatus = isExpired ? 'expired' : rulemaking.status;
              
              return (
                <div key={rulemaking.id} className={`card ${isExpired ? 'opacity-75 bg-gray-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {rulemaking.title}
                        {isExpired && <span className="ml-2 text-sm text-red-600">(Expired)</span>}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        <strong>Agency:</strong> {rulemaking.agency} | <strong>Docket:</strong> {rulemaking.docket_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Deadline:</strong> {formatDate(rulemaking.comment_deadline, 'MMMM dd, yyyy')}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                        displayStatus === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : displayStatus === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {displayStatus}
                      </span>
                    </div>
                    <div className="flex gap-3 ml-4">
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleViewRulemaking(rulemaking)}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleEditRulemaking(rulemaking)}
                        title="Edit rulemaking"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Submissions</h2>
            <div className="flex gap-3">
              <button 
                onClick={() => exportSubmissions('csv')}
                className="btn btn-outline"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button 
                onClick={() => exportSubmissions('json')}
                className="btn btn-outline"
              >
                <Download size={16} />
                Export JSON
              </button>
            </div>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ letterSpacing: '0.05em' }}>
                      User
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ letterSpacing: '0.05em' }}>
                      Email
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ letterSpacing: '0.05em' }}>
                      Location
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ letterSpacing: '0.05em' }}>
                      Rulemaking
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ letterSpacing: '0.05em' }}>
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ letterSpacing: '0.05em' }}>
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ letterSpacing: '0.05em' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">{submission.user_name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-500">{submission.user_email || 'No email'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {submission.user_city && submission.user_state 
                            ? `${submission.user_city}, ${submission.user_state}`
                            : 'Not provided'
                          }
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm text-gray-900 max-w-xs truncate mx-auto" title={submission.rulemaking_title || 'Unknown'}>
                          {submission.rulemaking_title || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{submission.agency || ''}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          submission.submission_status === 'submitted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.submission_status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {formatDate(submission.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => window.open(`/success/${submission.id}`, '_blank')}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 transition-all duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add New Rulemaking Modal */}
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
            className="bg-white rounded-lg shadow-2xl relative border border-gray-200 flex flex-col"
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
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Add New Rulemaking</h3>
                <p className="text-sm text-gray-500 mt-1">Step {addModalStep} of 2</p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#374151';
                  e.target.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#9ca3af';
                  e.target.style.backgroundColor = 'transparent';
                }}
                aria-label="Close modal"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(addModalStep / 2) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6">
              <form id="add-rulemaking-form" onSubmit={handleAddRulemaking} className="h-full flex flex-col">
                <div className="flex-1 transition-all duration-300 ease-in-out">
                  {addModalStep === 1 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
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
                    </div>
                  )}

                  {addModalStep === 2 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h4>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          value={newRulemaking.description}
                          onChange={(e) => setNewRulemaking({...newRulemaking, description: e.target.value})}
                          rows={4}
                          className="form-input"
                          placeholder="Enter rulemaking description"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">NCRC Comment Letter</label>
                        <textarea
                          value={newRulemaking.ncrc_comment_letter}
                          onChange={(e) => setNewRulemaking({...newRulemaking, ncrc_comment_letter: e.target.value})}
                          rows={6}
                          className="form-input"
                          placeholder="Paste the NCRC comment letter here. This will be used as context for AI-generated personalized comments."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          This letter will be used as context for generating personalized comments. Users will not see this directly.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Footer - Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    {addModalStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="btn btn-outline w-full"
                      >
                        ← Previous
                      </button>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="btn btn-outline flex-1"
                      >
                        Cancel
                      </button>
                      {addModalStep < 2 ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          disabled={!isStep1Valid()}
                          className="btn btn-primary flex-1"
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="btn btn-primary flex-1"
                        >
                          Create Rulemaking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Rulemaking Modal */}
      {showViewModal && selectedRulemaking && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999]"
          onClick={() => setShowViewModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            transition: 'background-color 300ms ease-out'
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl p-8 relative border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'relative', 
              zIndex: 10000, 
              width: '700px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <button
              onClick={() => setShowViewModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#374151';
                e.target.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#9ca3af';
                e.target.style.backgroundColor = 'transparent';
              }}
              aria-label="Close modal"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-2">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 pr-14">Rulemaking Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-gray-900">{selectedRulemaking.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
                    <p className="text-gray-900">{selectedRulemaking.agency}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Docket ID</label>
                    <p className="text-gray-900">{selectedRulemaking.docket_id}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment Deadline</label>
                  <p className="text-gray-900">{formatDate(selectedRulemaking.comment_deadline, 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedRulemaking.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedRulemaking.status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedRulemaking.status}
                  </span>
                </div>
                {selectedRulemaking.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedRulemaking.description}</p>
                  </div>
                )}
                {selectedRulemaking.federal_register_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Federal Register URL</label>
                    <a 
                      href={selectedRulemaking.federal_register_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {selectedRulemaking.federal_register_url}
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Created</label>
                    <p>{formatDate(selectedRulemaking.created_at)}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Last Updated</label>
                    <p>{formatDate(selectedRulemaking.updated_at)}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rulemaking Modal */}
      {showEditModal && selectedRulemaking && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowEditModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            transition: 'background-color 300ms ease-out'
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl relative border border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'relative', 
              zIndex: 10000, 
              width: '700px',
              maxHeight: '90vh'
            }}
          >
            <button
              onClick={() => setShowEditModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#374151';
                e.target.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#9ca3af';
                e.target.style.backgroundColor = 'transparent';
              }}
              aria-label="Close modal"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-2">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 pr-14">Edit Rulemaking</h3>
              <form onSubmit={handleUpdateRulemaking} className="space-y-4">
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
                    rows={3}
                    className="form-input"
                    placeholder="Enter rulemaking description"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">NCRC Comment Letter</label>
                  <textarea
                    value={editRulemaking.ncrc_comment_letter}
                    onChange={(e) => setEditRulemaking({...editRulemaking, ncrc_comment_letter: e.target.value})}
                    rows={8}
                    className="form-input"
                    placeholder="Paste the NCRC comment letter here. This will be used as context for AI-generated personalized comments."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This letter will be used as context for generating personalized comments. Users will not see this directly.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Update Rulemaking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
