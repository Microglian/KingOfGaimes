#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class YuGiOhCardAPITester:
    def __init__(self, base_url="https://card-builder-37.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_card_ids = []

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"   Error response: {error_data}")
                except:
                    self.log(f"   Response text: {response.text}")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_create_card(self):
        """Test creating a new card"""
        card_data = {
            "name": "Test Dragon",
            "type": "normal_monster",
            "attribute": "fire",
            "typeLine": ["Dragon"],
            "level": 7,
            "atk": 2500,
            "def": 2000,
            "description": "A powerful dragon created for testing purposes.",
            "rarity": "rare"
        }
        success, response = self.run_test("Create Card", "POST", "cards", 201, card_data)
        if success and 'id' in response:
            self.created_card_ids.append(response['id'])
            return response['id']
        return None

    def test_create_card_with_new_fields(self):
        """Test creating a card with new descriptionFontSize and thumbnail fields"""
        card_data = {
            "name": "Test Card with New Fields",
            "type": "effect_monster",
            "attribute": "light",
            "typeLine": ["Warrior", "Effect"],
            "level": 4,
            "atk": 1800,
            "def": 1600,
            "description": "A test card with manual font size and thumbnail.",
            "rarity": "common",
            "descriptionFontSize": 16,
            "thumbnail": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=="
        }
        success, response = self.run_test("Create Card with New Fields", "POST", "cards", 201, card_data)
        if success and 'id' in response:
            self.created_card_ids.append(response['id'])
            # Verify the new fields are returned
            if response.get('descriptionFontSize') == 16 and response.get('thumbnail'):
                self.log("   ✅ New fields (descriptionFontSize, thumbnail) saved and returned correctly")
                return response['id']
            else:
                self.log(f"   ❌ New fields not saved correctly: descriptionFontSize={response.get('descriptionFontSize')}, thumbnail={'present' if response.get('thumbnail') else 'missing'}")
                return None
        return None

    def test_get_cards_list(self):
        """Test getting cards list with total count"""
        success, response = self.run_test("Get Cards List", "GET", "cards", 200)
        if success:
            if 'cards' in response and 'total' in response:
                self.log(f"   Found {response['total']} cards in collection")
                return True
            else:
                self.log("   Missing 'cards' or 'total' in response")
                return False
        return False

    def test_get_single_card(self, card_id):
        """Test getting a single card by ID"""
        if not card_id:
            self.log("❌ Get Single Card - No card ID provided")
            return False
        return self.run_test("Get Single Card", "GET", f"cards/{card_id}", 200)[0]

    def test_update_card(self, card_id):
        """Test updating a card"""
        if not card_id:
            self.log("❌ Update Card - No card ID provided")
            return False
        
        update_data = {
            "name": "Updated Test Dragon",
            "type": "effect_monster",
            "attribute": "fire",
            "typeLine": ["Dragon", "Effect"],
            "level": 8,
            "atk": 3000,
            "def": 2500,
            "description": "An updated powerful dragon with new abilities.",
            "rarity": "super_rare"
        }
        return self.run_test("Update Card", "PUT", f"cards/{card_id}", 200, update_data)[0]

    def test_search_cards(self):
        """Test partial text search"""
        success, response = self.run_test("Search Cards by Name", "GET", "cards", 200, params={"name": "test"})
        if success:
            if 'cards' in response:
                self.log(f"   Search returned {len(response['cards'])} cards")
                return True
            else:
                self.log("   Missing 'cards' in search response")
                return False
        return False

    def test_delete_card(self, card_id):
        """Test deleting a card"""
        if not card_id:
            self.log("❌ Delete Card - No card ID provided")
            return False
        return self.run_test("Delete Card", "DELETE", f"cards/{card_id}", 200)[0]

    def test_export_all_cards(self):
        """Test exporting all cards"""
        success, response = self.run_test("Export All Cards", "GET", "cards/export/all", 200)
        if success:
            if isinstance(response, list):
                self.log(f"   Exported {len(response)} cards")
                return True
            else:
                self.log("   Export response is not a list")
                return False
        return False

    def test_import_cards(self):
        """Test importing multiple cards"""
        import_data = [
            {
                "name": "Import Test Card 1",
                "type": "spell",
                "attribute": "spell",
                "spellTrapType": "normal",
                "description": "A test spell card for import testing.",
                "rarity": "common"
            },
            {
                "name": "Import Test Card 2",
                "type": "trap",
                "attribute": "trap",
                "spellTrapType": "continuous",
                "description": "A test trap card for import testing.",
                "rarity": "uncommon"
            }
        ]
        success, response = self.run_test("Import Cards", "POST", "cards/import", 201, import_data)
        if success:
            if isinstance(response, list) and len(response) == 2:
                self.log(f"   Successfully imported {len(response)} cards")
                # Store IDs for cleanup
                for card in response:
                    if 'id' in card:
                        self.created_card_ids.append(card['id'])
                return True
            else:
                self.log(f"   Import response issue: expected 2 cards, got {len(response) if isinstance(response, list) else 'non-list'}")
                return False
        return False

    def test_xyz_monster_creation(self):
        """Test creating an Xyz monster with rank"""
        xyz_data = {
            "name": "Test Xyz Dragon",
            "type": "xyz_monster",
            "attribute": "dark",
            "typeLine": ["Dragon", "Xyz", "Effect"],
            "rank": 8,
            "atk": 3000,
            "def": 2500,
            "description": "2 Level 8 monsters\nOnce per turn: You can detach 1 material from this card; destroy 1 card on the field.",
            "rarity": "ultra_rare"
        }
        success, response = self.run_test("Create Xyz Monster", "POST", "cards", 201, xyz_data)
        if success and 'id' in response:
            self.created_card_ids.append(response['id'])
            return True
        return False

    def test_link_monster_creation(self):
        """Test creating a Link monster with link rating and arrows"""
        link_data = {
            "name": "Test Link Dragon",
            "type": "link_monster",
            "attribute": "light",
            "typeLine": ["Dragon", "Link", "Effect"],
            "linkRating": 3,
            "linkArrows": ["bottom_left", "bottom", "bottom_right"],
            "atk": 2300,
            "description": "2+ Dragon monsters\nIf this card is Link Summoned: You can add 1 Dragon monster from your Deck to your hand.",
            "rarity": "secret_rare"
        }
        success, response = self.run_test("Create Link Monster", "POST", "cards", 201, link_data)
        if success and 'id' in response:
            self.created_card_ids.append(response['id'])
            return True
        return False

    def test_archetype_filter(self):
        """Test filtering cards by archetype"""
        # First create a card with specific archetype
        card_data = {
            "name": "Blue-Eyes White Dragon",
            "type": "normal_monster",
            "attribute": "light",
            "typeLine": ["Dragon"],
            "level": 8,
            "atk": 3000,
            "def": 2500,
            "description": "This legendary dragon is a powerful engine of destruction.",
            "archetypes": ["Blue-Eyes"],
            "rarity": "ultra_rare"
        }
        success, response = self.run_test("Create Card with Archetype", "POST", "cards", 201, card_data)
        if success and 'id' in response:
            self.created_card_ids.append(response['id'])
            
            # Test archetype filter
            success, filter_response = self.run_test("Filter by Archetype", "GET", "cards", 200, params={"archetype": "Blue-Eyes"})
            if success and 'cards' in filter_response:
                found_cards = [c for c in filter_response['cards'] if 'Blue-Eyes' in c.get('archetypes', [])]
                if found_cards:
                    self.log(f"   Found {len(found_cards)} cards with Blue-Eyes archetype")
                    return True
                else:
                    self.log("   No cards found with Blue-Eyes archetype")
                    return False
        return False

    def test_set_code_filter(self):
        """Test filtering cards by set code"""
        # First create a card with specific set code
        card_data = {
            "name": "Test Set Code Card",
            "type": "normal_monster",
            "attribute": "earth",
            "typeLine": ["Warrior"],
            "level": 4,
            "atk": 1800,
            "def": 1600,
            "description": "A test card with specific set code.",
            "setCode": "LOB",
            "setNumber": "001",
            "rarity": "common"
        }
        success, response = self.run_test("Create Card with Set Code", "POST", "cards", 201, card_data)
        if success and 'id' in response:
            self.created_card_ids.append(response['id'])
            
            # Test set code filter
            success, filter_response = self.run_test("Filter by Set Code", "GET", "cards", 200, params={"setCode": "LOB"})
            if success and 'cards' in filter_response:
                found_cards = [c for c in filter_response['cards'] if c.get('setCode') == 'LOB']
                if found_cards:
                    self.log(f"   Found {len(found_cards)} cards with LOB set code")
                    return True
                else:
                    self.log("   No cards found with LOB set code")
                    return False
        return False

    def test_type_line_filter(self):
        """Test filtering cards by type line content"""
        # First create a card with specific type line
        card_data = {
            "name": "Test Dragon Type Card",
            "type": "effect_monster",
            "attribute": "fire",
            "typeLine": ["Dragon", "Effect"],
            "level": 6,
            "atk": 2400,
            "def": 2000,
            "description": "A dragon-type monster for testing type line filtering.",
            "rarity": "rare"
        }
        success, response = self.run_test("Create Card with Dragon Type", "POST", "cards", 201, card_data)
        if success and 'id' in response:
            self.created_card_ids.append(response['id'])
            
            # Test type line filter
            success, filter_response = self.run_test("Filter by Type Line", "GET", "cards", 200, params={"typeLine": "Dragon"})
            if success and 'cards' in filter_response:
                found_cards = [c for c in filter_response['cards'] if 'Dragon' in c.get('typeLine', [])]
                if found_cards:
                    self.log(f"   Found {len(found_cards)} cards with Dragon in type line")
                    return True
                else:
                    self.log("   No cards found with Dragon in type line")
                    return False
        return False

    def cleanup_created_cards(self):
        """Clean up cards created during testing"""
        self.log("🧹 Cleaning up created test cards...")
        for card_id in self.created_card_ids:
            try:
                requests.delete(f"{self.api_url}/cards/{card_id}")
                self.log(f"   Deleted card {card_id}")
            except:
                self.log(f"   Failed to delete card {card_id}")

    def run_all_tests(self):
        """Run all backend API tests"""
        self.log("🚀 Starting Yu-Gi-Oh Card Creator API Tests")
        self.log(f"   Backend URL: {self.base_url}")
        
        # Test basic API functionality
        self.test_root_endpoint()
        
        # Test card CRUD operations
        card_id = self.test_create_card()
        new_fields_card_id = self.test_create_card_with_new_fields()
        self.test_get_cards_list()
        self.test_get_single_card(card_id)
        self.test_update_card(card_id)
        self.test_search_cards()
        
        # Test import/export
        self.test_export_all_cards()
        self.test_import_cards()
        
        # Test special card types
        self.test_xyz_monster_creation()
        self.test_link_monster_creation()
        
        # Test new filtering functionality
        self.test_archetype_filter()
        self.test_set_code_filter()
        self.test_type_line_filter()
        
        # Test delete (do this last to keep cards for other tests)
        if card_id:
            self.test_delete_card(card_id)
        
        # Print results
        self.log(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All backend API tests passed!")
            return True
        else:
            self.log(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = YuGiOhCardAPITester()
    success = tester.run_all_tests()
    
    # Cleanup
    tester.cleanup_created_cards()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())