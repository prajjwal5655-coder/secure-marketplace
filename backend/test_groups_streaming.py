import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def post_json(url, data, token=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8') if data else b'{}',
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
        data=json.dumps(data).encode('utf-8') if data else b'{}',
        headers={
            'Content-Type': 'application/json',
            **({'Authorization': f'Bearer {token}'} if token else {})
        },
        method='PATCH'
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def test_groups_and_streaming():
    print("--- 1. Testing Registration for Host & Member ---")
    ts = int(time.time())
    host_username = f"streamhost_{ts}"
    viewer_username = f"viewer_{ts}"

    host = post_json(f"{BASE_URL}/api/auth/register", {
        "username": host_username,
        "email": f"{host_username}@test.com",
        "password": "Password123!",
        "role": "buyer"
    })
    print("Host created:", host["username"])

    viewer = post_json(f"{BASE_URL}/api/auth/register", {
        "username": viewer_username,
        "email": f"{viewer_username}@test.com",
        "password": "Password123!",
        "role": "buyer"
    })
    print("Viewer created:", viewer["username"])

    print("\n--- 2. Testing Group Creation ---")
    grp_res = post_json(f"{BASE_URL}/api/groups", {
        "name": "0Day Security Stream Syndicate",
        "topic": "Live hacking demos and encrypted dark chat"
    }, token=host["token"])
    group_id = grp_res["group"]["id"]
    print("Group created with ID:", group_id, "Name:", grp_res["group"]["name"])
    assert grp_res["group"]["creator"] == host_username

    print("\n--- 3. Testing Member Joining Group ---")
    join_res = post_json(f"{BASE_URL}/api/groups/{group_id}/join", {}, token=viewer["token"])
    print("Viewer joined group! Updated members:", join_res["members"])
    assert viewer_username in join_res["members"]

    print("\n--- 4. Testing Starting Live Video Stream by Host ---")
    stream_on = patch_json(f"{BASE_URL}/api/groups/{group_id}/stream", {
        "is_live": True,
        "stream_title": "Live 0-Day Exploit Stream & Q&A"
    }, token=host["token"])
    print("Host went LIVE:", stream_on)
    assert stream_on["isLive"] is True

    # Verify group list shows live stream
    all_groups = get_json(f"{BASE_URL}/api/groups")
    matched = next((g for g in all_groups if g["id"] == group_id), None)
    assert matched is not None
    assert matched["isLive"] is True
    print("Live stream confirmed in public groups directory:", matched["streamTitle"])

    print("\n--- 5. Testing Ending Live Video Stream ---")
    stream_off = patch_json(f"{BASE_URL}/api/groups/{group_id}/stream", {
        "is_live": False,
        "stream_title": ""
    }, token=host["token"])
    print("Host ended stream:", stream_off)
    assert stream_off["isLive"] is False

    print("\n=== ALL GROUP & LIVE STREAMING INTEGRATION TESTS PASSED! ===")

if __name__ == "__main__":
    test_groups_and_streaming()
