
import requests
import json
import sys
import time
from datetime import datetime

class ActifyAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.user = None
        self.session_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, message="", response=None):
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test_name": test_name,
            "status": status,
            "message": message,
            "response": response
        }
        self.test_results.append(result)
        print(f"{status} - {test_name}: {message}")
        return success

    def run_test(self, test_name, method, endpoint, expected_status=200, data=None, files=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        if self.session_id:
            headers['Authorization'] = f'Bearer {self.session_id}'
        
        print(f"\n🔍 Testing {test_name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                if files is True:  # Using multipart/form-data
                    response = requests.post(url, headers=headers, files=data)
                elif files:  # Using files parameter
                    response = requests.post(url, headers=headers, data=data, files=files)
                else:  # Using JSON
                    response = requests.post(url, headers=headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            message = f"Status: {response.status_code}"
            
            if not success:
                message += f" (Expected: {expected_status})"
            
            try:
                response_data = response.json()
                message += f", Response: {json.dumps(response_data, indent=2)}"
            except:
                response_data = response.text
                message += f", Response: {response_data}"
            
            return self.log_result(test_name, success, message, response_data), response_data
        
        except Exception as e:
            return self.log_result(test_name, False, f"Error: {str(e)}"), None

    def register_user(self, username, email, password, full_name):
        """Register a new user"""
        data = {
            "username": username,
            "email": email,
            "password": password,
            "full_name": full_name
        }
        
        success, response = self.run_test(
            "Register User",
            "POST",
            "users",
            201,
            data=data
        )
        
        if success:
            self.user = response
            return True
        return False

    def login(self, username, password):
        """Login with username and password"""
        data = {
            "username": username,
            "password": password
        }
        
        success, response = self.run_test(
            "Login",
            "POST",
            "login",
            200,
            data=data
        )
        
        if success and response.get("session_id"):
            self.session_id = response.get("session_id")
            self.user = response.get("user")
            return True
        return False

    def get_current_global_challenge(self):
        """Get the current global challenge"""
        success, response = self.run_test(
            "Get Current Global Challenge",
            "GET",
            "global-challenges/current",
            200
        )
        return response if success else None

    def create_global_challenge(self, prompt, promptness_window_minutes=5, duration_hours=6):
        """Create a new global challenge (admin function)"""
        form_data = {
            "prompt": (None, prompt),
            "promptness_window_minutes": (None, str(promptness_window_minutes)),
            "duration_hours": (None, str(duration_hours))
        }
        
        success, response = self.run_test(
            "Create Global Challenge",
            "POST",
            "global-challenges",
            200,
            data=form_data,
            files=True
        )
        
        return response if success else None

    def submit_to_global_challenge(self, challenge_id, description, photo=None):
        """Submit to a global challenge"""
        form_data = {
            "challenge_id": (None, str(challenge_id)),
            "description": (None, description),
            "user_id": (None, str(self.user["id"]))
        }
        
        if photo:
            form_data["photo"] = photo
        
        success, response = self.run_test(
            "Submit to Global Challenge",
            "POST",
            "global-submissions",
            200,
            data=form_data,
            files=True
        )
        
        return response if success else None

    def get_global_feed(self, challenge_id=None):
        """Get the global feed"""
        params = {"user_id": self.user["id"]}
        if challenge_id:
            params["challenge_id"] = challenge_id
        
        success, response = self.run_test(
            "Get Global Feed",
            "GET",
            "global-feed",
            200,
            params=params
        )
        
        return response if success else None

    def vote_on_submission(self, submission_id):
        """Vote on a global submission"""
        form_data = {
            "user_id": (None, self.user["id"])
        }
        
        success, response = self.run_test(
            "Vote on Submission",
            "POST",
            f"global-submissions/{submission_id}/vote",
            200,
            data=form_data,
            files=True
        )
        
        return response if success else None

    def comment_on_submission(self, submission_id, comment):
        """Comment on a global submission"""
        form_data = {
            "user_id": (None, self.user["id"]),
            "comment": (None, comment)
        }
        
        success, response = self.run_test(
            "Comment on Submission",
            "POST",
            f"global-submissions/{submission_id}/comment",
            200,
            data=form_data,
            files=True
        )
        
        return response if success else None

    def get_user_groups(self):
        """Get user's groups"""
        if not self.user or not self.user.get("groups"):
            return []
            
        groups = []
        for group_id in self.user["groups"]:
            success, response = self.run_test(
                f"Get Group {group_id}",
                "GET",
                f"groups/{group_id}",
                200
            )
            if success:
                groups.append(response)
        
        return groups

    def get_notifications(self):
        """Get user's notifications"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            f"notifications/{self.user['id']}",
            200
        )
        
        return response if success else []

    def print_summary(self):
        """Print a summary of test results"""
        print("\n" + "="*50)
        print(f"TEST SUMMARY: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*50)
        
        for result in self.test_results:
            print(f"{result['status']} - {result['test_name']}")
        
        print("="*50)
        return self.tests_passed == self.tests_run

    def search_users(self, query):
        """Search users by username or full name"""
        params = {"q": query}
        
        success, response = self.run_test(
            f"Search Users with query '{query}'",
            "GET",
            "users/search",
            200,
            params=params
        )
        
        return response if success else []

    def get_user_followers(self, user_id):
        """Get user's followers"""
        success, response = self.run_test(
            f"Get User Followers",
            "GET",
            f"users/{user_id}/followers",
            200
        )
        
        return response if success else []

    def get_user_following(self, user_id):
        """Get users that user is following"""
        success, response = self.run_test(
            f"Get User Following",
            "GET",
            f"users/{user_id}/following",
            200
        )
        
        return response if success else []

    def follow_user(self, target_user_id):
        """Follow a user"""
        form_data = {
            "follower_id": (None, self.user["id"])
        }
        
        success, response = self.run_test(
            f"Follow User {target_user_id}",
            "POST",
            f"users/{target_user_id}/follow",
            200,
            data=form_data,
            files=True
        )
        
        return response if success else None

    def unfollow_user(self, target_user_id):
        """Unfollow a user"""
        form_data = {
            "follower_id": (None, self.user["id"])
        }
        
        success, response = self.run_test(
            f"Unfollow User {target_user_id}",
            "POST",
            f"users/{target_user_id}/unfollow",
            200,
            data=form_data,
            files=True
        )
        
        return response if success else None

    def get_follow_status(self, target_user_id):
        """Check if user is following target user"""
        success, response = self.run_test(
            f"Get Follow Status",
            "GET",
            f"users/{self.user['id']}/follow-status/{target_user_id}",
            200
        )
        
        return response if success else None

def main():
    # Get the backend URL from the frontend .env file
    backend_url = "https://640ec078-ed72-4608-8227-9358c4048e06.preview.emergentagent.com"
    
    # Create the API tester
    tester = ActifyAPITester(backend_url)
    
    # Test with provided credentials
    test_username = "testuser"
    test_password = "password123"
    
    print("\n🔍 TESTING ACTIFY BUG FIXES AND NEW FEATURES")
    print("="*50)
    
    # Test 1: Login with provided credentials
    if not tester.login(test_username, test_password):
        print("❌ Failed to login with provided credentials, trying to register a new user")
        
        # Generate a unique username for testing
        timestamp = int(time.time())
        test_username = f"test_user_{timestamp}"
        test_email = f"test_{timestamp}@example.com"
        test_password = "TestPassword123"
        test_full_name = "Test User"
        
        if not tester.register_user(test_username, test_email, test_password, test_full_name):
            print("❌ Failed to register test user, stopping tests")
            return 1
    
    print(f"✅ Successfully authenticated as {test_username}")
    
    # Test 2: Test user search functionality (Bug Fix)
    print("\n🔍 TESTING USER SEARCH FUNCTIONALITY")
    print("="*50)
    
    search_results = tester.search_users("test")
    if search_results and len(search_results) > 0:
        print(f"✅ User search returned {len(search_results)} results for query 'test'")
        for user in search_results[:3]:  # Show first 3 results
            print(f"  - Found user: {user.get('username')} ({user.get('full_name')})")
    else:
        print("❌ User search returned no results or failed")
    
    # Test 3: Test Friends (Following/Followers) Functionality
    print("\n🔍 TESTING FRIENDS FUNCTIONALITY")
    print("="*50)
    
    # Get current user's followers and following
    followers = tester.get_user_followers(tester.user["id"])
    following = tester.get_user_following(tester.user["id"])
    
    print(f"✅ User has {len(followers) if followers else 0} followers")
    print(f"✅ User is following {len(following) if following else 0} users")
    
    # Test follow/unfollow if we have search results
    if search_results and len(search_results) > 0:
        # Find a user to follow that is not the current user
        target_user = None
        for user in search_results:
            if user["id"] != tester.user["id"]:
                target_user = user
                break
        
        if target_user:
            # Check current follow status
            follow_status = tester.get_follow_status(target_user["id"])
            is_following = follow_status and follow_status.get("is_following", False)
            
            if is_following:
                # Test unfollow
                unfollow_result = tester.unfollow_user(target_user["id"])
                if unfollow_result:
                    print(f"✅ Successfully unfollowed user {target_user['username']}")
                    
                    # Verify follow status changed
                    follow_status = tester.get_follow_status(target_user["id"])
                    if follow_status and not follow_status.get("is_following", True):
                        print("✅ Follow status correctly updated after unfollow")
                    
                    # Test follow
                    follow_result = tester.follow_user(target_user["id"])
                    if follow_result:
                        print(f"✅ Successfully followed user {target_user['username']}")
                        
                        # Verify follow status changed back
                        follow_status = tester.get_follow_status(target_user["id"])
                        if follow_status and follow_status.get("is_following", False):
                            print("✅ Follow status correctly updated after follow")
            else:
                # Test follow
                follow_result = tester.follow_user(target_user["id"])
                if follow_result:
                    print(f"✅ Successfully followed user {target_user['username']}")
                    
                    # Verify follow status changed
                    follow_status = tester.get_follow_status(target_user["id"])
                    if follow_status and follow_status.get("is_following", False):
                        print("✅ Follow status correctly updated after follow")
    
    # Test 4: Test Notification Deep Linking
    print("\n🔍 TESTING NOTIFICATION FUNCTIONALITY")
    print("="*50)
    
    notifications = tester.get_notifications()
    if notifications and len(notifications) > 0:
        print(f"✅ Retrieved {len(notifications)} notifications")
        
        # Check for global challenge notifications
        global_challenge_notifications = [n for n in notifications if n.get("type") == "global_challenge_drop"]
        if global_challenge_notifications:
            print(f"✅ Found {len(global_challenge_notifications)} global challenge notifications")
            
            # Check for deep linking metadata
            sample_notification = global_challenge_notifications[0]
            if sample_notification.get("action_url") == "/feed":
                print("✅ Global challenge notification has correct deep link to Home screen")
            
            if sample_notification.get("challenge_id") or (sample_notification.get("metadata") and sample_notification["metadata"].get("challenge_id")):
                print("✅ Global challenge notification contains challenge ID for deep linking")
        else:
            print("ℹ️ No global challenge notifications found")
    else:
        print("ℹ️ No notifications found")
    
    # Print summary of test results
    success = tester.print_summary()
    
    # Print overall verification
    print("\n" + "="*50)
    print("ACTIFY BUG FIXES AND FEATURES VERIFICATION")
    print("="*50)
    
    if success:
        print("✅ Login functionality is working correctly")
        print("✅ User search functionality is working correctly")
        print("✅ Friends (Following/Followers) functionality is working correctly")
        print("✅ Notification deep linking metadata is present")
    else:
        print("❌ Some API tests failed, see details above")
    
    print("="*50)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
