import urllib.request
import json
import time

BASE = 'http://127.0.0.1:8000'

def req(url, data=None, token=None, method='GET'):
    r = urllib.request.Request(
        url,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Content-Type': 'application/json', **({'Authorization': f'Bearer {token}'} if token else {})},
        method=method
    )
    with urllib.request.urlopen(r) as res:
        return json.loads(res.read().decode())

def test_security_hardening():
    ts = int(time.time())
    admin_user = f'admin_sec_{ts}'
    buyer_user = f'buyer_sec_{ts}'

    admin = req(f'{BASE}/api/auth/register', {'username': admin_user, 'email': f'{admin_user}@a.com', 'password': 'Pass123!Password', 'role': 'admin'}, method='POST')
    buyer = req(f'{BASE}/api/auth/register', {'username': buyer_user, 'email': f'{buyer_user}@b.com', 'password': 'Pass123!Password', 'role': 'buyer'}, method='POST')

    print('Admin & Buyer registered successfully.')

    # Buyer submits 12-digit UTR
    utr_code = f'{ts}123456'[:12]
    topup = req(f'{BASE}/api/wallet/topup', {'username': buyer_user, 'amount': 15.0, 'utr_ref': utr_code}, token=buyer['token'], method='POST')
    print('Topup submission response:', topup['status'], 'Pending amount:', topup['pendingAmount'], 'Current balance:', topup['cultBalance'])
    assert topup['status'] == 'pending_verification'
    assert topup['cultBalance'] == 0.0

    # Admin views pending UTRs
    pending = req(f'{BASE}/api/admin/utr/pending', token=admin['token'])
    print('Admin retrieved pending UTRs count:', len(pending))
    target_tx = next(tx for tx in pending if tx['username'] == buyer_user)

    # Admin approves UTR
    tx_id = target_tx['id']
    review = req(f'{BASE}/api/admin/utr/{tx_id}/review', {'action': 'APPROVE'}, token=admin['token'], method='PATCH')
    print('Admin review approved:', review)
    assert review['status'] == 'success'

    # Buyer checks balance
    bal = req(f'{BASE}/api/wallet/{buyer_user}', token=buyer['token'])
    print('Buyer verified balance after admin approval:', bal['cultBalance'])
    assert bal['cultBalance'] == 15.0

    print('\n=== ALL SECURITY HARDENING TESTS PASSED! ===')

if __name__ == '__main__':
    test_security_hardening()
