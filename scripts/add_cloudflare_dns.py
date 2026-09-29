#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.error

ZONE_ID = "19b2c7299ac344864f776d1e77baf77b"
DOMAIN = "lonelyguy.tech"
SUBDOMAIN = "morse"
TARGET = "cname.vercel-dns.com"

def add_dns_record(api_token: str):
    url = f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records"
    payload = json.dumps({
        "type": "CNAME",
        "name": SUBDOMAIN,
        "content": TARGET,
        "ttl": 1,
        "proxied": False,
        "comment": "Vercel production deployment alias for Morse Academy"
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_token.strip()}",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("success"):
                print("SUCCESS: CNAME record added successfully!")
                print(f"  {SUBDOMAIN}.{DOMAIN} -> {TARGET}")
                return True
            else:
                print("Cloudflare returned errors:", data.get("errors"))
                return False
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"HTTP {e.code}: {body}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        token = sys.argv[1]
    else:
        token = input("Enter Cloudflare DNS API Token: ").strip()
    if token:
        add_dns_record(token)
    else:
        print("Error: No API token provided.")
