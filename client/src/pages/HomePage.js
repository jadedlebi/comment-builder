import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, AlertCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../services/api';

const HomePage = () => {
  const [rulemakings, setRulemakings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRulemakings();
  }, []);

  const fetchRulemakings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rulemakings');
      setRulemakings(response.data.rulemakings || []);
    } catch (err) {
      setError('Failed to load rulemakings');
      console.error('Error fetching rulemakings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract date string from BigQuery format
  const getDateString = (dateObj) => {
    return typeof dateObj === 'object' && dateObj.value ? dateObj.value : dateObj;
  };

  const getDeadlineStatus = (deadline) => {
    // Handle BigQuery date format - it comes as an object with a 'value' property
    const deadlineString = getDateString(deadline);
    const deadlineDate = parseISO(deadlineString);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) {
      return { status: 'expired', text: 'Deadline passed', color: 'text-red-600' };
    } else if (daysUntilDeadline <= 7) {
      return { status: 'urgent', text: `${daysUntilDeadline} days left`, color: 'text-red-600' };
    } else if (daysUntilDeadline <= 30) {
      return { status: 'soon', text: `${daysUntilDeadline} days left`, color: 'text-yellow-600' };
    } else {
      return { status: 'normal', text: `${daysUntilDeadline} days left`, color: 'text-green-600' };
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading active rulemakings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Unable to Load Rulemakings</h2>
          <p className="text-gray-600 text-lg mb-6">
            We're having trouble connecting to our database. Please try again later.
          </p>
          <button 
            onClick={fetchRulemakings}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
          Government Comment Submission Tool
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Submit personalized comment letters in response to government rulemaking notices. 
          Help make your voice heard in the regulatory process.
        </p>
      </div>

      {rulemakings.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <FileText size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">No Active Rulemakings</h2>
          <p className="text-gray-600 text-lg">
            There are currently no active rulemakings accepting comments.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {rulemakings.map((rulemaking) => {
            const deadlineInfo = getDeadlineStatus(rulemaking.comment_deadline);
            
            return (
              <div key={rulemaking.id} className="card group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                      <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                        {rulemaking.agency}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                      {rulemaking.title}
                    </h2>
                    <div className="flex items-center text-gray-600 mb-4">
                      <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                        Docket: {rulemaking.docket_id}
                      </span>
                    </div>
                    {rulemaking.description && (
                      <p className="text-gray-700 mb-6 leading-relaxed">
                        {rulemaking.description.length > 250 
                          ? `${rulemaking.description.substring(0, 250)}...`
                          : rulemaking.description
                        }
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-6 flex-shrink-0">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-w-[180px]">
                      <div className={`flex items-center mb-2 ${deadlineInfo.color}`}>
                        <Calendar size={16} className="mr-2 flex-shrink-0" />
                        <span className="font-semibold text-sm">
                          {format(parseISO(getDateString(rulemaking.comment_deadline)), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className={`text-xs font-medium ${deadlineInfo.color} text-center`}>
                        {deadlineInfo.text}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    {rulemaking.federal_register_url && (
                      <a
                        href={rulemaking.federal_register_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FileText size={16} className="mr-2 flex-shrink-0" />
                        View Federal Register Notice
                      </a>
                    )}
                  </div>
                  
                  <Link
                    to={`/comment/${rulemaking.id}`}
                    className={`btn ${
                      deadlineInfo.status === 'expired' 
                        ? 'btn-secondary' 
                        : 'btn-primary'
                    }`}
                    disabled={deadlineInfo.status === 'expired'}
                  >
                    <FileText size={16} className="flex-shrink-0" />
                    {deadlineInfo.status === 'expired' ? 'Deadline Passed' : 'Submit Comment'}
                  </Link>
                </div>

                {deadlineInfo.status === 'urgent' && (
                  <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Clock size={18} className="text-orange-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-semibold text-orange-800">
                          Urgent: Comment Period Ending Soon
                        </h3>
                        <p className="text-sm text-orange-700 mt-1">
                          This comment period ends soon! Submit your comment as soon as possible.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            How It Works
          </h3>
          <p className="text-gray-600 max-w-xl mx-auto">
            Simple steps to make your voice heard in the regulatory process
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <span className="text-lg font-bold text-white">1</span>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Choose a Rulemaking</h4>
            <p className="text-gray-600 text-sm leading-relaxed">Select an active government rulemaking that you want to comment on.</p>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <span className="text-lg font-bold text-white">2</span>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Share Your Story</h4>
            <p className="text-gray-600 text-sm leading-relaxed">Tell us about your experiences and concerns related to the proposed rule.</p>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <span className="text-lg font-bold text-white">3</span>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Generate & Submit</h4>
            <p className="text-gray-600 text-sm leading-relaxed">We'll help you create a personalized comment letter to submit to the agency.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
