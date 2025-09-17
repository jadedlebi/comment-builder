import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, FileText, AlertCircle, CheckCircle, Edit3, Copy, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
// reCAPTCHA v3 will be loaded via script tag
import api from '../services/api';
import LegalDisclaimerModal from '../components/LegalDisclaimerModal';

const CommentGenerator = () => {
  const { rulemakingId } = useParams();
  const navigate = useNavigate();
  
  const [rulemaking, setRulemaking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_city: '',
    user_state: '',
    user_zip: '',
    personal_story: '',
    why_it_matters: '',
    experiences: '',
    concerns: ''
  });
  
  const [generatedComment, setGeneratedComment] = useState('');
  const [submissionId, setSubmissionId] = useState(null);

  const fetchRulemaking = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rulemakings/${rulemakingId}`);
      setRulemaking(response.data.rulemaking);
    } catch (err) {
      setError('Failed to load rulemaking details');
      console.error('Error fetching rulemaking:', err);
    } finally {
      setLoading(false);
    }
  }, [rulemakingId]);

  useEffect(() => {
    fetchRulemaking();
  }, [fetchRulemaking]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load reCAPTCHA v3 script
  useEffect(() => {
    if (!process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
      console.warn('reCAPTCHA site key not found');
      return;
    }

    console.log('Loading reCAPTCHA script...');
    
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=' + process.env.REACT_APP_RECAPTCHA_SITE_KEY;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('reCAPTCHA script loaded successfully');
    };
    
    script.onerror = (error) => {
      console.error('Failed to load reCAPTCHA script:', error);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const executeRecaptcha = () => {
    return new Promise((resolve, reject) => {
      console.log('Starting reCAPTCHA execution...');
      
      if (!process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
        const error = new Error('reCAPTCHA site key not available');
        console.error(error.message);
        reject(error);
        return;
      }

      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait time
      
      // Wait for reCAPTCHA to be available
      const checkRecaptcha = () => {
        attempts++;
        console.log(`reCAPTCHA check attempt ${attempts}/${maxAttempts}`);
        
        if (window.grecaptcha && window.grecaptcha.ready) {
          console.log('reCAPTCHA is ready, executing...');
          window.grecaptcha.ready(() => {
            window.grecaptcha.execute(process.env.REACT_APP_RECAPTCHA_SITE_KEY, { action: 'submit' })
              .then((token) => {
                console.log('reCAPTCHA token generated successfully:', token ? 'Token received' : 'No token');
                setRecaptchaToken(token);
                resolve(token);
              })
              .catch((error) => {
                console.error('reCAPTCHA execution error:', error);
                reject(error);
              });
          });
        } else if (attempts >= maxAttempts) {
          const error = new Error('reCAPTCHA failed to load after maximum attempts');
          console.error(error.message);
          reject(error);
        } else {
          // Wait a bit and try again
          setTimeout(checkRecaptcha, 100);
        }
      };
      
      checkRecaptcha();
    });
  };

  const generateComment = async () => {
    console.log('generateComment called');
    
    // Validate all required fields
    const requiredFields = {
      'Full Name': formData.user_name,
      'Email': formData.user_email,
      'City': formData.user_city,
      'State': formData.user_state,
      'ZIP Code': formData.user_zip,
      'Why does this issue matter to you?': formData.why_it_matters
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([field, value]) => !value || !value.trim())
      .map(([field]) => field);
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    console.log('Showing legal modal');
    // Show legal disclaimer modal first
    setShowLegalModal(true);
  };

  const handleLegalModalAccept = async () => {
    setShowLegalModal(false);
    setIsGenerating(true);
    
    try {
      // Execute reCAPTCHA v3 and get token
      let token = null;
      if (process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
        try {
          console.log('Attempting to generate reCAPTCHA token...');
          token = await executeRecaptcha();
          if (!token) {
            throw new Error('reCAPTCHA token is empty');
          }
          console.log('reCAPTCHA token generated successfully');
        } catch (error) {
          console.error('reCAPTCHA execution failed:', error);
          alert(`reCAPTCHA verification failed: ${error.message}. Please refresh the page and try again.`);
          return;
        }
      } else {
        console.warn('reCAPTCHA site key not available, skipping reCAPTCHA verification');
      }

      const requestData = {
        ...formData,
        rulemaking_id: rulemakingId,
        recaptcha_token: token
      };
      
      console.log('Sending request to API:', {
        ...requestData,
        recaptcha_token: token ? 'Token present' : 'No token'
      });
      
      const response = await api.post('/comments/generate', requestData);

      setGeneratedComment(response.data.generated_comment);
      setSubmissionId(response.data.submission_id);
      setStep(3);
    } catch (err) {
      console.error('Error generating comment:', err);
      if (err.response && err.response.data) {
        alert(`Failed to generate comment: ${err.response.data.error || 'Unknown error'}`);
      } else {
        alert('Failed to generate comment. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveFinalComment = async () => {
    if (!submissionId) return;

    try {
      await api.put(`/comments/${submissionId}`, {
        final_comment: generatedComment,
        submission_status: 'submitted'
      });

      navigate(`/success/${submissionId}`);
    } catch (err) {
      console.error('Error saving comment:', err);
      alert('Failed to save comment. Please try again.');
    }
  };

  const handleFederalRegisterNavigation = async () => {
    if (!submissionId) return;

    try {
      // Mark as submitted when navigating to Federal Register
      await api.put(`/comments/${submissionId}`, {
        final_comment: generatedComment,
        submission_status: 'submitted'
      });

      // Navigate to Federal Register
      const federalRegisterUrl = `https://www.regulations.gov/commenton/${rulemaking.docket_id}-0001`;
      window.open(federalRegisterUrl, '_blank');
      
      // Then navigate to success page
      navigate(`/success/${submissionId}`);
    } catch (err) {
      console.error('Error saving comment:', err);
      alert('Failed to save comment. Please try again.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedComment);
    alert('Comment copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rulemaking details...</p>
        </div>
      </div>
    );
  }

  if (error || !rulemaking) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <AlertCircle className="inline mr-2" size={20} />
          {error || 'Rulemaking not found'}
        </div>
      </div>
    );
  }

  // Helper function to extract date string from BigQuery format
  const getDateString = (dateObj) => {
    return typeof dateObj === 'object' && dateObj.value ? dateObj.value : dateObj;
  };

  const deadlineDate = parseISO(getDateString(rulemaking.comment_deadline));
  const isExpired = deadlineDate < new Date();
  
  // Safety check for invalid dates
  if (isNaN(deadlineDate.getTime())) {
    console.error('Invalid deadline date:', rulemaking.comment_deadline);
    return (
      <div className="container">
        <div className="alert alert-error">
          <AlertCircle className="inline mr-2" size={20} />
          Invalid deadline date in rulemaking data.
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <AlertCircle className="inline mr-2" size={20} />
          The comment period for this rulemaking has ended on {format(deadlineDate, 'MMMM dd, yyyy')}.
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="container max-w-4xl">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {rulemaking.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              <strong>Agency:</strong> {rulemaking.agency} | <strong>Docket:</strong> {rulemaking.docket_id}
            </p>
            <div className="alert alert-warning">
              <AlertCircle className="inline mr-2" size={20} />
              <strong>Deadline:</strong> {format(deadlineDate, 'MMMM dd, yyyy')}
            </div>
          </div>

          {rulemaking.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Rulemaking</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{rulemaking.description}</p>
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setStep(2)}
              className="btn btn-primary"
            >
              <FileText size={20} />
              Start Creating Your Comment Letter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="container max-w-4xl">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Tell Your Story</h1>
          <p className="text-gray-600 mb-6">
            Share your information and experiences. We'll combine this with our analysis to create a draft comment letter.
          </p>
          
          <div className="alert alert-info">
            <p className="text-sm">
              <strong>Important:</strong> This tool creates a draft to help organize your thoughts and speed up the process. 
              You will need to review, edit, and personalize the generated letter before submitting it as your own comment 
              to the Federal Register. The final letter should reflect your genuine views and experiences.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={formData.user_name}
                  onChange={(e) => handleInputChange('user_name', e.target.value)}
                  className="form-input"
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => handleInputChange('user_email', e.target.value)}
                  className="form-input"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  value={formData.user_city}
                  onChange={(e) => handleInputChange('user_city', e.target.value)}
                  className="form-input"
                  placeholder="Your city"
                />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  type="text"
                  value={formData.user_state}
                  onChange={(e) => handleInputChange('user_state', e.target.value)}
                  className="form-input"
                  placeholder="Your state"
                />
              </div>
              <div className="form-group">
                <label className="form-label">ZIP Code *</label>
                <input
                  type="text"
                  value={formData.user_zip}
                  onChange={(e) => handleInputChange('user_zip', e.target.value)}
                  className="form-input"
                  placeholder="12345"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Why does this issue matter to you? *</label>
              <textarea
                value={formData.why_it_matters}
                onChange={(e) => handleInputChange('why_it_matters', e.target.value)}
                className="form-textarea"
                rows="3"
                placeholder="Share why this rulemaking is important to you and your family..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Personal experiences (optional)</label>
              <textarea
                value={formData.experiences}
                onChange={(e) => handleInputChange('experiences', e.target.value)}
                className="form-textarea"
                rows="4"
                placeholder="Have you or someone you know experienced problems related to this issue? Share your story..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Concerns about this rulemaking (optional)</label>
              <textarea
                value={formData.concerns}
                onChange={(e) => handleInputChange('concerns', e.target.value)}
                className="form-textarea"
                rows="3"
                placeholder="What worries you most about this proposed rule?"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Personal story or background (optional)</label>
              <textarea
                value={formData.personal_story}
                onChange={(e) => handleInputChange('personal_story', e.target.value)}
                className="form-textarea"
                rows="3"
                placeholder="Tell us about yourself - are you a parent, small business owner, student, retiree? This helps personalize your letter..."
              />
            </div>

          </div>

          <div className="flex space-x-4 mt-8">
            <button
              onClick={() => setStep(1)}
              className="btn btn-outline"
            >
              Back
            </button>
            <button
              onClick={generateComment}
              disabled={!formData.user_name || !formData.user_email || !formData.user_city || !formData.user_state || !formData.user_zip || !formData.why_it_matters || isGenerating}
              className="btn btn-primary flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="loading-spinner"></div>
                  Generating Your Letter...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Generate My Comment Letter
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="container max-w-4xl">
        <div className="card">
          <div className="flex items-center mb-6 text-green-600">
            <CheckCircle className="mr-2" size={24} />
            <h1 className="text-2xl font-bold">Your Draft Comment Letter is Ready!</h1>
          </div>

          <div className="alert alert-error">
            <h3 className="font-semibold mb-2">⚠️ Important Legal Notice:</h3>
            <p className="text-sm">
              This is a DRAFT letter created to help organize your thoughts and speed up the comment process. 
              You must review, edit, and personalize this content before submitting it as your official comment. 
              Any final submission to the Federal Register must reflect your genuine personal views and experiences. 
              NCRC provides this tool solely to assist in organizing public participation in the regulatory process.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generated Draft Letter:</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
              >
                <Edit3 size={16} />
                {isEditing ? 'Done Editing' : 'Edit Letter'}
              </button>
            </div>
            <div className="bg-white border rounded overflow-hidden">
              {isEditing ? (
                <textarea
                  value={generatedComment}
                  onChange={(e) => setGeneratedComment(e.target.value)}
                  className="w-full p-4 text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 min-h-400"
                  placeholder="Edit your letter here..."
                />
              ) : (
                <div 
                  className="p-4 overflow-y-auto overflow-x-hidden border border-gray-200 rounded"
                  style={{ 
                    maxHeight: '600px',
                    minHeight: '200px'
                  }}
                >
                  <div 
                    className="text-sm text-gray-800 font-sans whitespace-pre-wrap pb-4"
                    style={{ 
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      width: '100%',
                      lineHeight: '1.5'
                    }}
                  >
                    {generatedComment}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="alert alert-warning">
            <h3 className="font-semibold mb-2">Required Next Steps:</h3>
            <ol className="text-sm space-y-1">
              <li><strong>Carefully review</strong> the draft letter above</li>
              <li><strong>Edit and personalize</strong> the content to ensure it accurately reflects your views</li>
              <li><strong>Add or modify</strong> any details to make it authentically yours</li>
              <li>Copy your edited letter to your clipboard</li>
              <li>Go to the official Federal Register comment portal and paste your personalized letter</li>
            </ol>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={copyToClipboard}
              className="btn btn-success"
            >
              <Copy size={16} />
              Copy Draft to Clipboard
            </button>
            <button
              onClick={handleFederalRegisterNavigation}
              className="btn btn-primary"
            >
              <ExternalLink size={16} />
              Submit to Federal Register Portal
            </button>
            <button
              onClick={() => {
                setStep(2);
                setGeneratedComment('');
                setSubmissionId(null);
              }}
              className="btn btn-outline"
            >
              Create Another Draft
            </button>
          </div>

          <div className="mt-8 alert alert-info">
            <p className="text-sm">
              <strong>Remember:</strong> The comment deadline is {format(deadlineDate, 'MMMM dd, yyyy')}. After editing your draft to reflect your personal views, 
              submit your personalized comment to help show the agency that real people oppose this rulemaking.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="container">
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rulemaking details...</p>
          </div>
        </div>
      );
    }

    if (error || !rulemaking) {
      return (
        <div className="container">
          <div className="alert alert-error">
            <AlertCircle className="inline mr-2" size={20} />
            {error || 'Rulemaking not found'}
          </div>
        </div>
      );
    }

    // Helper function to extract date string from BigQuery format
    const getDateString = (dateObj) => {
      return typeof dateObj === 'object' && dateObj.value ? dateObj.value : dateObj;
    };

    const deadlineDate = parseISO(getDateString(rulemaking.comment_deadline));
    const isExpired = deadlineDate < new Date();
    
    // Safety check for invalid dates
    if (isNaN(deadlineDate.getTime())) {
      console.error('Invalid deadline date:', rulemaking.comment_deadline);
      return (
        <div className="container">
          <div className="alert alert-error">
            <AlertCircle className="inline mr-2" size={20} />
            Invalid deadline date in rulemaking data.
          </div>
        </div>
      );
    }

    if (isExpired) {
      return (
        <div className="container">
          <div className="alert alert-error">
            <AlertCircle className="inline mr-2" size={20} />
            The comment period for this rulemaking has ended on {format(deadlineDate, 'MMMM dd, yyyy')}.
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="container max-w-4xl">
          <div className="card">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {rulemaking.title}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                <strong>Agency:</strong> {rulemaking.agency} | <strong>Docket:</strong> {rulemaking.docket_id}
              </p>
              <div className="alert alert-warning">
                <AlertCircle className="inline mr-2" size={20} />
                <strong>Deadline:</strong> {format(deadlineDate, 'MMMM dd, yyyy')}
              </div>
            </div>

            {rulemaking.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Rulemaking</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{rulemaking.description}</p>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setStep(2)}
                className="btn btn-primary"
              >
                <FileText size={20} />
                Start Creating Your Comment Letter
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="container max-w-4xl">
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Tell Your Story</h1>
            <p className="text-gray-600 mb-6">
              Share your information and experiences. We'll combine this with our analysis to create a draft comment letter.
            </p>
            
            <div className="alert alert-info">
              <p className="text-sm">
                <strong>Important:</strong> This tool creates a draft to help organize your thoughts and speed up the process. 
                You will need to review, edit, and personalize the generated letter before submitting it as your own comment 
                to the Federal Register. The final letter should reflect your genuine views and experiences.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={formData.user_name}
                    onChange={(e) => handleInputChange('user_name', e.target.value)}
                    className="form-input"
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={formData.user_email}
                    onChange={(e) => handleInputChange('user_email', e.target.value)}
                    className="form-input"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    value={formData.user_city}
                    onChange={(e) => handleInputChange('user_city', e.target.value)}
                    className="form-input"
                    placeholder="Your city"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    value={formData.user_state}
                    onChange={(e) => handleInputChange('user_state', e.target.value)}
                    className="form-input"
                    placeholder="Your state"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ZIP Code *</label>
                  <input
                    type="text"
                    value={formData.user_zip}
                    onChange={(e) => handleInputChange('user_zip', e.target.value)}
                    className="form-input"
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Why does this issue matter to you? *</label>
                <textarea
                  value={formData.why_it_matters}
                  onChange={(e) => handleInputChange('why_it_matters', e.target.value)}
                  className="form-textarea"
                  rows="3"
                  placeholder="Share why this rulemaking is important to you and your family..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Personal experiences (optional)</label>
                <textarea
                  value={formData.experiences}
                  onChange={(e) => handleInputChange('experiences', e.target.value)}
                  className="form-textarea"
                  rows="4"
                  placeholder="Have you or someone you know experienced problems related to this issue? Share your story..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Concerns about this rulemaking (optional)</label>
                <textarea
                  value={formData.concerns}
                  onChange={(e) => handleInputChange('concerns', e.target.value)}
                  className="form-textarea"
                  rows="3"
                  placeholder="What worries you most about this proposed rule?"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Personal story or background (optional)</label>
                <textarea
                  value={formData.personal_story}
                  onChange={(e) => handleInputChange('personal_story', e.target.value)}
                  className="form-textarea"
                  rows="3"
                  placeholder="Tell us about yourself - are you a parent, small business owner, student, retiree? This helps personalize your letter..."
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="btn btn-outline"
              >
                Back
              </button>
              <button
                onClick={generateComment}
                className="btn btn-primary flex-1"
                disabled={isGenerating || !formData.user_name || !formData.user_email || !formData.user_city || !formData.user_state || !formData.user_zip || !formData.why_it_matters}
              >
                {isGenerating ? (
                  <>
                    <div className="loading-spinner"></div>
                    Generating Your Letter...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Generate My Comment Letter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="container max-w-4xl">
          <div className="card">
            <div className="flex items-center mb-6 text-green-600">
              <CheckCircle className="mr-2" size={24} />
              <h1 className="text-2xl font-bold">Your Draft Comment Letter is Ready!</h1>
            </div>

            <div className="alert alert-error">
              <h3 className="font-semibold mb-2">⚠️ Important Legal Notice:</h3>
              <p className="text-sm">
                This is a DRAFT letter created to help organize your thoughts and speed up the comment process. 
                You must review, edit, and personalize this content before submitting it as your official comment. 
                Any final submission to the Federal Register must reflect your genuine personal views and experiences. 
                NCRC provides this tool solely to assist in organizing public participation in the regulatory process.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Generated Draft Letter:</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`btn ${isEditing ? 'btn-success' : 'btn-primary'}`}
                >
                  <Edit3 size={16} />
                  {isEditing ? 'Done Editing' : 'Edit Letter'}
                </button>
              </div>
              <div className="bg-white border rounded overflow-hidden">
                {isEditing ? (
                  <textarea
                    value={generatedComment}
                    onChange={(e) => setGeneratedComment(e.target.value)}
                    className="w-full p-4 text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50 min-h-400"
                    placeholder="Edit your letter here..."
                  />
                ) : (
                  <div 
                    className="p-4 overflow-y-auto border border-gray-200 rounded"
                    style={{maxHeight: '600px', minHeight: '200px'}}
                  >
                    <div 
                      className="text-sm text-gray-800 font-sans whitespace-pre-wrap pb-4"
                      style={{wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%', width: '100%', lineHeight: 1.5}}
                    >
                      {generatedComment}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="alert alert-warning">
              <h3 className="font-semibold mb-2">Required Next Steps:</h3>
              <ol className="text-sm space-y-1">
                <li><strong>Carefully review</strong> the draft letter above</li>
                <li><strong>Edit and personalize</strong> the content to ensure it accurately reflects your views</li>
                <li><strong>Add or modify</strong> any details to make it authentically yours</li>
                <li>Copy your edited letter to your clipboard</li>
                <li>Go to the official Federal Register comment portal and paste your personalized letter</li>
              </ol>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={copyToClipboard}
                className="btn btn-success"
              >
                <Copy size={16} />
                Copy Draft to Clipboard
              </button>
              <button
                onClick={handleFederalRegisterNavigation}
                className="btn btn-primary"
              >
                <ExternalLink size={16} />
                Submit to Federal Register Portal
              </button>
              <button
                onClick={() => {
                  setStep(2);
                  setGeneratedComment('');
                  setSubmissionId(null);
                }}
                className="btn btn-outline"
              >
                Create Another Draft
              </button>
            </div>

            <div className="mt-8 alert alert-info">
              <p className="text-sm">
                <strong>Remember:</strong> The comment deadline is {format(deadlineDate, 'MMMM dd, yyyy')}. After editing your draft to reflect your personal views, 
                submit your personalized comment to help show the agency that real people oppose this rulemaking.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {renderContent()}
      <LegalDisclaimerModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        onAccept={handleLegalModalAccept}
      />
    </>
  );
};

export default CommentGenerator;
