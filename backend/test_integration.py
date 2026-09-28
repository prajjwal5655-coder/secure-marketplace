import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def post_json(url, data, token=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            **({'Authorization': f'Bearer {token}'} if token else {})
        }
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def get_json(url, token=None):
    req = urllib.request.Request(
        url,
        headers={'Authorization': f'Bearer {token}'} if token else {}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def patch_json(url, data, token=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8') if data else b'',
        headers={
            'Content-Type': 'application/json',
            **({'Authorization': f'Bearer {token}'} if token else {})
        },
        method='PATCH'
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def delete_req(url, token=None):
    req = urllib.request.Request(
        url,
        headers={'Authorization': f'Bearer {token}'} if token else {},
        method='DELETE'
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def run_tests():
    print("--- 1. Testing Vendor & Buyer Registration ---")
    ts = int(time.time())
    vendor_username = f"vendor_{ts}"
    buyer_username = f"buyer_{ts}"

    vendor = post_json(f"{BASE_URL}/api/auth/register", {
        "username": vendor_username,
        "email": f"{vendor_username}@test.com",
        "password": "Password123!",
        "role": "seller"
    })
    print("Vendor registered:", vendor["username"], "Token:", vendor["token"][:10])

    buyer = post_json(f"{BASE_URL}/api/auth/register", {
        "username": buyer_username,
        "email": f"{buyer_username}@test.com",
        "password": "Password123!",
        "role": "buyer"
    })
    print("Buyer registered:", buyer["username"], "Token:", buyer["token"][:10])

    print("\n--- 2. Testing Vendor Product Listing & Out of Stock / Delete ---")
    new_item = post_json(f"{BASE_URL}/api/items", {
        "title": "Encrypted Flash Drive 128GB",
        "price": "10",
        "currency": "CULT",
        "state": "Available",
        "desc": "Hardware encrypted USB with password keypad."
    }, token=vendor["token"])
    item_id = new_item["id"]
    print("Item created with ID:", item_id, "State:", new_item["state"])

    # Toggle stock to Out of Stock
    toggled = patch_json(f"{BASE_URL}/api/items/{item_id}/toggle-stock", {}, token=vendor["token"])
    print("Toggled stock state:", toggled["state"])
    assert toggled["state"] == "Out of Stock"

    # Toggle back to Available
    toggled_back = patch_json(f"{BASE_URL}/api/items/{item_id}/toggle-stock", {}, token=vendor["token"])
    print("Toggled back state:", toggled_back["state"])
    assert toggled_back["state"] == "Available"

    print("\n--- 3. Testing Wallet Top-up with 12-Digit UTR ---")
    utr_number = f"{int(time.time())}"[:10] + "12"
    topup_res = post_json(f"{BASE_URL}/api/wallet/topup", {
        "username": buyer_username,
        "amount": 25.0,
        "utr_ref": utr_number
    }, token=buyer["token"])
    print("Wallet top-up successful! New balance:", topup_res["cultBalance"], "CULT")
    assert topup_res["cultBalance"] == 25.0

    # Verify duplicate UTR is blocked
    try:
        post_json(f"{BASE_URL}/api/wallet/topup", {
            "username": buyer_username,
            "amount": 25.0,
            "utr_ref": utr_number
        }, token=buyer["token"])
        print("ERROR: Duplicate UTR was NOT blocked!")
    except Exception as e:
        print("Duplicate UTR correctly rejected by security:", str(e))

    print("\n--- 4. Testing Order with Cult Wallet Balance Deduction ---")
    order_id = f"NEX-{int(time.time()) % 1000000}"
    order_data = {
        "id": order_id,
        "username": buyer_username,
        "items": [{
            "id": item_id,
            "title": "Encrypted Flash Drive 128GB",
            "price": "10",
            "seller": vendor_username,
            "qty": 1
        }],
        "total": "10",
        "shipping": {
            "fullName": "Test Buyer",
            "phone": "+91 9876543210",
            "address": "Room 101, Block A",
            "city": "Campus",
            "postalCode": "201310",
            "country": "India"
        },
        "paymentMethod": "cult_wallet",
        "timestamp": "2026-09-28 22:30:00",
        "status": "Escrow Locked / Processing"
    }

    order_res = post_json(f"{BASE_URL}/api/orders", order_data, token=buyer["token"])
    print("Order placed with CULT wallet:", order_res)

    # Check updated balance
    bal = get_json(f"{BASE_URL}/api/wallet/{buyer_username}", token=buyer["token"])
    print("Buyer balance after order (25 - 10):", bal["cultBalance"], "CULT")
    assert bal["cultBalance"] == 15.0

    print("\n--- 5. Testing Order with Direct Offline Cash Payment to Vendor ---")
    cod_order_id = f"NEX-{int(time.time() + 1) % 1000000}"
    cod_order_data = {
        "id": cod_order_id,
        "username": buyer_username,
        "items": [{
            "id": item_id,
            "title": "Encrypted Flash Drive 128GB",
            "price": "10",
            "seller": vendor_username,
            "qty": 1
        }],
        "total": "10",
        "shipping": {
            "fullName": "Test Buyer",
            "phone": "+91 9876543210",
            "address": "Room 101, Block A",
            "city": "Campus",
            "postalCode": "201310",
            "country": "India"
        },
        "paymentMethod": "offline_cash",
        "timestamp": "2026-09-28 22:31:00",
        "status": "Pending Cash on Delivery / Offline Collection"
    }

    cod_res = post_json(f"{BASE_URL}/api/orders", cod_order_data, token=buyer["token"])
    print("COD Order placed:", cod_res)
    # Balance should stay 15.0 (no deduction for cash)
    bal2 = get_json(f"{BASE_URL}/api/wallet/{buyer_username}", token=buyer["token"])
    print("Buyer balance after COD order (still 15):", bal2["cultBalance"], "CULT")
    assert bal2["cultBalance"] == 15.0

    print("\n--- 6. Testing Vendor Incoming Sales & Notifications ---")
    vendor_sales = get_json(f"{BASE_URL}/api/vendor/orders/{vendor_username}", token=vendor["token"])
    print("Vendor received sales count:", len(vendor_sales))
    assert len(vendor_sales) >= 2

    notifs = get_json(f"{BASE_URL}/api/notifications/{vendor_username}", token=vendor["token"])
    print("Vendor received notifications count:", len(notifs))
    assert len(notifs) >= 2
    print("First notification message:", notifs[0]["message"])

    print("\n--- 7. Testing Order Status Update by Vendor ---")
    updated_status = patch_json(f"{BASE_URL}/api/orders/{cod_order_id}/status", {
        "status": "Delivered & Paid (Completed)"
    }, token=vendor["token"])
    print("Vendor updated status:", updated_status)
    assert updated_status["new_status"] == "Delivered & Paid (Completed)"

    print("\n--- 8. Testing Product Deletion ---")
    del_res = delete_req(f"{BASE_URL}/api/items/{item_id}", token=vendor["token"])
    print("Product deletion result:", del_res)

    print("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
