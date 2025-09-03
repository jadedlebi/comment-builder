import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, FileText, ExternalLink, Share2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../services/api';

// Helper function to extract date string from BigQuery date objects
const getDateString = (dateValue) => {
  if (!dateValue) return null;
  if (typeof dateValue === 'string') return dateValue;
  if (dateValue.value) return dateValue.value;
  return dateValue;
};

// Helper function to format dates safely
const formatDate = (dateValue, formatString = 'MMMM dd, yyyy') => {
  try {
    const dateString = getDateString(dateValue);
    if (!dateString) return 'Date not available';
    
    const parsedDate = parseISO(dateString);
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return 'Invalid date';
    }
    
    return format(parsedDate, formatString);
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateValue);
    return 'Date formatting error';
  }
};

const SubmissionSuccess = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [rulemaking, setRulemaking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/comments/${submissionId}`);
      setSubmission(response.data.submission);
      
      // Fetch rulemaking details
      const rulemakingResponse = await api.get(`/rulemakings/${response.data.submission.rulemaking_id}`);
      setRulemaking(rulemakingResponse.data.rulemaking);
    } catch (err) {
      setError('Failed to load submission details');
      console.error('Error fetching submission:', err);
    } finally {
      setLoading(false);
    }
  };

  const shareOnSocial = (platform) => {
    const text = `I just submitted a comment letter opposing ${rulemaking?.title} by ${rulemaking?.agency}. Join me in making your voice heard!`;
    const url = window.location.origin;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission || !rulemaking) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <CheckCircle className="inline mr-2" size={20} />
          {error || 'Submission not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Comment Letter Submitted Successfully!
        </h1>
        <p className="text-lg text-gray-600">
          Thank you for participating in the regulatory process and making your voice heard.
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submission Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Rulemaking</h3>
            <p className="text-gray-700">{rulemaking.title}</p>
            <p className="text-sm text-gray-600">{rulemaking.agency} • {rulemaking.docket_id}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Submitted By</h3>
            <p className="text-gray-700">{submission.user_name}</p>
            {submission.user_city && submission.user_state && (
              <p className="text-sm text-gray-600">{submission.user_city}, {submission.user_state}</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Submission Date</h3>
            <p className="text-gray-700">
              {formatDate(submission.submitted_at || submission.created_at, 'MMMM dd, yyyy \'at\' h:mm a')}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              submission.submission_status === 'submitted' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {submission.submission_status === 'submitted' ? 'Submitted' : 'Draft Saved'}
            </span>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Comment Letter</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
            {submission.final_comment || submission.generated_comment}
          </pre>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What Happens Next?</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-sm font-semibold text-blue-600">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Agency Review</h3>
              <p className="text-gray-600 text-sm">
                The {rulemaking.agency} will review all submitted comments as part of their rulemaking process.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-sm font-semibold text-blue-600">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Public Record</h3>
              <p className="text-gray-600 text-sm">
                Your comment becomes part of the public record and may be referenced in the final rule.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-sm font-semibold text-blue-600">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Final Rule</h3>
              <p className="text-gray-600 text-sm">
                The agency will publish a final rule, taking into account all submitted comments.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Share Your Action</h2>
        <p className="text-gray-600 mb-4">
          Help others learn about this important issue by sharing your participation on social media.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => shareOnSocial('twitter')}
            className="btn btn-outline"
          >
            <Share2 size={16} />
            Share on Twitter
          </button>
          <button
            onClick={() => shareOnSocial('facebook')}
            className="btn btn-outline"
          >
            <Share2 size={16} />
            Share on Facebook
          </button>
          <button
            onClick={() => shareOnSocial('linkedin')}
            className="btn btn-outline"
          >
            <Share2 size={16} />
            Share on LinkedIn
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="space-x-4">
          <Link to="/" className="btn btn-primary">
            <FileText size={16} />
            View Other Rulemakings
          </Link>
          {rulemaking.federal_register_url && (
            <a
              href={rulemaking.federal_register_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              <ExternalLink size={16} />
              View Federal Register Notice
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
