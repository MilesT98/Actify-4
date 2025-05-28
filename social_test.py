import requests
import json
import sys
import time
import random
import string
from datetime import datetime

class ActifySocialTester:
    def __init__(self, base_url="https://640ec078-ed72-4608-8227-9358c4048e06.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_id = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.test_users = []

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
                if files:  # Using multipart/form-data
                    response = requests.post(url, headers=headers, data=data, files=files)
                else:
                    response = requests.post(url, headers=headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            message = f"Status: {response.status_code}"
            if not success:
                message += f" (Expected: {expected_status})"
            message += f", Response: {json.dumps(response_data, indent=2)}"
            
            return self.log_result(test_name, success, message, response_data), response_data
        
        except Exception as e:
            return self.log_result(test_name, False, f"Error: {str(e)}"), None

    def test_login(self, username="testuser", password="password123"):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "login",
            200,
            data={"username": username, "password": password}
        )
        
        if success and response and "session_id" in response:
            self.session_id = response["session_id"]
            self.user = response["user"]
            print(f"✅ Successfully authenticated as {username}")
            return True
        return False

    def test_register_user(self, username=None, password="password123"):
        """Register a new test user"""
        if not username:
            # Generate a random username
            random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
            username = f"testuser_{random_suffix}"
        
        success, response = self.run_test(
            f"Register user {username}",
            "POST",
            "auth/register",
            200,
            data={
                "username": username,
                "password": password,
                "email": f"{username}@example.com",
                "full_name": f"Test User {random_suffix}"
            }
        )
        
        if success:
            print(f"✅ Created test user: {username}")
            self.test_users.append({"username": username, "password": password})
            return username, password
        return None, None

    def test_follow_user(self, target_user_id):
        """Test following a user"""
        data = {"follower_id": self.user["id"]}
        success, response = self.run_test(
            f"Follow user {target_user_id}",
            "POST",
            f"users/{target_user_id}/follow",
            200,
            data=data
        )
        return success, response

    def test_unfollow_user(self, target_user_id):
        """Test unfollowing a user"""
        data = {"follower_id": self.user["id"]}
        success, response = self.run_test(
            f"Unfollow user {target_user_id}",
            "POST",
            f"users/{target_user_id}/unfollow",
            200,
            data=data
        )
        return success, response

    def test_get_followers(self):
        """Test getting user followers"""
        success, response = self.run_test(
            "Get Followers",
            "GET",
            f"users/{self.user['id']}/followers",
            200
        )
        return success, response

    def test_get_following(self):
        """Test getting users being followed"""
        success, response = self.run_test(
            "Get Following",
            "GET",
            f"users/{self.user['id']}/following",
            200
        )
        return success, response

    def test_search_users(self, query="test"):
        """Test searching for users"""
        success, response = self.run_test(
            f"Search Users with query '{query}'",
            "GET",
            f"users/search?q={query}",
            200
        )
        return success, response

    def test_get_global_feed(self, friends_only=False):
        """Test getting the global feed"""
        params = {
            "user_id": self.user["id"],
            "friends_only": "true" if friends_only else "false"
        }
        feed_type = "Friends" if friends_only else "Global"
        success, response = self.run_test(
            f"Get {feed_type} Feed",
            "GET",
            "global-feed",
            200,
            params=params
        )
        return success, response

    def test_get_active_challenge(self):
        """Test getting the active challenge"""
        success, response = self.run_test(
            "Get Active Challenge",
            "GET",
            "global-challenges/current",
            200
        )
        return success, response

    def test_submit_to_challenge(self, challenge_id):
        """Test submitting to a challenge"""
        data = {
            "user_id": self.user["id"],
            "challenge_id": challenge_id,
            "description": f"Test submission at {datetime.now().isoformat()}"
        }
        
        # Create a simple test image
        files = {
            'photo': ('test.jpg', open('/app/frontend/public/logo192.png', 'rb'), 'image/png')
        }
        
        success, response = self.run_test(
            "Submit to Challenge",
            "POST",
            "global-submissions",
            200,
            data=data,
            files=files
        )
        return success, response

    def test_vote_submission(self, submission_id):
        """Test voting on a submission"""
        success, response = self.run_test(
            f"Vote on submission {submission_id}",
            "POST",
            f"global-submissions/{submission_id}/vote",
            200,
            data={"user_id": self.user["id"]}
        )
        return success, response

    def test_comment_submission(self, submission_id):
        """Test commenting on a submission"""
        success, response = self.run_test(
            f"Comment on submission {submission_id}",
            "POST",
            f"global-submissions/{submission_id}/comment",
            200,
            data={
                "user_id": self.user["id"],
                "comment": f"Test comment at {datetime.now().isoformat()}"
            }
        )
        return success, response

def main():
    # Setup
    tester = ActifySocialTester()
    
    print("\n🔍 TESTING ACTIFY SOCIAL FEATURES")
    print("=" * 50)
    
    # 1. Test Authentication
    print("\n📋 Testing Authentication")
    print("-" * 50)
    
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
    
    # Create a second test user for social features
    # We'll skip registration since we don't have that endpoint
    second_username = "testuser2"
    second_password = "password123"
    
    # Save current user info
    main_user_id = tester.user["id"]
    main_username = tester.user["username"]
    
    # 2. Test Social Features
    print("\n📋 Testing Social Features")
    print("-" * 50)
    
    # Search users
    search_success, search_results = tester.test_search_users()
    if search_success:
        print(f"Found {len(search_results)} users in search")
    
    # Test following system with second user
    if second_username:
        # Login as second user
        second_tester = ActifySocialTester()
        if second_tester.test_login(second_username, second_password):
            second_user_id = second_tester.user["id"]
            
            # Second user follows main user
            follow_success, _ = second_tester.test_follow_user(main_user_id)
            if follow_success:
                print(f"✅ User {second_username} successfully followed {main_username}")
                
                # Check followers of main user
                tester.test_login(main_username, "password123")  # Switch back to main user
                followers_success, followers = tester.test_get_followers()
                if followers_success:
                    follower_found = any(f["id"] == second_user_id for f in followers)
                    print(f"✅ Follower relationship verified: {follower_found}")
                
                # Test unfollowing
                second_tester.test_login(second_username, second_password)  # Switch back to second user
                unfollow_success, _ = second_tester.test_unfollow_user(main_user_id)
                if unfollow_success:
                    print(f"✅ User {second_username} successfully unfollowed {main_username}")
    
    # Switch back to main user
    tester.test_login(main_username, "password123")
    
    # 3. Test Global Feed and Friends Toggle
    print("\n📋 Testing Global Feed and Friends Toggle")
    print("-" * 50)
    
    # Get active challenge
    challenge_success, challenge_data = tester.test_get_active_challenge()
    if challenge_success and challenge_data and "challenge" in challenge_data:
        challenge = challenge_data["challenge"]
        challenge_id = challenge["id"]
        print(f"✅ Active challenge found: {challenge['prompt']}")
        
        # Submit to challenge if not already submitted
        feed_success, feed = tester.test_get_global_feed()
        if feed_success and feed.get("status") == "locked":
            submission_success, submission = tester.test_submit_to_challenge(challenge_id)
            if submission_success:
                print(f"✅ Successfully submitted to challenge")
        
        # Test global feed (should be unlocked after submission)
        feed_success, feed = tester.test_get_global_feed()
        if feed_success and feed.get("status") == "unlocked":
            print(f"✅ Global feed unlocked with {feed.get('total_participants')} participants")
            
            # Test friends-only feed
            friends_feed_success, friends_feed = tester.test_get_global_feed(friends_only=True)
            if friends_feed_success:
                print(f"✅ Friends feed has {friends_feed.get('friends_participants')} participants")
            
            # If there are other submissions, test voting
            if "submissions" in feed:
                other_submissions = [s for s in feed["submissions"] if s["user_id"] != tester.user["id"]]
                if other_submissions:
                    other_submission_id = other_submissions[0]["id"]
                    
                    # Test voting
                    vote_success, vote_result = tester.test_vote_submission(other_submission_id)
                    if vote_success:
                        print(f"✅ Successfully voted on submission: {other_submission_id}")
                        
                        # Test voting again (should toggle)
                        vote_again_success, vote_again_result = tester.test_vote_submission(other_submission_id)
                        if vote_again_success:
                            print(f"✅ Successfully toggled vote on submission: {other_submission_id}")
                else:
                    print("⚠️ No other user submissions found to test voting")
    
    # Print results
    print("\n📊 Test Results")
    print("=" * 50)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run} ({tester.tests_passed/tester.tests_run*100:.1f}%)")
    
    # Print summary of test results
    print("\n" + "=" * 50)
    print("SOCIAL FEATURES VERIFICATION")
    print("=" * 50)
    
    if tester.tests_passed == tester.tests_run:
        print("✅ All social feature tests passed!")
    else:
        print(f"❌ Some social feature tests failed ({tester.tests_run - tester.tests_passed} failures)")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())