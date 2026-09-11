from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_products_seeded():
    res = client.get("/products")
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_login_buyer():
    res = client.post("/auth/login", json={"phone": "+992900000001", "password": "password123"})
    assert res.status_code == 200
    assert res.json()["role"] == "buyer"


def test_custom_order_flow():
    artisans = client.get("/artisans")
    assert artisans.status_code == 200
    assert len(artisans.json()) >= 1
    seller_id = artisans.json()[0]["id"]

    login = client.post("/auth/login", json={"phone": "+992900000001", "password": "password123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/custom-orders",
        headers=headers,
        json={
            "seller_id": seller_id,
            "title": "Фармоиши чакан",
            "description": "Андоза M, ранги сурх",
            "reference_image": None,
            "agreed_price": 200,
        },
    )
    assert created.status_code == 200, created.text
    order_id = created.json()["id"]

    listed = client.get("/custom-orders", headers=headers)
    assert listed.status_code == 200
    assert any(o["id"] == order_id for o in listed.json())

    detail = client.get(f"/custom-orders/{order_id}", headers=headers)
    assert detail.status_code == 200

    msg = client.post(
        f"/custom-orders/{order_id}/messages",
        headers=headers,
        json={"body": "Салом, кай тайёр мешавад?"},
    )
    assert msg.status_code == 200

    messages = client.get(f"/custom-orders/{order_id}/messages", headers=headers)
    assert messages.status_code == 200
    assert len(messages.json()) >= 1
