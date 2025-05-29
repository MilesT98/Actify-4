import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const CameraCapture = ({ onCapture, onClose, darkMode }) => {
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      const video = document.getElementById('camera-video');
      if (video) {
        video.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
      onClose();
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      onCapture(blob);
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full">
        <video
          id="camera-video"
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white p-4 rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            className="bg-white p-6 rounded-full border-4 border-gray-300"
          >
            📷
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthScreen = ({ onLogin, darkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: ''
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
      const endpoint = isLogin ? '/login' : '/users';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      if (isLogin) {
        if (response.data.message === "Login successful") {
          // Secure token storage
          const { user, session_id } = response.data;
          localStorage.setItem('actify_user', JSON.stringify(user));
          localStorage.setItem('actify_session', session_id);
          localStorage.setItem('actify_auth_timestamp', new Date().getTime().toString());
          
          setSuccess('Login successful! Welcome back! 🎉');
          
          // Brief delay to show success message before redirection
          setTimeout(() => {
            onLogin(user);
          }, 500); // Brief delay to show success message
          
        } else {
          setError(response.data.message || response.data.detail || 'Login failed. Please check your credentials.');
        }
      } else {
        setSuccess('Account created successfully! Please log in.');
        setIsLogin(true);
        setFormData({ username: '', password: '', full_name: '', email: '' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      setError(error.response?.data?.detail || error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ACTIFY</h1>
          <p className="text-gray-600 dark:text-gray-300">Transform your fitness journey</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setFormData({ username: '', password: '', full_name: '', email: '' });
            }}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced FeedScreen with Global Challenge Integration and Groups Tab
const FeedScreen = ({ user, onNavigate }) => {
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
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submissionComments, setSubmissionComments] = useState({});
  
  // NEW: Home tab navigation state (Global, Friends, Groups)
  const [homeActiveTab, setHomeActiveTab] = useState('global');

  // Group management functions
  const loadUserGroups = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/groups`);
      setUserGroups(response.data || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadGlobalChallenge = async () => {
    try {
      const response = await axios.get(`${API}/global-challenges/current`);
      setCurrentGlobalChallenge(response.data);
    } catch (error) {
      console.error('Failed to load global challenge:', error);
    }
  };

  const loadGlobalFeed = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API}/global-feed`);
      setGlobalFeedData(response.data);
      
      if (response.data.status === 'unlocked' && response.data.submissions) {
        setGlobalSubmissions(response.data.submissions);
        
        // Load user's votes
        const votesResponse = await axios.get(`${API}/users/${user.id}/votes`);
        setUserVotes(new Set(votesResponse.data.global_submission_ids || []));
      }
    } catch (error) {
      console.error('Failed to load global feed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadComments = async (submissionId) => {
    try {
      const response = await axios.get(`${API}/global-submissions/${submissionId}/comments`);
      setSubmissionComments(prev => ({
        ...prev,
        [submissionId]: response.data
      }));
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        loadUserGroups(),
        loadGlobalChallenge(),
        loadGlobalFeed()
      ]).finally(() => setLoading(false));
    }
  }, [user?.id]);

  const handleVote = async (submissionId, voteType) => {
    try {
      // Optimistic update
      setUserVotes(prev => {
        const newVotes = new Set(prev);
        if (newVotes.has(submissionId)) {
          newVotes.delete(submissionId);
        } else {
          newVotes.add(submissionId);
        }
        return newVotes;
      });

      // Update submission vote count optimistically
      setGlobalSubmissions(prev => prev.map(submission => {
        if (submission.id === submissionId) {
          const isVoted = userVotes.has(submissionId);
          return {
            ...submission,
            vote_count: isVoted ? submission.vote_count - 1 : submission.vote_count + 1
          };
        }
        return submission;
      }));

      await axios.post(`${API}/global-submissions/${submissionId}/vote`, {
        vote_type: voteType,
        user_id: user.id
      });
      
    } catch (error) {
      console.error('Failed to vote:', error);
      // Revert optimistic update on error
      setUserVotes(prev => {
        const newVotes = new Set(prev);
        if (newVotes.has(submissionId)) {
          newVotes.delete(submissionId);
        } else {
          newVotes.add(submissionId);
        }
        return newVotes;
      });
      
      setGlobalSubmissions(prev => prev.map(submission => {
        if (submission.id === submissionId) {
          const wasVoted = !userVotes.has(submissionId);
          return {
            ...submission,
            vote_count: wasVoted ? submission.vote_count - 1 : submission.vote_count + 1
          };
        }
        return submission;
      }));
    }
  };

  const handleComment = async (submissionId) => {
    if (!commentText.trim()) return;

    try {
      await axios.post(`${API}/global-submissions/${submissionId}/comment`, {
        comment: commentText,
        user_id: user.id
      });
      
      setCommentText('');
      setCommentingOn(null);
      await loadComments(submissionId);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    }
  };

  const toggleComments = async (submissionId) => {
    if (submissionComments[submissionId]) {
      setSubmissionComments(prev => {
        const newComments = { ...prev };
        delete newComments[submissionId];
        return newComments;
      });
    } else {
      await loadComments(submissionId);
    }
  };

  const getSortedSubmissions = () => {
    if (!globalSubmissions) return [];
    
    return [...globalSubmissions].sort((a, b) => {
      switch (sortOrder) {
        case 'recent':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'popular':
          return b.vote_count - a.vote_count;
        case 'comments':
          return b.comment_count - a.comment_count;
        default:
          return 0;
      }
    });
  };

  const renderGlobalChallenge = () => {
    if (!currentGlobalChallenge?.challenge) {
      return renderNoChallenges();
    }

    const isLocked = globalFeedData?.status === 'locked';
    const hasUserSubmitted = globalFeedData?.user_has_submitted || false;

    return (
      <div className="space-y-4">
        {/* Challenge Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-2">Today's Global Challenge</h2>
          <p className="text-lg">{currentGlobalChallenge.challenge.prompt}</p>
          <div className="flex items-center mt-3 text-sm opacity-90">
            <span>🕒 {Math.floor(currentGlobalChallenge.time_remaining / 3600)}h {Math.floor((currentGlobalChallenge.time_remaining % 3600) / 60)}m left</span>
          </div>
        </div>

        {/* Lock Screen */}
        {isLocked && !hasUserSubmitted && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Act First, See Later
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Submit your activity to unlock today's global feed and see what others shared!
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-6">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                📸 Capture your moment • ✍️ Share your story • 🌍 Join the global community
              </p>
            </div>
          </div>
        )}

        {/* Global Feed */}
        {globalFeedData?.status === 'unlocked' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Global Feed ({globalSubmissions.length} submissions)
              </h3>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="comments">Most Comments</option>
              </select>
            </div>

            <div className="space-y-4">
              {getSortedSubmissions().map((submission) => (
                <div key={submission.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                        style={{ backgroundColor: submission.user?.avatar_color || '#6366F1' }}
                      >
                        {submission.user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {submission.user?.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {submission.image_url && (
                      <img 
                        src={submission.image_url} 
                        alt="Activity"
                        className="w-full h-64 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{submission.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleVote(submission.id, 'up')}
                          className={`flex items-center space-x-1 ${
                            userVotes.has(submission.id)
                              ? 'text-red-500'
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <span>{userVotes.has(submission.id) ? '❤️' : '🤍'}</span>
                          <span className="text-sm">{submission.vote_count}</span>
                        </button>
                        
                        <button
                          onClick={() => toggleComments(submission.id)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
                        >
                          <span>💬</span>
                          <span className="text-sm">{submission.comment_count}</span>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => setCommentingOn(commentingOn === submission.id ? null : submission.id)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Add Comment
                      </button>
                    </div>
                    
                    {commentingOn === submission.id && (
                      <div className="mt-3 flex space-x-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onKeyPress={(e) => e.key === 'Enter' && handleComment(submission.id)}
                        />
                        <button
                          onClick={() => handleComment(submission.id)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                        >
                          Send
                        </button>
                      </div>
                    )}
                    
                    {submissionComments[submission.id] && (
                      <div className="mt-3 space-y-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        {submissionComments[submission.id].map((comment) => (
                          <div key={comment.id} className="flex space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                              style={{ backgroundColor: comment.user?.avatar_color || '#6366F1' }}
                            >
                              {comment.user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {comment.user?.username}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 ml-2">
                                  {comment.comment}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNoChallenges = () => {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💪</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready for Action!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Join thousands worldwide in today's challenge
        </p>
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-xl">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            🌟 New challenges drop daily at 6 AM • Share your journey • Connect with the global fitness community
          </p>
        </div>
      </div>
    );
  };

  // NEW: Render Groups Tab Content
  const renderGroupsTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Groups</h2>
          <button 
            onClick={() => onNavigate('groups')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Manage Groups
          </button>
        </div>
        
        {userGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Groups Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create or join private groups to share challenges with friends
            </p>
            <button 
              onClick={() => onNavigate('groups')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {userGroups.map((group) => (
              <div key={group.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{group.member_count} members</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{group.description}</p>
                <button 
                  onClick={() => setSelectedGroup(group)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
                >
                  View Group
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* NEW: Home Tab Navigation (Global, Friends, Groups) */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setHomeActiveTab('global')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              homeActiveTab === 'global'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setHomeActiveTab('following')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              homeActiveTab === 'following'
                ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Friends
          </button>
        </div>
      </div>

      {/* Content based on active home tab */}
      <div className="p-4">
        {homeActiveTab === 'global' && renderGlobalChallenge()}
        {homeActiveTab === 'following' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Friends Feed</h3>
            <p className="text-gray-600 dark:text-gray-400">
              See what your friends are up to in challenges
            </p>
          </div>
        )}
        {homeActiveTab === 'groups' && renderGroupsTab()}
      </div>
    </div>
  );
};

// Rest of the components continue with the same implementation...
// [Continuing with other components - GroupsScreen, camera handling, etc.]

const GroupsScreen = ({ user, darkMode }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [createGroupError, setCreateGroupError] = useState('');
  const [createGroupSuccess, setCreateGroupSuccess] = useState('');
  
  // Add discover functionality to Groups section
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Friend management functions within Groups context
  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(`${API}/users/search?q=${encodeURIComponent(query)}`);
      const results = response.data.filter(u => u.id !== user.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      const formData = new FormData();
      formData.append('following_id', targetUserId);
      formData.append('follower_id', user.id);

      await axios.post(`${API}/users/${targetUserId}/follow`, formData);
      
      // Update search results to reflect new follow status
      setSearchResults(prev => prev.map(u => 
        u.id === targetUserId ? {...u, relationship_status: 'following'} : u
      ));
      
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      await axios.delete(`${API}/users/${targetUserId}/unfollow`, {
        data: { follower_id: user.id }
      });
      
      // Update search results
      setSearchResults(prev => prev.map(u => 
        u.id === targetUserId ? {...u, relationship_status: 'none'} : u
      ));
      
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery && showDiscoverModal) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, showDiscoverModal]);

  // Friend management functions within Groups context
  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(`${API}/users/search?q=${encodeURIComponent(query)}`);
      const results = response.data.filter(u => u.id !== user.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      const formData = new FormData();
      formData.append('following_id', targetUserId);
      formData.append('follower_id', user.id);

      await axios.post(`${API}/users/${targetUserId}/follow`, formData);
      
      // Update search results to reflect new follow status
      setSearchResults(prev => prev.map(u => 
        u.id === targetUserId ? {...u, relationship_status: 'following'} : u
      ));
      
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      await axios.delete(`${API}/users/${targetUserId}/unfollow`, {
        data: { follower_id: user.id }
      });
      
      // Update search results
      setSearchResults(prev => prev.map(u => 
        u.id === targetUserId ? {...u, relationship_status: 'none'} : u
      ));
      
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery && showDiscoverModal) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, showDiscoverModal]);

  const loadGroups = async () => {
    try {
      const response = await axios.get(`${API}/users/${user.id}/groups`);
      setGroups(response.data || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    // Validation
    if (!newGroup.name.trim()) {
      setCreateGroupError('Please enter a group name');
      return;
    }

    if (newGroup.name.trim().length < 3) {
      setCreateGroupError('Group name must be at least 3 characters long');
      return;
    }

    if (newGroup.name.trim().length > 50) {
      setCreateGroupError('Group name must be less than 50 characters');
      return;
    }

    if (newGroup.description.trim().length > 200) {
      setCreateGroupError('Description must be less than 200 characters');
      return;
    }

    setCreateGroupLoading(true);
    setCreateGroupError('');

    try {
      const formData = new FormData();
      formData.append('name', newGroup.name.trim());
      formData.append('description', newGroup.description.trim());
      formData.append('category', 'fitness'); // Default category
      formData.append('is_public', 'false'); // Explicitly set as private
      formData.append('user_id', user.id);

      const response = await axios.post(`${API}/groups`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        setCreateGroupSuccess('Group created successfully! 🎉');
        setNewGroup({ name: '', description: '' });
        
        // Immediately refresh groups list and redirect to the new group
        await loadGroups();
        
        // Close form and navigate to the newly created group
        setTimeout(() => {
          setShowCreateForm(false);
          setCreateGroupSuccess('');
          setSelectedGroup(response.data); // Navigate to the new group
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      if (error.response?.status === 409) {
        setCreateGroupError('A group with this name already exists. Please choose a different name.');
      } else if (error.response?.status === 400) {
        setCreateGroupError(error.response.data?.detail || 'Invalid group data. Please check your inputs.');
      } else if (error.response?.status >= 500) {
        setCreateGroupError('Server error. Please try again later.');
      } else {
        setCreateGroupError('Failed to create group. Please check your connection and try again.');
      }
    } finally {
      setCreateGroupLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <GroupDetailScreen 
        group={selectedGroup} 
        user={user} 
        onBack={() => setSelectedGroup(null)}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Groups</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDiscoverModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Discover Friends
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Discover Friends Modal */}
      {showDiscoverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Discover Friends</h2>
              <button
                onClick={() => {
                  setShowDiscoverModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for friends by username..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              {searching && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              )}
              
              {!searching && searchQuery.length >= 2 && (
                <div className="space-y-3">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🔍</div>
                      <p className="text-gray-600 dark:text-gray-400">No users found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    searchResults.map((result) => {
                      const getActionButton = () => {
                        const baseClasses = "px-4 py-2 rounded-lg text-sm transition-colors";
                        
                        if (result.relationship_status === 'friends') {
                          return (
                            <button
                              onClick={() => handleUnfollow(result.id)}
                              className={`${baseClasses} bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400`}
                            >
                              ✓ Friends
                            </button>
                          );
                        } else if (result.relationship_status === 'following') {
                          return (
                            <button
                              onClick={() => handleUnfollow(result.id)}
                              className={`${baseClasses} bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400`}
                            >
                              Following
                            </button>
                          );
                        } else if (result.relationship_status === 'follower') {
                          return (
                            <button
                              onClick={() => handleFollow(result.id)}
                              className={`${baseClasses} bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400`}
                            >
                              Follow Back
                            </button>
                          );
                        } else {
                          return (
                            <button
                              onClick={() => handleFollow(result.id)}
                              className={`${baseClasses} bg-purple-600 text-white hover:bg-purple-700`}
                            >
                              Add Friend
                            </button>
                          );
                        }
                      };

                      return (
                        <div key={result.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                                style={{ backgroundColor: result.avatar_color }}
                              >
                                {result.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{result.full_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">@{result.username}</p>
                              </div>
                            </div>
                            {getActionButton()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              
              {searchQuery.length < 2 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Find Friends to Group With</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Search for users to connect and invite to your groups for shared fitness challenges
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discover Friends Modal */}
      {showDiscoverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Discover Friends</h2>
              <button
                onClick={() => {
                  setShowDiscoverModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for friends by username..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              {searching && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              )}
              
              {!searching && searchQuery.length >= 2 && (
                <div className="space-y-3">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🔍</div>
                      <p className="text-gray-600 dark:text-gray-400">No users found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    searchResults.map((result) => {
                      const getActionButton = () => {
                        const baseClasses = "px-4 py-2 rounded-lg text-sm transition-colors";
                        
                        if (result.relationship_status === 'friends') {
                          return (
                            <button
                              onClick={() => handleUnfollow(result.id)}
                              className={`${baseClasses} bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400`}
                            >
                              ✓ Friends
                            </button>
                          );
                        } else if (result.relationship_status === 'following') {
                          return (
                            <button
                              onClick={() => handleUnfollow(result.id)}
                              className={`${baseClasses} bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400`}
                            >
                              Following
                            </button>
                          );
                        } else if (result.relationship_status === 'follower') {
                          return (
                            <button
                              onClick={() => handleFollow(result.id)}
                              className={`${baseClasses} bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400`}
                            >
                              Follow Back
                            </button>
                          );
                        } else {
                          return (
                            <button
                              onClick={() => handleFollow(result.id)}
                              className={`${baseClasses} bg-purple-600 text-white hover:bg-purple-700`}
                            >
                              Add Friend
                            </button>
                          );
                        }
                      };

                      return (
                        <div key={result.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                                style={{ backgroundColor: result.avatar_color }}
                              >
                                {result.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{result.full_name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">@{result.username}</p>
                              </div>
                            </div>
                            {getActionButton()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              
              {searchQuery.length < 2 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Find Friends to Group With</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Search for users to connect and invite to your groups for shared fitness challenges
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Private Group</h2>
            
            {/* Success Message */}
            {createGroupSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {createGroupSuccess}
              </div>
            )}

            {/* Error Message */}
            {createGroupError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {createGroupError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => {
                    setNewGroup({...newGroup, name: e.target.value});
                    setCreateGroupError(''); // Clear error on input change
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter group name (3-50 characters)"
                  maxLength={50}
                  disabled={createGroupLoading}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {newGroup.name.length}/50
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => {
                    setNewGroup({...newGroup, description: e.target.value});
                    setCreateGroupError('');
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe your group (max 200 characters)"
                  rows="3"
                  maxLength={200}
                  disabled={createGroupLoading}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {newGroup.description.length}/200
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  🔒 This will be a private group. Only invited members can see and participate in group activities.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewGroup({ name: '', description: '' });
                    setCreateGroupError('');
                    setCreateGroupSuccess('');
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
                  disabled={createGroupLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={createGroupLoading || !newGroup.name.trim()}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {createGroupLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="p-4">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Groups Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first group to start private challenges with friends
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {group.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>👥 {group.member_count || 1} members</span>
                      <span>📅 Created {new Date(group.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGroup(group)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    View Group
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GroupDetailScreen = ({ group, user, onBack, darkMode }) => {
  const [members, setMembers] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroupData = async () => {
      try {
        const [membersRes, feedRes] = await Promise.all([
          axios.get(`${API}/groups/${group.id}/members`),
          axios.get(`${API}/groups/${group.id}/feed`)
        ]);
        
        setMembers(membersRes.data || []);
        setFeed(feedRes.data || []);
      } catch (error) {
        console.error('Failed to load group data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [group.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="mr-3 text-purple-600 hover:text-purple-700"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          👥 {members.length} members • 📱 {feed.length} activities
        </div>
      </div>

      <div className="p-4">
        {feed.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Activities Yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Be the first to share an activity in this group!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((activity) => (
              <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                      style={{ backgroundColor: activity.user?.avatar_color || '#6366F1' }}
                    >
                      {activity.user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {activity.user?.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {activity.image_url && (
                    <img 
                      src={activity.image_url} 
                      alt="Activity"
                      className="w-full h-64 object-cover rounded-lg mb-3"
                    />
                  )}
                  
                  <p className="text-gray-700 dark:text-gray-300">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Continue with remaining components - NotificationsScreen, ProfileScreen, etc.
// [The rest of the file continues with existing components with minimal changes...]

const Navigation = ({ activeTab, setActiveTab, notifications, onPhotoClick, darkMode }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex justify-around">
        {[
          { id: 'feed', icon: '🏠', label: 'Home' },
          { id: 'groups', icon: '👥', label: 'Groups' },
          { id: 'photo', icon: '📸', label: 'Photo' },
          { id: 'notifications', icon: '🔔', label: 'Notifications' },
          { id: 'profile', icon: '👤', label: 'Profile' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.id === 'photo' ? onPhotoClick() : setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                : 'text-gray-600 dark:text-gray-400'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            <div className="relative">
              <span className="text-xl">{tab.icon}</span>
              {tab.id === 'notifications' && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const NotificationsScreen = ({ user, notifications, setNotifications, onNavigate }) => {
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await axios.patch(`${API}/notifications/${notification.id}/read`);
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? {...n, read: true} : n
      ));

      // Handle deep linking
      if (notification.type === 'global_challenge_drop' || notification.type === 'global_challenge') {
        onNavigate('feed'); // Navigate to Home screen
      }
    } catch (error) {
      console.error('Failed to handle notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(`${API}/notifications/mark-all-read`, { user_id: user.id });
      setNotifications(prev => prev.map(n => ({...n, read: true})));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No notifications yet</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You'll see updates about challenges and activities here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-4 rounded-xl transition-colors ${
                  notification.read
                    ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    : 'bg-purple-50 dark:bg-purple-900/20 text-gray-900 dark:text-white border-l-4 border-purple-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`font-medium ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                      {notification.title}
                    </p>
                    <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-purple-500 rounded-full ml-2 mt-2"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
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
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadUserData = async () => {
    try {
      const [achievementsRes, statsRes, followingRes, followersRes] = await Promise.all([
        axios.get(`${API}/users/${user.id}/achievements`),
        axios.get(`${API}/users/${user.id}/stats`),
        axios.get(`${API}/users/${user.id}/following`),
        axios.get(`${API}/users/${user.id}/followers`)
      ]);
      
      setAchievements(achievementsRes.data || []);
      setStats(statsRes.data || {});
      setFollowing(followingRes.data || []);
      setFollowers(followersRes.data || []);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
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
      // Filter out current user from results and enhance with relationship status
      const results = response.data.filter(u => u.id !== user.id);
      
      // Add relationship status to each result
      const enhancedResults = await Promise.all(results.map(async (result) => {
        try {
          // Check if user is already following this person
          const isFollowing = following.some(f => f.id === result.id);
          const isFollower = followers.some(f => f.id === result.id);
          
          return {
            ...result,
            is_following: isFollowing,
            is_follower: isFollower,
            is_mutual: isFollowing && isFollower,
            relationship_status: isFollowing && isFollower ? 'friends' : 
                               isFollowing ? 'following' : 
                               isFollower ? 'follower' : 'none'
          };
        } catch (error) {
          return {
            ...result,
            is_following: false,
            is_follower: false,
            is_mutual: false,
            relationship_status: 'none'
          };
        }
      }));
      
      setSearchResults(enhancedResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      const formData = new FormData();
      formData.append('following_id', targetUserId);
      formData.append('follower_id', user.id);

      await axios.post(`${API}/users/${targetUserId}/follow`, formData);
      
      // Refresh following list
      const response = await axios.get(`${API}/users/${user.id}/following`);
      setFollowing(response.data || []);
      
      // Update search results to reflect new follow status
      setSearchResults(prev => prev.map(u => 
        u.id === targetUserId ? {...u, is_following: true} : u
      ));
      
    } catch (error) {
      console.error('Failed to follow user:', error);
      alert('Failed to follow user');
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      await axios.delete(`${API}/users/${targetUserId}/unfollow`, {
        data: { follower_id: user.id }
      });
      
      // Refresh following list
      const response = await axios.get(`${API}/users/${user.id}/following`);
      setFollowing(response.data || []);
      
      // Update search results
      setSearchResults(prev => prev.map(u => 
        u.id === targetUserId ? {...u, is_following: false} : u
      ));
      
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      alert('Failed to unfollow user');
    }
  };

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery && activeTab === 'discover') {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile</h1>
        
        {/* Tab Navigation - FIXED: Removed duplicate "Friends" tab */}
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
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4"
                  style={{ backgroundColor: user.avatar_color }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.full_name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                  <div className="flex items-center mt-2 space-x-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">{following.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Friends</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">{followers.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Friends</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <button
                  onClick={onLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.total_activities || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Activities</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.current_streak || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
              {achievements.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No achievements yet. Keep participating to earn badges! 🏆
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center">
                      <div className="text-2xl mb-1">{achievement.icon}</div>
                      <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                        {achievement.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'following' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Friends ({followers.length})</h2>
              <button
                onClick={() => setActiveTab('discover')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Add Friends
              </button>
            </div>
            {followers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No friends yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connect with people to see their activities and challenges
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {followers.map((friend) => (
                  <div key={friend.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                          style={{ backgroundColor: friend.avatar_color }}
                        >
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{friend.full_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">@{friend.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnfollow(friend.id)}
                        className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Unfollow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Discover Tab */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Discover Groups</h2>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users..."
                className="w-full mt-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            {searching && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            )}
            
            {!searching && searchQuery.length >= 2 && (
              <div className="space-y-3">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-gray-600 dark:text-gray-400">No users found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  searchResults.map((result) => {
                    const getActionButton = () => {
                      const baseClasses = "px-4 py-2 rounded-lg text-sm transition-colors";
                      
                      if (result.relationship_status === 'friends') {
                        return (
                          <button
                            onClick={() => handleUnfollow(result.id)}
                            className={`${baseClasses} bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400`}
                          >
                            ✓ Friends
                          </button>
                        );
                      } else if (result.relationship_status === 'following') {
                        return (
                          <button
                            onClick={() => handleUnfollow(result.id)}
                            className={`${baseClasses} bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400`}
                          >
                            Following
                          </button>
                        );
                      } else if (result.relationship_status === 'follower') {
                        return (
                          <button
                            onClick={() => handleFollow(result.id)}
                            className={`${baseClasses} bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400`}
                          >
                            Follow Back
                          </button>
                        );
                      } else {
                        return (
                          <button
                            onClick={() => handleFollow(result.id)}
                            className={`${baseClasses} bg-purple-600 text-white hover:bg-purple-700`}
                          >
                            Add Friend
                          </button>
                        );
                      }
                    };

                    return (
                      <div key={result.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                              style={{ backgroundColor: result.avatar_color }}
                            >
                              {result.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{result.full_name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">@{result.username}</p>
                            </div>
                          </div>
                          {getActionButton()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            
            {searchQuery.length < 2 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Discover Groups</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Search for users to connect and start your fitness journey together
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [showCamera, setShowCamera] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // NEW: Group creation state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // Feed state for automatic refresh after photo submission
  const [currentGlobalChallenge, setCurrentGlobalChallenge] = useState(null);
  const [globalFeedData, setGlobalFeedData] = useState(null);

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
        // REQUIREMENT 1: Auto-refresh after photo submission
        await loadGlobalFeed(); // Refresh global feed
        await loadGlobalChallenge(); // Refresh challenge data
        // Force UI refresh by updating state
        setActiveTab('feed'); 
      }
    } catch (error) {
      console.error('Failed to submit to global challenge:', error);
      alert('Failed to submit to global challenge');
    }
  };

  // Load functions for auto-refresh
  const loadGlobalChallenge = async () => {
    try {
      const response = await axios.get(`${API}/global-challenges/current`);
      setCurrentGlobalChallenge(response.data);
    } catch (error) {
      console.error('Failed to load global challenge:', error);
    }
  };

  const loadGlobalFeed = async () => {
    try {
      const response = await axios.get(`${API}/global-feed`);
      setGlobalFeedData(response.data);
    } catch (error) {
      console.error('Failed to load global feed:', error);
    }
  };

  // Determine what content to display based on priority
  const getDisplayPriority = () => {
    // Priority 1: Active Global Challenge
    if (currentGlobalChallenge?.challenge) {
      return 'global_challenge';
    }
    
    // Priority 2: User Groups Content
    if (feed.length > 0 || user.groups.length > 0) {
      return 'groups';
    }
    
    // Priority 3: No active content
    return 'no_challenges';
  };

  // Initialize user and load data
  useEffect(() => {
    const initializeApp = async () => {
      // Check for stored authentication
      const storedUser = localStorage.getItem('actify_user');
      const storedSession = localStorage.getItem('actify_session');
      const authTimestamp = localStorage.getItem('actify_auth_timestamp');
      
      if (storedUser && storedSession && authTimestamp) {
        try {
          const userData = JSON.parse(storedUser);
          const sessionAge = Date.now() - parseInt(authTimestamp);
          
          // Check if session is still valid (24 hours)
          if (sessionAge < 24 * 60 * 60 * 1000) {
            // Validate session with backend
            const isValid = await validateSession(storedSession);
            if (isValid) {
              setUser(userData);
              console.log('Session restored for user:', userData.username);
            }
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          handleLogout();
        }
      }
    };

    initializeApp();
  }, []);

  // Session validation
  const validateSession = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/validate-session/${sessionId}`);
      return response.status === 200;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  };

  // Load notifications
  useEffect(() => {
    if (user?.id) {
      const loadNotifications = async () => {
        try {
          const response = await axios.get(`${API}/notifications/${user.id}`);
          setNotifications(response.data || []);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      };

      loadNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // User authentication handlers
  const handleLogin = (newUser) => {
    setUser(newUser);
    localStorage.setItem('actify_user', JSON.stringify(newUser));
    localStorage.setItem('actify_auth_timestamp', new Date().getTime().toString());
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('feed');
    setNotifications([]);
    localStorage.removeItem('actify_user');
    localStorage.removeItem('actify_session');
    localStorage.removeItem('actify_auth_timestamp');
  };

  // If not logged in, show auth screen
  if (!user) {
    return <AuthScreen onLogin={handleLogin} darkMode={darkMode} />;
  }

  return (
    <div className={`${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white dark:bg-gray-900 shadow-lg">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'feed' && <FeedScreen user={user} />}
          {activeTab === 'groups' && <GroupsScreen user={user} darkMode={darkMode} />}
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
        </div>

        {/* Navigation */}
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          notifications={notifications}
          onPhotoClick={() => setShowCamera(true)}
          darkMode={darkMode} 
        />
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture 
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default App;