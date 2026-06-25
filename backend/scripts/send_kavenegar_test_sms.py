#!/usr/bin/env python3
"""
Quick one-off tester for Kavenegar SMS send API.

Example:
  python3 backend/scripts/send_kavenegar_test_sms.py \\
    --api-key YOUR_API_KEY \\
    --receptor 09339732325 \\
    --sender 0018018949161 \\
    --message "پیام تست نوبیکس"
"""

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request


def send_sms(api_key: str, receptor: str, sender: str, message: str) -> dict:
    endpoint = f"https://api.kavenegar.com/v1/{api_key}/sms/send.json"
    payload = urllib.parse.urlencode(
        {"receptor": receptor, "sender": sender, "message": message}
    ).encode()
    req = urllib.request.Request(endpoint, data=payload, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        return json.loads(data.decode("utf-8"))


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Send test SMS via Kavenegar.")
    parser.add_argument("--api-key", required=True, help="Kavenegar API key")
    parser.add_argument(
        "--receptor", default="09339732325", help="Destination phone number"
    )
    parser.add_argument(
        "--sender", default="0018018949161", help="Sender line configured in account"
    )
    parser.add_argument(
        "--message", default="Test from Nubix", help="Message text to send"
    )
    args = parser.parse_args(argv)

    try:
        result = send_sms(args.api_key, args.receptor, args.sender, args.message)
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"HTTP error {e.code}: {e.read().decode('utf-8', 'ignore')}\n")
        return 1
    except Exception as exc:  # noqa: BLE001
        sys.stderr.write(f"Error sending SMS: {exc}\n")
        return 1

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
