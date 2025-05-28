import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Utility Functions
const getAvatarColor = (username) => {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FCEA2B", "#FF9F43", "#6C5CE7", "#FD79A8"];
  const index = username.charCodeAt(0) % colors.length;
  return colors[index];
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Enhanced Auth Screen with Robust Login Flow
const AuthScreen = ({ onLogin, darkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // LOGIN FLOW
        const response = await axios.post(`${API}/login`, {
          username: formData.username,
          password: formData.password
        });
        
        if (response.data.message === "Login successful") {
          // Secure token storage
          const { user, session_id } = response.data;
          
          // Store authentication data securely
          localStorage.setItem('actify_user', JSON.stringify(user));
          localStorage.setItem('actify_session', session_id);
          localStorage.setItem('actify_auth_timestamp', new Date().getTime().toString());
          
          // Show success message briefly
          setSuccess('Login successful! Redirecting...');
          
          // Immediate redirection to Home/Today screen
          setTimeout(() => {
            onLogin(user);
          }, 500); // Brief delay to show success message
          
        } else {
          setError(response.data.message || response.data.detail || 'Login failed. Please check your credentials.');
        }
      } else {
        // SIGNUP FLOW
        const response = await axios.post(`${API}/users`, formData);
        
        // Auto-login after successful signup
        const newUser = response.data;
        localStorage.setItem('actify_user', JSON.stringify(newUser));
        localStorage.setItem('actify_session', 'session_' + newUser.id);
        localStorage.setItem('actify_auth_timestamp', new Date().getTime().toString());
        
        setSuccess('Account created successfully! Welcome to ACTIFY!');
        
        // Immediate redirection
        setTimeout(() => {
          onLogin(newUser);
        }, 800);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Enhanced error handling
      if (error.response) {
        switch (error.response.status) {
          case 401:
            setError('Invalid username or password. Please try again.');
            break;
          case 400:
            setError('Please check your information and try again.');
            break;
          case 409:
            setError('Username or email already exists. Please try a different one.');
            break;
          case 500:
            setError('Server error. Please try again in a moment.');
            break;
          default:
            setError(error.response?.data?.detail || 'Authentication failed. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    }
    setLoading(false);
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ACTIFY</h1>
          <p className="text-gray-600 dark:text-gray-300">Share your fitness journey</p>
        </div>

        <div className="flex mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              clearMessages();
            }}
            className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
              isLogin 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              clearMessages();
            }}
            className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
              !isLogin 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={(e) => {
                setFormData({...formData, full_name: e.target.value});
                clearMessages();
              }}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={loading}
            />
          )}
          
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => {
              setFormData({...formData, username: e.target.value});
              clearMessages();
            }}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
            disabled={loading}
          />
          
          {!isLogin && (
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                clearMessages();
              }}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={loading}
            />
          )}
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => {
              setFormData({...formData, password: e.target.value});
              clearMessages();
            }}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
            disabled={loading}
          />

          {/* Enhanced Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 text-sm">⚠️</span>
                <span className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-green-500 text-sm">✅</span>
                <span className="text-green-700 dark:text-green-300 text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                clearMessages();
                setFormData({ username: '', email: '', password: '', full_name: '' });
              }}
              className="text-purple-600 dark:text-purple-400 font-medium hover:underline"
              disabled={loading}
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Camera Component
const CameraScreen = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const constraints = {
          video: {
            facingMode: 'user',
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          }
        };

        if (isIOS) {
          constraints.video.frameRate = { max: 30 };
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          
          if (isIOS) {
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
          }
          
          try {
            await videoRef.current.play();
          } catch (playError) {
            console.warn('Video play failed:', playError);
          }
        }
      } catch (error) {
        console.error('Camera access failed:', error);
        setHasCamera(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        onCapture(blob);
      }, 'image/jpeg', 0.8);
    }
  };

  if (!hasCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center p-4">
          <h3 className="text-xl mb-4">Camera not available</h3>
          <p className="mb-4">Please check camera permissions or try again.</p>
          <button 
            onClick={onClose}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-8">
        <button
          onClick={onClose}
          className="bg-gray-600 text-white p-4 rounded-full"
        >
          ✕
        </button>
        <button
          onClick={capturePhoto}
          className="bg-white p-6 rounded-full border-4 border-gray-300"
        >
          <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
        </button>
      </div>
    </div>
  );
};

// Updated Navigation Component with Professional Icons and Styling
const Navigation = ({ activeTab, setActiveTab, notifications, onPhotoClick }) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const tabs = [
    { id: 'feed', icon: '🏠', label: 'Home' },
    { id: 'groups', icon: '👥', label: 'Groups' },
    { id: 'photo', icon: '📷', label: 'Photo', special: true },
    { id: 'notifications', icon: '🔔', label: 'Notifications', badge: unreadCount },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-pb">
      <div className="flex justify-around items-center py-2 px-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.id === 'photo' ? onPhotoClick() : setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center relative transition-all duration-200 ${
              tab.special 
                ? 'bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14 shadow-lg transform hover:scale-105' 
                : `flex-1 py-2 px-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    activeTab === tab.id 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`
            }`}
          >
            <span className={`${tab.special ? 'text-xl' : 'text-lg'} transition-transform duration-200 ${
              !tab.special && activeTab === tab.id ? 'scale-110' : ''
            }`}>
              {tab.icon}
            </span>
            {!tab.special && (
              <span className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                activeTab === tab.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-500'
              }`}>
                {tab.label}
              </span>
            )}
            {tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md animate-pulse">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
            {!tab.special && activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Enhanced FeedScreen with Global Challenge Integration
const FeedScreen = ({ user }) => {
  // Group-based feed state
  const [feed, setFeed] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  
  // Global challenge state  
  const [currentGlobalChallenge, setCurrentGlobalChallenge] = useState(null);
  const [globalFeedData, setGlobalFeedData] = useState(null);
  const [globalSubmissions, setGlobalSubmissions] = useState([]);
  const [userVotes, setUserVotes] = useState(new Set());
  const [sortOrder, setSortOrder] = useState('recent');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadAllContent();
    
    // Listen for camera open event from navigation
    const handleOpenCamera = () => {
      setShowCamera(true);
    };
    
    window.addEventListener('openCamera', handleOpenCamera);
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      if (!refreshing) {
        refreshAllContent();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('openCamera', handleOpenCamera);
      clearInterval(interval);
    };
  }, [user]);

  const loadAllContent = async () => {
    setLoading(true);
    await Promise.all([
      loadGlobalChallenge(),
      loadGlobalFeed(),
      loadGroupFeed(),
      loadUserGroups()
    ]);
    setLoading(false);
  };

  const refreshAllContent = async () => {
    setRefreshing(true);
    await Promise.all([
      loadGlobalChallenge(),
      loadGlobalFeed(),
      loadGroupFeed()
    ]);
    setRefreshing(false);
  };

  // Global challenge functions
  const loadGlobalChallenge = async () => {
    try {
      const response = await axios.get(`${API}/global-challenges/current`);
      setCurrentGlobalChallenge(response.data);
    } catch (error) {
      console.error('Failed to load global challenge:', error);
    }
  };

  const loadGlobalFeed = async (friendsOnly = false) => {
    try {
      const response = await axios.get(`${API}/global-feed?user_id=${user.id}&friends_only=${friendsOnly}`);
      setGlobalFeedData(response.data);
      
      if (response.data.status === 'unlocked' && response.data.submissions) {
        const sortedSubmissions = sortSubmissions(response.data.submissions, sortOrder);
        setGlobalSubmissions(sortedSubmissions);
      }
    } catch (error) {
      console.error('Failed to load global feed:', error);
    }
  };

  // Group feed functions
  const loadGroupFeed = async () => {
    try {
      const response = await axios.get(`${API}/submissions/feed?user_id=${user.id}`);
      setFeed(response.data);
    } catch (error) {
      console.error('Failed to load group feed:', error);
    }
  };

  const loadUserGroups = async () => {
    try {
      const groupPromises = user.groups.map(groupId => 
        axios.get(`${API}/groups/${groupId}`)
      );
      const responses = await Promise.all(groupPromises);
      setUserGroups(responses.map(r => r.data));
    } catch (error) {
      console.error('Failed to load user groups:', error);
    }
  };

  // Global feed helper functions
  const sortSubmissions = (submissionList, order) => {
    if (order === 'top') {
      return [...submissionList].sort((a, b) => {
        const scoreA = a.votes + a.comments.length;
        const scoreB = b.votes + b.comments.length;
        return scoreB - scoreA;
      });
    }
    return [...submissionList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const handleSortChange = (newOrder) => {
    setSortOrder(newOrder);
    if (globalSubmissions.length > 0) {
      const sorted = sortSubmissions(globalSubmissions, newOrder);
      setGlobalSubmissions(sorted);
    }
  };

  const handleGlobalVote = async (submissionId) => {
    try {
      // Optimistic UI update
      const isCurrentlyVoted = userVotes.has(submissionId);
      const optimisticVoteChange = isCurrentlyVoted ? -1 : 1;
      
      // Update UI immediately for better UX
      setGlobalSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, votes: sub.votes + optimisticVoteChange }
            : sub
        )
      );
      
      setUserVotes(prev => {
        const newVotes = new Set(prev);
        if (isCurrentlyVoted) {
          newVotes.delete(submissionId);
        } else {
          newVotes.add(submissionId);
        }
        return newVotes;
      });

      // Make API call
      const formData = new FormData();
      formData.append('user_id', user.id);
      
      const response = await axios.post(`${API}/global-submissions/${submissionId}/vote`, formData);
      
      // Update with actual server response (in case of discrepancy)
      setGlobalSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, votes: response.data.votes }
            : sub
        )
      );
      
      setUserVotes(prev => {
        const newVotes = new Set(prev);
        if (response.data.voted) {
          newVotes.add(submissionId);
        } else {
          newVotes.delete(submissionId);
        }
        return newVotes;
      });
      
    } catch (error) {
      console.error('Failed to vote:', error);
      
      // Revert optimistic update on error
      const revertVoteChange = userVotes.has(submissionId) ? -1 : 1;
      setGlobalSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, votes: sub.votes + revertVoteChange }
            : sub
        )
      );
      
      setUserVotes(prev => {
        const newVotes = new Set(prev);
        if (userVotes.has(submissionId)) {
          newVotes.delete(submissionId);
        } else {
          newVotes.add(submissionId);
        }
        return newVotes;
      });
      
      alert('Failed to vote. Please try again.');
    }
  };

  const handleGlobalComment = async (submissionId, comment) => {
    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('comment', comment);
      
      await axios.post(`${API}/global-submissions/${submissionId}/comment`, formData);
      
      // Refresh to get updated comments
      await loadGlobalFeed();
      setNewComment('');
      
    } catch (error) {
      console.error('Failed to comment:', error);
    }
  };

  // Camera and submission handling
  const handlePhotoCapture = (photoBlob) => {
    setShowCamera(false);
    
    // Priority 1: Global challenge submission
    if (currentGlobalChallenge?.challenge && globalFeedData?.status === 'locked') {
      handleGlobalSubmission(photoBlob);
      return;
    }
    
    // Priority 2: Group submission
    if (user.groups.length > 0) {
      setShowSubmissionForm(true);
      window.capturedPhoto = photoBlob;
      return;
    }
    
    alert('No active challenges to submit to!');
  };

  const handleGlobalSubmission = async (photoBlob) => {
    if (!currentGlobalChallenge?.challenge) {
      alert('No active global challenge to submit to!');
      return;
    }

    const description = prompt('Describe your submission:');
    if (!description) return;

    try {
      const formData = new FormData();
      formData.append('challenge_id', currentGlobalChallenge.challenge.id);
      formData.append('description', description);
      formData.append('user_id', user.id);
      formData.append('photo', photoBlob, 'global-activity.jpg');

      const response = await axios.post(`${API}/global-submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201) {
        alert('Global challenge submission successful! 🎉');
        await loadGlobalFeed(); // Refresh global feed
      }
    } catch (error) {
      console.error('Failed to submit to global challenge:', error);
      alert('Failed to submit to global challenge');
    }
  };

  // Determine what content to display based on priority
  const getDisplayPriority = () => {
    // Priority 1: Active Global Challenge
    if (currentGlobalChallenge?.challenge) {
      if (globalFeedData?.status === 'locked') {
        return 'global_locked';
      } else if (globalFeedData?.status === 'unlocked') {
        return 'global_unlocked';
      }
    }
    
    // Priority 2: Group challenges (when no global challenge)
    if (feed.length > 0 || user.groups.length > 0) {
      return 'group_content';
    }
    
    // Priority 3: No active challenges
    return 'no_challenges';
  };

  // Render functions for different states
  const renderGlobalLockedScreen = () => {
    const challenge = currentGlobalChallenge.challenge;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">Today's Global Challenge</h2>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
            <p className="text-lg font-medium mb-2">{challenge.prompt}</p>
            <p className="text-sm opacity-90">
              Join thousands worldwide in today's challenge
            </p>
          </div>
        </div>

        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={() => setShowCamera(true)}
            className="w-full bg-white text-purple-600 font-bold py-4 px-6 rounded-xl text-lg hover:bg-gray-100 transition-colors"
          >
            📷 Take Your Photo
          </button>
          
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm opacity-90 mb-2">⏰ Submit within {challenge.promptness_window_minutes || 5} minutes to unlock the global feed</p>
            <div className="text-xs opacity-75">
              Act first, see later! 🌍
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGlobalUnlockedFeed = () => {
    return (
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              🌍 Global Challenge
            </h1>
            {refreshing && (
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          
          {currentGlobalChallenge?.challenge && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                "{currentGlobalChallenge.challenge.prompt}"
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {globalFeedData?.friends_only 
                ? `${globalFeedData?.friends_participants || 0} friends participated`
                : `${globalFeedData?.total_participants || 0} participants worldwide`
              }
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleSortChange('recent')}
                className={`px-3 py-1 rounded-full text-xs ${
                  sortOrder === 'recent' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => handleSortChange('top')}
                className={`px-3 py-1 rounded-full text-xs ${
                  sortOrder === 'top' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Top
              </button>
            </div>
          </div>

          {/* Friends/Global Toggle */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => loadGlobalFeed(false)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                !globalFeedData?.friends_only
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              🌍 Global
            </button>
            <button
              onClick={() => loadGlobalFeed(true)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                globalFeedData?.friends_only
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              👥 Friends
            </button>
          </div>
        </div>

        {/* Global Submissions Feed */}
        <div className="space-y-4 p-4">
          {globalSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">
                {globalFeedData?.friends_only ? '👥' : '🌍'}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {globalFeedData?.friends_only ? 'No friends have submitted yet' : 'No submissions yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {globalFeedData?.friends_only 
                  ? 'Be the first among your friends to submit!'
                  : 'Be the first to submit to this challenge!'
                }
              </p>
            </div>
          ) : (
            globalSubmissions.map(submission => (
              <div key={submission.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* User Info */}
                <div className="p-4 pb-2">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getAvatarColor(submission.username) }}
                    >
                      {submission.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {submission.username}
                        {submission.user_id === user.id && (
                          <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatTimeAgo(submission.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Challenge Context */}
                <div className="px-4 pb-2">
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                    <span className="font-medium">Challenge:</span> "{currentGlobalChallenge?.challenge?.prompt}"
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{submission.description}</p>
                </div>

                {/* Photo */}
                {submission.photo_data && (
                  <div className="relative">
                    <img
                      src={`data:image/jpeg;base64,${submission.photo_data}`}
                      alt="Global submission"
                      className="w-full h-64 object-cover cursor-pointer"
                      onClick={() => setExpandedImage(`data:image/jpeg;base64,${submission.photo_data}`)}
                    />
                  </div>
                )}

                {/* Engagement Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleGlobalVote(submission.id)}
                        disabled={submission.user_id === user.id}
                        className={`flex items-center space-x-1 ${
                          submission.user_id === user.id
                            ? 'text-gray-400 cursor-not-allowed'
                            : userVotes.has(submission.id) 
                              ? 'text-purple-600' 
                              : 'text-gray-600 dark:text-gray-400 hover:text-purple-600'
                        }`}
                      >
                        <span className="text-lg">👍</span>
                        <span className="text-sm font-medium">{submission.votes}</span>
                      </button>
                      
                      <button
                        onClick={() => setShowComments(showComments === submission.id ? null : submission.id)}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-purple-600"
                      >
                        <span className="text-lg">💬</span>
                        <span className="text-sm font-medium">{submission.comments?.length || 0}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {showComments === submission.id && (
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                      {submission.comments?.map((comment, idx) => (
                        <div key={idx} className="flex space-x-2 mb-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: getAvatarColor(comment.username) }}
                          >
                            {comment.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{comment.username}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">{comment.comment}</span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex space-x-2 mt-3">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newComment.trim()) {
                              handleGlobalComment(submission.id, newComment.trim());
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newComment.trim()) {
                              handleGlobalComment(submission.id, newComment.trim());
                            }
                          }}
                          className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderGroupContent = () => {
    return (
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Today's Activities
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Share your fitness journey with your groups
          </p>
        </div>

        {/* Group Feed */}
        <div className="space-y-4 p-4">
          {feed.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activities yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Be the first to share your fitness activity!
              </p>
              <button
                onClick={() => setShowCamera(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                📷 Share Activity
              </button>
            </div>
          ) : (
            feed.map(submission => (
              <div key={submission.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: getAvatarColor(submission.username) }}
                  >
                    {submission.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{submission.username}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{submission.challenge_type}</p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(submission.created_at)}</span>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-3">{submission.description}</p>
                
                {submission.photo_url && (
                  <img
                    src={submission.photo_url}
                    alt="Activity"
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => setExpandedImage(submission.photo_url)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderNoChallenges = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="text-6xl mb-6">🎯</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready for Action!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
          Join groups to participate in challenges and connect with fitness enthusiasts worldwide.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('switchToGroups'))}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          👥 Explore Groups
        </button>
      </div>
    );
  };

  // Group submission form component
  const SubmissionForm = () => {
    const [description, setDescription] = useState('');
    const [challengeType, setChallengeType] = useState('Daily Steps Challenge');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedGroup) {
        alert('Please select a group first');
        return;
      }

      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('group_id', selectedGroup.id);
        formData.append('challenge_type', challengeType);
        formData.append('description', description);
        formData.append('user_id', user.id);
        
        if (window.capturedPhoto) {
          formData.append('photo', window.capturedPhoto, 'activity.jpg');
        }

        await axios.post(`${API}/submissions`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setShowSubmissionForm(false);
        setDescription('');
        window.capturedPhoto = null;
        loadGroupFeed();
        alert('Activity submitted successfully!');
      } catch (error) {
        console.error('Failed to submit activity:', error);
        alert('Failed to submit activity');
      }
      setSubmitting(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Submit Activity</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select Group</label>
              <select
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                value={selectedGroup?.id || ''}
                onChange={(e) => {
                  const group = userGroups.find(g => g.id === e.target.value);
                  setSelectedGroup(group);
                }}
                required
              >
                <option value="">Choose a group</option>
                {userGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Challenge Type</label>
              <select
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                value={challengeType}
                onChange={(e) => setChallengeType(e.target.value)}
              >
                <option>Daily Steps Challenge</option>
                <option>Workout Challenge</option>
                <option>Running Challenge</option>
                <option>Strength Training</option>
                <option>Flexibility Challenge</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your activity..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowSubmissionForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Determine content display priority and render accordingly
  const displayPriority = getDisplayPriority();

  return (
    <>
      {displayPriority === 'global_locked' && renderGlobalLockedScreen()}
      {displayPriority === 'global_unlocked' && renderGlobalUnlockedFeed()}
      {displayPriority === 'group_content' && renderGroupContent()}
      {displayPriority === 'no_challenges' && renderNoChallenges()}

      {/* Camera Modal */}
      {showCamera && (
        <CameraScreen
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Group Submission Form Modal */}
      {showSubmissionForm && <SubmissionForm />}

      {/* Image Expansion Modal */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setExpandedImage(null)}>
          <img
            src={expandedImage}
            alt="Expanded view"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

// Groups Screen Component
const GroupsScreen = ({ user }) => {
  const [activeTab, setActiveTab] = useState('discover');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinGroupId, setJoinGroupId] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'discover') {
        const response = await axios.get(`${API}/groups`);
        setGroups(response.data);
      } else if (activeTab === 'my-groups') {
        const groupPromises = user.groups.map(groupId => 
          axios.get(`${API}/groups/${groupId}`)
        );
        const responses = await Promise.all(groupPromises);
        setMyGroups(responses.map(r => r.data));
      } else if (activeTab === 'rankings') {
        const response = await axios.get(`${API}/rankings?user_id=${user.id}`);
        setRankings(response.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      
      await axios.post(`${API}/groups/${groupId}/join`, formData);
      alert('Successfully joined group!');
      loadData();
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('Failed to join group');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('creator_id', user.id);

    try {
      await axios.post(`${API}/groups`, formData);
      setShowCreateForm(false);
      alert('Group created successfully!');
      setActiveTab('my-groups');
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group');
    }
  };

  const quickJoinGroup = async () => {
    if (!joinGroupId.trim()) {
      alert('Please enter a group ID');
      return;
    }
    
    try {
      await handleJoinGroup(joinGroupId.trim());
      setJoinGroupId('');
    } catch (error) {
      alert('Failed to join group. Please check the group ID.');
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Groups</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'discover'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'my-groups'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'rankings'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Rankings
          </button>
        </div>
      </div>

      {/* Quick Join Section */}
      {activeTab === 'discover' && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">Quick Join</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={joinGroupId}
              onChange={(e) => setJoinGroupId(e.target.value)}
              placeholder="Enter group ID..."
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
            />
            <button
              onClick={quickJoinGroup}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        ) : (
          <>
            {/* Discover Tab */}
            {activeTab === 'discover' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Discover Groups</h2>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    + Create Group
                  </button>
                </div>
                
                {groups.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👥</div>
                    <p className="text-gray-600 dark:text-gray-400">No groups available</p>
                  </div>
                ) : (
                  groups.map(group => (
                    <div key={group.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{group.members?.length || 0} members</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{group.description}</p>
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={user.groups.includes(group.id)}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                          user.groups.includes(group.id)
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {user.groups.includes(group.id) ? 'Already Joined' : 'Join Group'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* My Groups Tab */}
            {activeTab === 'my-groups' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Groups</h2>
                
                {myGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👥</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't joined any groups yet</p>
                    <button
                      onClick={() => setActiveTab('discover')}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      Discover Groups
                    </button>
                  </div>
                ) : (
                  myGroups.map(group => (
                    <div key={group.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{group.members?.length || 0} members</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{group.description}</p>
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        ID: {group.id}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Rankings Tab */}
            {activeTab === 'rankings' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rankings</h2>
                
                {rankings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🏆</div>
                    <p className="text-gray-600 dark:text-gray-400">No rankings available yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankings.map((rank, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-purple-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">{rank.username}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{rank.points} points</p>
                          </div>
                          {rank.username === user.username && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Group</h3>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Group Name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  name="description"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  rows="3"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Notifications Screen with Deep Linking
const NotificationsScreen = ({ user, notifications, setNotifications, onNavigate }) => {
  const [loading, setLoading] = useState(false);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API}/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? {...n, read: true} : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle deep linking based on notification type
    if (notification.type === 'global_challenge_drop' || notification.type === 'global_challenge') {
      // Navigate to Home/Today screen to show global challenge
      onNavigate('feed');
      
      // Optional: Show a brief toast message
      setTimeout(() => {
        const toastMessage = "Viewing Global Challenge";
        if (window.showToast) {
          window.showToast(toastMessage);
        }
      }, 500);
    } else if (notification.action_url) {
      // Handle other notification types with action URLs
      onNavigate(notification.action_url.replace('/', ''));
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await Promise.all(
        notifications
          .filter(n => !n.read)
          .map(n => axios.patch(`${API}/notifications/${n.id}/read`))
      );
      
      setNotifications(prev => prev.map(n => ({...n, read: true})));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
    setLoading(false);
  };

  const getNotificationIcon = (notification) => {
    switch (notification.type) {
      case 'global_challenge_drop':
      case 'global_challenge':
        return '🌍';
      case 'group_join':
        return '👥';
      case 'new_submission':
        return '🏃';
      case 'achievement':
        return '🏆';
      case 'new_follower':
        return '👤';
      default:
        return '📢';
    }
  };

  const getNotificationDescription = (notification) => {
    switch (notification.type) {
      case 'global_challenge_drop':
      case 'global_challenge':
        return 'Tap to join the global challenge';
      case 'group_join':
        return 'New group activity';
      case 'new_submission':
        return 'New activity posted';
      case 'achievement':
        return 'Achievement unlocked';
      case 'new_follower':
        return 'New follower';
      default:
        return 'Tap to view';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={loading}
              className="text-sm text-purple-600 dark:text-purple-400 font-medium disabled:opacity-50 hover:underline"
            >
              {loading ? 'Updating...' : 'Mark all read'}
            </button>
          )}
        </div>
        {unreadCount > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 cursor-pointer transition-colors ${
                !notification.read 
                  ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30' 
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'global_challenge_drop' 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                      : 'bg-purple-600'
                  }`}>
                    <span className="text-white text-lg">
                      {getNotificationIcon(notification)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title || notification.message}
                      </p>
                      {notification.title && notification.message !== notification.title && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          {getNotificationDescription(notification)}
                        </p>
                      </div>
                    </div>
                    
                    {!notification.read && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Profile Screen with Friends/Following Features
const ProfileScreen = ({ user, onLogout, darkMode, setDarkMode }) => {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadUserData();
    if (activeTab === 'followers') {
      loadFollowers();
    } else if (activeTab === 'following') {
      loadFollowing();
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const [achievementsRes, statsRes] = await Promise.all([
        axios.get(`${API}/achievements?user_id=${user.id}`),
        axios.get(`${API}/user-stats?user_id=${user.id}`)
      ]);
      
      setAchievements(achievementsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
    setLoading(false);
  };

  const loadFollowers = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/followers`);
      setFollowers(response.data);
    } catch (error) {
      console.error('Failed to load followers:', error);
    }
  };

  const loadFollowing = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/following`);
      setFollowing(response.data);
    } catch (error) {
      console.error('Failed to load following:', error);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const response = await axios.get(`${API}/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.filter(u => u.id !== user.id)); // Exclude current user
    } catch (error) {
      console.error('Failed to search users:', error);
    }
    setSearching(false);
  };

  const handleFollow = async (targetUserId) => {
    try {
      const formData = new FormData();
      formData.append('follower_id', user.id);
      
      await axios.post(`${API}/users/${targetUserId}/follow`, formData);
      
      // Refresh search results to update follow status
      await searchUsers(searchQuery);
      
      // Refresh following list if on following tab
      if (activeTab === 'following') {
        await loadFollowing();
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
      alert('Failed to follow user');
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      const formData = new FormData();
      formData.append('follower_id', user.id);
      
      await axios.post(`${API}/users/${targetUserId}/unfollow`, formData);
      
      // Refresh search results to update follow status
      await searchUsers(searchQuery);
      
      // Refresh following list if on following tab
      if (activeTab === 'following') {
        await loadFollowing();
      }
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      alert('Failed to unfollow user');
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery && activeTab === 'discover') {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, activeTab]);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'following'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'followers'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'discover'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Discover
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'profile' && (
          <>
            {/* Profile Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4">
              <div className="flex items-center space-x-4 mb-6">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: getAvatarColor(user.username) }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.full_name || user.username}</h2>
                  <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Stats */}
              {!loading && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.total_submissions || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Activities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {user.groups?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Groups</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {following.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Friends</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {followers.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Friends</div>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      darkMode ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="text-gray-600 dark:text-gray-400">Loading achievements...</div>
                </div>
              ) : achievements.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="text-gray-600 dark:text-gray-400">No achievements yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border ${
                        achievement.unlocked
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{achievement.icon}</div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          {achievement.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <button
                onClick={onLogout}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </>
        )}

        {activeTab === 'following' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Friends ({following.length})</h2>
            
            {following.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't added any friends yet</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              following.map(user => (
                <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getAvatarColor(user.username) }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{user.full_name || user.username}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnfollow(user.id)}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Followers ({followers.length})</h2>
            
            {followers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-600 dark:text-gray-400">No followers yet</p>
              </div>
            ) : (
              followers.map(user => (
                <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: getAvatarColor(user.username) }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{user.full_name || user.username}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Find Friends</h2>
            
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for friends..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {searchResults.map(user => (
                <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getAvatarColor(user.username) }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{user.full_name || user.username}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFollow(user.id)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
              
              {searchQuery && searchResults.length === 0 && !searching && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-gray-600 dark:text-gray-400">No users found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Main App Component with Robust Authentication
const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Enhanced session validation
  const validateSession = async (userData, sessionId) => {
    try {
      // Check session timestamp (optional - expire sessions after 7 days)
      const authTimestamp = localStorage.getItem('actify_auth_timestamp');
      if (authTimestamp) {
        const sessionAge = Date.now() - parseInt(authTimestamp);
        const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        if (sessionAge > sevenDays) {
          console.log('Session expired');
          handleLogout();
          return false;
        }
      }

      // Validate user data structure
      if (!userData || !userData.id || !userData.username) {
        console.log('Invalid user data');
        handleLogout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      handleLogout();
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setAuthLoading(true);
      
      try {
        const savedUser = localStorage.getItem('actify_user');
        const savedSession = localStorage.getItem('actify_session');
        const savedDarkMode = localStorage.getItem('actify_darkmode') === 'true';
        
        if (savedUser && savedSession) {
          const userData = JSON.parse(savedUser);
          
          // Validate session
          const isValidSession = await validateSession(userData, savedSession);
          
          if (isValidSession) {
            setUser(userData);
            console.log('Session restored for user:', userData.username);
          }
        }
        
        setDarkMode(savedDarkMode);
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleLogout();
      }
      
      setLoading(false);
      setAuthLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem('actify_darkmode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  // Listen for switch to groups event from FeedScreen
  useEffect(() => {
    const handleSwitchToGroups = () => {
      setActiveTab('groups');
    };
    
    window.addEventListener('switchToGroups', handleSwitchToGroups);
    return () => window.removeEventListener('switchToGroups', handleSwitchToGroups);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API}/notifications/${user.id}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      
      // If unauthorized, logout user
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab('feed'); // Always redirect to Home/Today screen after login
    console.log('User logged in successfully:', userData.username);
    
    // Update auth timestamp
    localStorage.setItem('actify_auth_timestamp', new Date().getTime().toString());
  };

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('actify_user');
    localStorage.removeItem('actify_session');
    localStorage.removeItem('actify_auth_timestamp');
    
    // Reset app state
    setUser(null);
    setActiveTab('feed');
    setNotifications([]);
    
    console.log('User logged out');
  };

  const handlePhotoClick = () => {
    // Dispatch camera open event to FeedScreen
    window.dispatchEvent(new Event('openCamera'));
  };

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-medium">Loading ACTIFY...</div>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen onLogin={handleLogin} darkMode={darkMode} />;
  }

  return (
    <BrowserRouter>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
        {/* Main Content */}
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 min-h-screen relative">
          <Routes>
            <Route path="/" element={
              <>
                {activeTab === 'feed' && <FeedScreen user={user} />}
                {activeTab === 'groups' && <GroupsScreen user={user} />}
                {activeTab === 'notifications' && (
                  <NotificationsScreen 
                    user={user} 
                    notifications={notifications}
                    setNotifications={setNotifications}
                    onNavigate={setActiveTab}
                  />
                )}
                {activeTab === 'profile' && (
                  <ProfileScreen 
                    user={user} 
                    onLogout={handleLogout}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                  />
                )}
                
                <Navigation 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab}
                  notifications={notifications}
                  onPhotoClick={handlePhotoClick}
                />
              </>
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;