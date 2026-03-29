"""
Test new card types and spell subtypes for Yu-Gi-Oh Card Creator
- Red Monster type
- Token type
- Fusion spell subtype
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://card-builder-37.preview.emergentagent.com').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def cleanup_cards(api_client):
    """Cleanup TEST_ prefixed cards after test"""
    created_ids = []
    yield created_ids
    for card_id in created_ids:
        try:
            api_client.delete(f"{BASE_URL}/api/cards/{card_id}")
        except:
            pass

class TestNewCardTypes:
    """Test new card types: Red Monster and Token"""
    
    def test_create_red_monster(self, api_client, cleanup_cards):
        """Test creating a Red Monster card"""
        card_data = {
            "name": "TEST_Red Dragon Archfiend",
            "type": "red_monster",
            "attribute": "dark",
            "typeLine": ["Dragon", "Synchro", "Effect"],
            "level": 8,
            "atk": 3000,
            "def": 2000,
            "description": "A powerful red dragon monster.",
            "rarity": "ultra_rare"
        }
        response = api_client.post(f"{BASE_URL}/api/cards", json=card_data)
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        data = response.json()
        assert data["type"] == "red_monster"
        assert data["name"] == "TEST_Red Dragon Archfiend"
        assert "id" in data
        
        cleanup_cards.append(data["id"])
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/cards/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["type"] == "red_monster"
    
    def test_create_token_monster(self, api_client, cleanup_cards):
        """Test creating a Token card"""
        card_data = {
            "name": "TEST_Sheep Token",
            "type": "token_monster",
            "attribute": "earth",
            "typeLine": ["Beast", "Token"],
            "level": 1,
            "atk": 0,
            "def": 0,
            "description": "This card can be used as a Sheep Token.",
            "rarity": "common"
        }
        response = api_client.post(f"{BASE_URL}/api/cards", json=card_data)
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        data = response.json()
        assert data["type"] == "token_monster"
        assert data["name"] == "TEST_Sheep Token"
        assert "id" in data
        
        cleanup_cards.append(data["id"])
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/cards/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["type"] == "token_monster"


class TestFusionSpellType:
    """Test Fusion spell subtype"""
    
    def test_create_fusion_spell(self, api_client, cleanup_cards):
        """Test creating a Fusion spell card"""
        card_data = {
            "name": "TEST_Polymerization",
            "type": "spell",
            "attribute": "spell",
            "spellTrapType": "fusion",
            "description": "Fusion Summon 1 Fusion Monster from your Extra Deck.",
            "rarity": "common"
        }
        response = api_client.post(f"{BASE_URL}/api/cards", json=card_data)
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        data = response.json()
        assert data["type"] == "spell"
        assert data["spellTrapType"] == "fusion"
        assert data["name"] == "TEST_Polymerization"
        assert "id" in data
        
        cleanup_cards.append(data["id"])
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/cards/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["spellTrapType"] == "fusion"
    
    def test_update_spell_to_fusion_type(self, api_client, cleanup_cards):
        """Test updating a spell card to fusion type"""
        # Create a normal spell first
        card_data = {
            "name": "TEST_Normal Spell",
            "type": "spell",
            "attribute": "spell",
            "spellTrapType": "normal",
            "description": "A normal spell card.",
            "rarity": "common"
        }
        create_response = api_client.post(f"{BASE_URL}/api/cards", json=card_data)
        assert create_response.status_code == 201
        
        card_id = create_response.json()["id"]
        cleanup_cards.append(card_id)
        
        # Update to fusion type
        update_data = {
            "name": "TEST_Normal Spell",
            "type": "spell",
            "attribute": "spell",
            "spellTrapType": "fusion",
            "description": "Now a fusion spell card.",
            "rarity": "common"
        }
        update_response = api_client.put(f"{BASE_URL}/api/cards/{card_id}", json=update_data)
        assert update_response.status_code == 200
        
        updated = update_response.json()
        assert updated["spellTrapType"] == "fusion"
        
        # Verify persistence
        get_response = api_client.get(f"{BASE_URL}/api/cards/{card_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["spellTrapType"] == "fusion"


class TestCardTypeFiltering:
    """Test filtering by new card types"""
    
    def test_filter_by_red_monster_type(self, api_client, cleanup_cards):
        """Test filtering cards by red_monster type"""
        # Create a red monster
        card_data = {
            "name": "TEST_Filter Red Monster",
            "type": "red_monster",
            "attribute": "fire",
            "typeLine": ["Dragon"],
            "level": 6,
            "atk": 2400,
            "def": 2000,
            "description": "Test red monster for filtering.",
            "rarity": "rare"
        }
        create_response = api_client.post(f"{BASE_URL}/api/cards", json=card_data)
        assert create_response.status_code == 201
        cleanup_cards.append(create_response.json()["id"])
        
        # Filter by type
        filter_response = api_client.get(f"{BASE_URL}/api/cards", params={"type": "red_monster"})
        assert filter_response.status_code == 200
        
        data = filter_response.json()
        assert "cards" in data
        assert "total" in data
        # All returned cards should be red_monster type
        for card in data["cards"]:
            assert card["type"] == "red_monster"
    
    def test_filter_by_token_type(self, api_client, cleanup_cards):
        """Test filtering cards by token_monster type"""
        # Create a token
        card_data = {
            "name": "TEST_Filter Token",
            "type": "token_monster",
            "attribute": "light",
            "typeLine": ["Fairy", "Token"],
            "level": 1,
            "atk": 0,
            "def": 0,
            "description": "Test token for filtering.",
            "rarity": "common"
        }
        create_response = api_client.post(f"{BASE_URL}/api/cards", json=card_data)
        assert create_response.status_code == 201
        cleanup_cards.append(create_response.json()["id"])
        
        # Filter by type
        filter_response = api_client.get(f"{BASE_URL}/api/cards", params={"type": "token_monster"})
        assert filter_response.status_code == 200
        
        data = filter_response.json()
        assert "cards" in data
        # All returned cards should be token_monster type
        for card in data["cards"]:
            assert card["type"] == "token_monster"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_cards_list(self, api_client):
        """Test cards list endpoint"""
        response = api_client.get(f"{BASE_URL}/api/cards")
        assert response.status_code == 200
        data = response.json()
        assert "cards" in data
        assert "total" in data
        assert isinstance(data["cards"], list)
        assert isinstance(data["total"], int)
