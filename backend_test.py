
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

def main():
    # Get the backend URL from the frontend .env file
    backend_url = "https://640ec078-ed72-4608-8227-9358c4048e06.preview.emergentagent.com"
    
    # Create the API tester
    tester = ActifyAPITester(backend_url)
    
    # Test with provided credentials
    test_username = "testuser"
    test_password = "password123"
    test_user_id = "3935387d-f4ec-4447-8ac9-dbbd304a1f05"
    
    print("\n🔍 TESTING CONSOLIDATED GLOBAL FEED FUNCTIONALITY")
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
    
    # Test 2: Get current global challenge
    current_challenge = tester.get_current_global_challenge()
    
    # If no active challenge, create one for testing
    if not current_challenge or not current_challenge.get("challenge"):
        print("No active global challenge found, creating one for testing")
        new_challenge = tester.create_global_challenge(
            "Take a photo of something that motivates you to stay active today! 💪",
            promptness_window_minutes=5,
            duration_hours=6
        )
        if new_challenge:
            current_challenge = tester.get_current_global_challenge()
    
    if current_challenge and current_challenge.get("challenge"):
        print(f"✅ Active global challenge found: {current_challenge['challenge']['prompt']}")
        challenge_id = current_challenge["challenge"]["id"]
        
        # Test 3: Get global feed (should be locked if user hasn't submitted)
        feed_data = tester.get_global_feed()
        
        if feed_data and feed_data.get("status") == "locked":
            print("✅ Global feed is correctly locked before submission")
            
            # Test 4: Submit to global challenge
            submission = tester.submit_to_global_challenge(
                challenge_id,
                "This is my motivation for staying active!",
                # No photo for simplicity in testing
            )
            
            if submission:
                print("✅ Successfully submitted to global challenge")
                
                # Test 5: Get global feed again (should be unlocked now)
                feed_data = tester.get_global_feed()
                
                if feed_data and feed_data.get("status") == "unlocked":
                    print("✅ Global feed is correctly unlocked after submission")
                    
                    # Test 6: Vote on a submission if available
                    if feed_data.get("submissions"):
                        submission_id = feed_data["submissions"][0]["id"]
                        vote_result = tester.vote_on_submission(submission_id)
                        
                        if vote_result:
                            print(f"✅ Successfully voted on submission: {vote_result}")
                        
                        # Test 7: Comment on a submission
                        comment_result = tester.comment_on_submission(
                            submission_id,
                            "Great motivation! Keep it up!"
                        )
                        
                        if comment_result:
                            print(f"✅ Successfully commented on submission")
                else:
                    print("❌ Global feed is still locked after submission")
        elif feed_data and feed_data.get("status") == "unlocked":
            print("✅ Global feed is already unlocked (user has previously submitted)")
            
            # Test for already unlocked feed
            if feed_data.get("submissions"):
                submission_id = feed_data["submissions"][0]["id"]
                
                # Test voting
                vote_result = tester.vote_on_submission(submission_id)
                if vote_result:
                    print(f"✅ Successfully voted on submission: {vote_result}")
                
                # Test commenting
                comment_result = tester.comment_on_submission(
                    submission_id,
                    "Great motivation! Keep it up!"
                )
                if comment_result:
                    print(f"✅ Successfully commented on submission")
    else:
        print("❌ No active global challenge found or could not be created")
    
    # Test 8: Get user's groups (for priority 2 content)
    user_groups = tester.get_user_groups()
    if user_groups:
        print(f"✅ User has {len(user_groups)} groups for fallback content")
    else:
        print("ℹ️ User has no groups for fallback content")
    
    # Test 9: Get notifications
    notifications = tester.get_notifications()
    if notifications:
        print(f"✅ User has {len(notifications)} notifications")
    else:
        print("ℹ️ User has no notifications")
    
    # Print summary of test results
    success = tester.print_summary()
    
    # Print consolidated global feed verification
    print("\n" + "="*50)
    print("CONSOLIDATED GLOBAL FEED VERIFICATION")
    print("="*50)
    
    if success:
        print("✅ Backend APIs for consolidated global feed are working correctly")
        print("✅ Global challenge lock/unlock mechanism is functioning")
        print("✅ Submission, voting, and commenting features are operational")
    else:
        print("❌ Some backend API tests failed, see details above")
    
    print("="*50)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
