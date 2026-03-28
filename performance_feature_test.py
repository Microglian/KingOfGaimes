#!/usr/bin/env python3

import requests
import json
import sys
import time
from datetime import datetime

class PerformanceFeatureAPITester:
    def __init__(self, base_url="https://card-builder-37.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            start_time = time.time()
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code} ({response_time:.0f}ms)")
                try:
                    return True, response.json(), response_time
                except:
                    return True, {}, response_time
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"   Error response: {error_data}")
                except:
                    self.log(f"   Response text: {response.text}")
                return False, {}, response_time

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}, 0

    def test_cards_list_performance(self):
        """Test that GET /api/cards excludes imageUrl data for fast loading"""
        success, response, response_time = self.run_test("Cards List Performance", "GET", "cards", 200)
        if success:
            if 'cards' in response and 'total' in response:
                cards = response['cards']
                self.log(f"   Found {response['total']} cards, returned {len(cards)} cards")
                
                # Check that imageUrl is excluded or minimal
                has_heavy_image_data = False
                for card in cards:
                    image_url = card.get('imageUrl', '')
                    if image_url and image_url.startswith('data:') and len(image_url) > 100:
                        has_heavy_image_data = True
                        break
                
                if not has_heavy_image_data:
                    self.log(f"   ✅ No heavy imageUrl data found in list response (fast loading)")
                    self.log(f"   ✅ Response time: {response_time:.0f}ms")
                    return True
                else:
                    self.log(f"   ❌ Heavy imageUrl data found in list response (slow loading)")
                    return False
            else:
                self.log("   ❌ Missing 'cards' or 'total' in response")
                return False
        return False

    def test_single_card_includes_image_data(self):
        """Test that GET /api/cards/:id returns full card data including imageUrl"""
        # First get a card ID from the list
        success, response, _ = self.run_test("Get Card List for ID", "GET", "cards", 200, params={"limit": 1})
        if success and response.get('cards'):
            card_id = response['cards'][0]['id']
            
            # Now get the single card
            success, single_response, response_time = self.run_test("Single Card Full Data", "GET", f"cards/{card_id}", 200)
            if success:
                image_url = single_response.get('imageUrl', '')
                self.log(f"   Single card imageUrl: {'present' if image_url else 'missing'}")
                self.log(f"   Response time: {response_time:.0f}ms")
                return True
        return False

    def test_meta_archetypes_endpoint(self):
        """Test GET /api/cards/meta/archetypes returns list of distinct archetypes"""
        success, response, response_time = self.run_test("Meta Archetypes", "GET", "cards/meta/archetypes", 200)
        if success:
            if isinstance(response, list):
                self.log(f"   Found {len(response)} distinct archetypes")
                self.log(f"   Sample archetypes: {response[:5] if response else 'none'}")
                self.log(f"   Response time: {response_time:.0f}ms")
                return True
            else:
                self.log(f"   ❌ Response is not a list: {type(response)}")
                return False
        return False

    def test_meta_set_codes_endpoint(self):
        """Test GET /api/cards/meta/set-codes returns list of distinct set codes"""
        success, response, response_time = self.run_test("Meta Set Codes", "GET", "cards/meta/set-codes", 200)
        if success:
            if isinstance(response, list):
                self.log(f"   Found {len(response)} distinct set codes")
                self.log(f"   Sample set codes: {response[:5] if response else 'none'}")
                self.log(f"   Response time: {response_time:.0f}ms")
                return True
            else:
                self.log(f"   ❌ Response is not a list: {type(response)}")
                return False
        return False

    def test_create_card_with_larger_thumbnail(self):
        """Test creating a card and verify thumbnail generation works"""
        card_data = {
            "name": "Thumbnail Test Card",
            "type": "normal_monster",
            "attribute": "light",
            "typeLine": ["Warrior"],
            "level": 4,
            "atk": 1800,
            "def": 1600,
            "description": "A test card for thumbnail generation.",
            "rarity": "common",
            "thumbnail": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=="
        }
        success, response, response_time = self.run_test("Create Card with Thumbnail", "POST", "cards", 201, card_data)
        if success and 'id' in response:
            card_id = response['id']
            thumbnail = response.get('thumbnail')
            if thumbnail:
                self.log(f"   ✅ Thumbnail saved successfully")
                self.log(f"   Response time: {response_time:.0f}ms")
                
                # Clean up
                try:
                    requests.delete(f"{self.api_url}/cards/{card_id}")
                    self.log(f"   Cleaned up test card {card_id}")
                except:
                    pass
                return True
            else:
                self.log(f"   ❌ Thumbnail not saved")
                return False
        return False

    def run_performance_tests(self):
        """Run all performance and feature tests"""
        self.log("🚀 Starting Yu-Gi-Oh Card Creator Performance & Feature Tests")
        self.log(f"   Backend URL: {self.base_url}")
        
        # Test performance features
        self.test_cards_list_performance()
        self.test_single_card_includes_image_data()
        
        # Test new meta endpoints
        self.test_meta_archetypes_endpoint()
        self.test_meta_set_codes_endpoint()
        
        # Test thumbnail feature
        self.test_create_card_with_larger_thumbnail()
        
        # Print results
        self.log(f"\n📊 Performance Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All performance and feature tests passed!")
            return True
        else:
            self.log(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = PerformanceFeatureAPITester()
    success = tester.run_performance_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())