"""
Tests for Vipps webhook endpoint.

Run with: pytest tests/test_webhooks.py -v
Or run specific test: pytest tests/test_webhooks.py::test_payment_successful -v

Quick manual test: python3 tests/test_webhooks.py PRL-XXXX
"""

# Quick manual test script - runs before heavy imports
if __name__ == "__main__":
    import sys
    import requests
    import os
    from dotenv import load_dotenv

    if len(sys.argv) < 2:
        print("Usage: python3 tests/test_webhooks.py <order_number>")
        print("Example: python3 tests/test_webhooks.py PRL-A3X9")
        sys.exit(1)

    order_number = sys.argv[1]
    base_url = "http://127.0.0.1:8000"

    load_dotenv()
    secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")

    payload = {
        "reference": order_number,
        "sessionState": "PaymentSuccessful",
        "shippingDetails": {
            "firstName": "Test",
            "lastName": "Bruker",
            "email": "test@example.com",
            "streetAddress": "Testveien 123",
            "postalCode": "0123",
            "city": "Oslo",
            "country": "NO",
            "shippingMethodId": "posten-servicepakke",
            "amount": {"value": 9900, "currency": "NOK"},
            "pickupPoint": {
                "id": "pickup-123",
                "name": "Coop Extra Grünerløkka",
                "address": "Thorvald Meyers gate 56",
                "postalCode": "0555",
                "city": "Oslo",
                "country": "NO"
            }
        }
    }

    print(f"Sending webhook for order: {order_number}")
    print(f"Payload: {payload}")

    response = requests.post(
        f"{base_url}/api/webhooks/vipps",
        headers={"Authorization": secret_key},
        json=payload
    )

    print(f"\nStatus: {response.status_code}")
    print(f"Response: {response.json()}")
    sys.exit(0)

