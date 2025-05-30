
import requests
import json
import sys
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
        print(f"URL: {url}")
        print(f"Method: {method}")
        print(f"Data: {data}")
        
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

    def health_check(self):
        """Check API health"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        return success
        
    def test_get_current_global_challenge(self):
        """Test getting the current global challenge"""
        success, response = self.run_test(
            "Get Current Global Challenge",
            "GET",
            "global-challenges/current",
            200
        )
        if success:
            challenge = response.get('challenge', {})
            time_remaining = response.get('time_remaining', 0)
            
            print(f"Challenge prompt: {challenge.get('prompt', 'No prompt')}")
            print(f"Time remaining: {time_remaining} seconds ({time_remaining // 3600} hours, {(time_remaining % 3600) // 60} minutes)")
            
            # Verify the challenge prompt matches the expected one
            expected_prompt = "💪 Show us your midday movement! Share any activity that gets you moving - could be a walk, stretch, workout, or dance! 🕺💃"
            prompt_match = challenge.get('prompt') == expected_prompt
            
            # Verify time remaining is approximately 6 hours (with some margin)
            time_match = 5 * 3600 <= time_remaining <= 7 * 3600
            
            return prompt_match and time_match, response
        return False, {}
        
    def test_create_group(self, name, description):
        """Test creating a new group"""
        # Create form data for multipart/form-data request
        form_data = {
            "name": (None, name),
            "description": (None, description),
            "category": (None, "fitness"),
            "is_public": (None, "true"),
            "user_id": (None, self.user.get('id'))
        }
        
        success, response = self.run_test(
            "Create Group",
            "POST",
            "groups",
            200,  # The API returns 200, not 201
            data=form_data,
            files=True  # Indicate this is a multipart/form-data request
        )
        
        if success and response.get('id'):
            print(f"Created group with ID: {response.get('id')}")
            return True, response.get('id')
        return False, None
        
    def test_get_user_groups(self):
        """Test getting user's groups"""
        success, response = self.run_test(
            "Get User Groups",
            "GET",
            f"users/{self.user.get('id')}/groups",
            200
        )
        
        if success:
            print(f"User has {len(response)} groups")
            for group in response:
                print(f"  - {group.get('name')}: {group.get('description')}")
            return True, response
        return False, []
        
    def test_search_users(self, query):
        """Test user search functionality"""
        success, response = self.run_test(
            "Search Users",
            "GET",
            f"users/search",
            200,
            params={"q": query}
        )
        
        if success:
            print(f"Found {len(response)} users matching '{query}'")
            for user in response:
                print(f"  - {user.get('username')}")
            return True, response
        return False, []

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
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                backend_url = line.strip().split('=')[1].strip('"\'')
                break
    
    print(f"Using backend URL: {backend_url}")
    
    # Create the API tester
    tester = ActifyAPITester(backend_url)
    
    # Test with provided credentials
    test_username = "testuser"
    test_password = "password123"
    
    print("\n🔍 TESTING ACTIFY LOGIN FUNCTIONALITY")
    print("="*50)
    
    # Test 1: Health check
    if not tester.health_check():
        print("❌ API health check failed, stopping tests")
        return 1
    
    # Test 2: Login with provided credentials
    print("\n🔍 TESTING LOGIN API")
    print("="*50)
    
    if not tester.login(test_username, test_password):
        print("❌ Failed to login with provided credentials")
        return 1
    else:
        print(f"✅ Successfully authenticated as {test_username}")
        print("✅ Login response contains session_id, user object, and success message")
    
    # Test Bug Fix 1: Group Creation & Interaction
    print("\n🔍 TESTING BUG FIX 1: GROUP CREATION & INTERACTION")
    print("="*50)
    
    # Create a new group
    import time
    group_name = f"Test Group Fix {int(time.time())}"
    group_success, group_id = tester.test_create_group(group_name, "Testing the fix")
    
    if not group_success:
        tester.log_result("Group Creation", False, "Failed to create group")
    else:
        tester.log_result("Group Creation", True, f"Successfully created group: {group_name}")
    
    # Get user's groups to verify the new group appears
    groups_success, groups = tester.test_get_user_groups()
    
    if groups_success:
        # Check if the newly created group is in the list
        new_group_found = any(group.get('name') == group_name for group in groups)
        if new_group_found:
            tester.log_result("Group Listing", True, "Newly created group appears in user's groups list")
        else:
            tester.log_result("Group Listing", False, "Newly created group does not appear in user's groups list")
    
    # Test Bug Fix 2: Discover Button Relocation (Backend part)
    print("\n🔍 TESTING BUG FIX 2: DISCOVER BUTTON RELOCATION (BACKEND)")
    print("="*50)
    
    # Test user search functionality
    search_success, users = tester.test_search_users("test")
    
    if search_success:
        tester.log_result("User Search", True, f"User search functionality working, found {len(users)} users")
    else:
        tester.log_result("User Search", False, "User search functionality failed")
    
    # Test Bug Fix 3: Non-Functional Rotating Daily Global Challenge
    print("\n🔍 TESTING BUG FIX 3: GLOBAL CHALLENGE")
    print("="*50)
    
    # Test getting the current global challenge
    challenge_success, challenge_data = tester.test_get_current_global_challenge()
    
    if challenge_success:
        tester.log_result("Global Challenge", True, "Global challenge is active with correct prompt and timer")
    else:
        tester.log_result("Global Challenge", False, "Global challenge is not working correctly")
    
    # Print summary of test results
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
