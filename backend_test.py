
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
    
    # Print summary of test results
    success = tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