# pytest imports - only loaded when running tests
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import patch, AsyncMock

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.models.order import Order

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def test_db():
    """Create fresh database tables for each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(test_db):
    """Create test client with overridden database"""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_order(test_db):
    """Create a test order in the database"""
    db = TestingSessionLocal()
    order = Order(
        order_number="PRL-TEST",
        status="pending",
        payment_status="pending",
        total_amount=50000,  # 500 NOK in øre
        currency="NOK"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    order_id = order.id
    db.close()
    return {"id": order_id, "order_number": "PRL-TEST"}


class TestVippsWebhook:
    """Test cases for /api/webhooks/vipps endpoint"""

    def test_unauthorized_request(self, client):
        """Test that requests without proper auth are rejected"""
        response = client.post(
            "/api/webhooks/vipps",
            json={"reference": "PRL-TEST", "sessionState": "PaymentSuccessful"}
        )
        assert response.status_code == 401

    def test_invalid_auth_token(self, client):
        """Test that requests with wrong auth token are rejected"""
        response = client.post(
            "/api/webhooks/vipps",
            headers={"Authorization": "wrong-token"},
            json={"reference": "PRL-TEST", "sessionState": "PaymentSuccessful"}
        )
        assert response.status_code == 401

    def test_missing_reference(self, client):
        """Test that requests without reference are rejected"""
        response = client.post(
            "/api/webhooks/vipps",
            headers={"Authorization": settings.SECRET_KEY},
            json={"sessionState": "PaymentSuccessful"}
        )
        assert response.status_code == 400

    def test_order_not_found(self, client, test_db):
        """Test handling of non-existent order"""
        response = client.post(
            "/api/webhooks/vipps",
            headers={"Authorization": settings.SECRET_KEY},
            json={"reference": "PRL-NOTEXIST", "sessionState": "PaymentSuccessful"}
        )
        assert response.status_code == 404

    @patch('app.api.webhooks.email_service.send_email', new_callable=AsyncMock)
    def test_payment_successful(self, mock_email, client, test_order):
        """Test successful payment webhook updates order status"""
        payload = {
            "reference": test_order["order_number"],
            "sessionState": "PaymentSuccessful",
            "shippingDetails": {
                "firstName": "Test",
                "lastName": "User",
                "email": "test@example.com",
                "streetAddress": "Testveien 123",
                "postalCode": "0123",
                "city": "Oslo",
                "country": "NO",
                "shippingMethodId": "posten-servicepakke",
                "amount": {"value": 9900, "currency": "NOK"}
            }
        }

        response = client.post(
            "/api/webhooks/vipps",
            headers={"Authorization": settings.SECRET_KEY},
            json=payload
        )

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

        # Verify order was updated
        db = TestingSessionLocal()
        order = db.query(Order).filter(Order.order_number == "PRL-TEST").first()
        assert order.status == "paid"
        assert order.payment_status == "paid"
        assert order.shipping_method_id == "posten-servicepakke"
        assert order.shipping_amount == 9900
        db.close()

    def test_payment_terminated(self, client, test_order):
        """Test terminated payment webhook updates order status"""
        payload = {
            "reference": test_order["order_number"],
            "sessionState": "PaymentTerminated"
        }

        response = client.post(
            "/api/webhooks/vipps",
            headers={"Authorization": settings.SECRET_KEY},
            json=payload
        )

        assert response.status_code == 200

        # Verify order was updated
        db = TestingSessionLocal()
        order = db.query(Order).filter(Order.order_number == "PRL-TEST").first()
        assert order.status == "cancelled"
        assert order.payment_status == "cancelled"
        db.close()

    def test_session_expired(self, client, test_order):
        """Test expired session webhook updates order status"""
        payload = {
            "reference": test_order["order_number"],
            "sessionState": "SessionExpired"
        }

        response = client.post(
            "/api/webhooks/vipps",
            headers={"Authorization": settings.SECRET_KEY},
            json=payload
        )

        assert response.status_code == 200

        # Verify order was updated
        db = TestingSessionLocal()
        order = db.query(Order).filter(Order.order_number == "PRL-TEST").first()
        assert order.status == "expired"
        assert order.payment_status == "failed"
        db.close()

    @patch('app.api.webhooks.email_service.send_email', new_callable=AsyncMock)
    def test_payment_with_pickup_point(self, mock_email, client, test_order):
        """Test payment with pickup point creates correct addresses"""
        payload = {
            "reference": test_order["order_number"],
            "sessionState": "PaymentSuccessful",
            "shippingDetails": {
                "firstName": "Test",
                "lastName": "User",
                "email": "test@example.com",
                "streetAddress": "Testveien 123",
                "postalCode": "0123",
                "city": "Oslo",
                "country": "NO",
                "shippingMethodId": "posten-pickup",
                "amount": {"value": 0, "currency": "NOK"},
                "pickupPoint": {
                    "id": "pickup-123",
                    "name": "Coop Extra Grünerløkka",
                    "address": "Thorvald Meyers gate 56",
                    "postalCode": "0555",
                    "city": "Oslo",
                    "country": "NO"
                }
            }
        }

        response = client.post(
            "/api/webhooks/vipps",
            headers={"Authorization": settings.SECRET_KEY},
            json=payload
        )

        assert response.status_code == 200

        # Verify addresses were created
        from app.models.address import Address
        db = TestingSessionLocal()
        order = db.query(Order).filter(Order.order_number == "PRL-TEST").first()
        addresses = db.query(Address).filter(Address.order_id == order.id).all()

        assert len(addresses) == 2  # shipping + pickup point

        shipping_addr = next((a for a in addresses if a.type == "shipping"), None)
        pickup_addr = next((a for a in addresses if a.type == "pickUpPoint"), None)

        assert shipping_addr is not None
        assert pickup_addr is not None
        assert pickup_addr.name == "Coop Extra Grünerløkka"
        assert pickup_addr.pick_up_point_id == "pickup-123"
        db.close()


