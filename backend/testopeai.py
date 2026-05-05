import json
import os
import urllib.request
import urllib.error

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise SystemExit("OPENAI_API_KEY environment variable is not set.")

url = "https://api.openai.com/v1/chat/completions"
data = {
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Ping"}],
    "temperature": 0,
}
request = urllib.request.Request(
    url,
    data=json.dumps(data).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    },
    method="POST",
)

try:
    with urllib.request.urlopen(request) as response:
        body = response.read().decode("utf-8")
        parsed = json.loads(body)
        print(json.dumps(parsed, indent=2))
except urllib.error.HTTPError as err:
    error_body = err.read().decode("utf-8")
    print(f"HTTP {err.code} {err.reason}")
    print(error_body)
except Exception as exc:
    print("Request failed:", exc)
