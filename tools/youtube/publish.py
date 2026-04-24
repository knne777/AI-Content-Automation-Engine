import os
import json
import google_auth_oauthlib.flow
from google.oauth2.credentials import Credentials
import googleapiclient.discovery
import googleapiclient.errors
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

CLIENT_SECRETS_FILE = os.path.join(os.path.dirname(__file__), "client_secret.json")
TOKEN_FILE = os.path.join(os.path.dirname(__file__), "token.json")

def get_auth_url():
    if not os.path.exists(CLIENT_SECRETS_FILE):
        raise FileNotFoundError(f"Missing {CLIENT_SECRETS_FILE}")
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES
    )
    flow.redirect_uri = 'urn:ietf:wg:oauth:2.0:oob'
    auth_url, _ = flow.authorization_url(prompt='consent')
    return auth_url

def exchange_code(code: str):
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES
    )
    flow.redirect_uri = 'urn:ietf:wg:oauth:2.0:oob'
    flow.fetch_token(code=code)
    
    with open(TOKEN_FILE, "w") as f:
        f.write(flow.credentials.to_json())
    return True

def get_authenticated_service():
    if not os.path.exists(TOKEN_FILE):
        raise FileNotFoundError(f"Missing authenticated token. Please authorize first.")
    
    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    youtube = googleapiclient.discovery.build("youtube", "v3", credentials=creds)
    return youtube

def publish_video(file_path: str, title: str, description: str, tags: list = None, category_id: str = "22"):
    youtube = get_authenticated_service()

    request_body = {
        "snippet": {
            "categoryId": category_id,
            "title": title,
            "description": description,
            "tags": tags or []
        },
        "status": {
            "privacyStatus": "private", # Default to private for safety
            "selfDeclaredMadeForKids": False
        }
    }

    media_file = MediaFileUpload(file_path, chunksize=-1, resumable=True)
    request = youtube.videos().insert(
        part="snippet,status",
        body=request_body,
        media_body=media_file
    )

    response = request.execute()
    return response

