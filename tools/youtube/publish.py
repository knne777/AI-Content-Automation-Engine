import os
import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
from googleapiclient.http import MediaFileUpload

scopes = ["https://www.googleapis.com/auth/youtube.upload"]

def get_authenticated_service():
    api_service_name = "youtube"
    api_version = "v3"
    client_secrets_file = "client_secret.json"
    
    if not os.path.exists(client_secrets_file):
        raise FileNotFoundError(f"{client_secrets_file} not found. Please download it from Google Cloud Console.")

    flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(client_secrets_file, scopes)
    credentials = flow.run_local_server(port=0)
    youtube = googleapiclient.discovery.build(api_service_name, api_version, credentials=credentials)
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

