import re
import urllib.parse
from flask import Flask, jsonify, render_template
import feedparser
import requests

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_summary(html_content):
    # Remove excessive whitespace, but preserve formatting if needed
    if not html_content:
        return ""
    # Simplify self-closing tags and strip references if any
    return html_content.strip()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/release-notes")
def get_release_notes():
    try:
        # Fetch the feed
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        
        # Parse the feed
        feed = feedparser.parse(response.content)
        
        notes = []
        for entry in feed.entries:
            # Extract basic details
            title = entry.get("title", "No Title")
            link = entry.get("link", "")
            updated = entry.get("updated", entry.get("published", ""))
            
            # The summary contains the HTML content of the release note
            content = entry.get("summary", entry.get("description", ""))
            
            # Extract plain text version for sharing/tweeting
            # We strip HTML tags to make a readable preview text
            plain_text = re.sub(r'<[^>]+>', '', content)
            plain_text = re.sub(r'\s+', ' ', plain_text).strip()
            
            notes.append({
                "id": entry.get("id", link),
                "title": title,
                "link": link,
                "updated": updated,
                "content": clean_html_summary(content),
                "plain_text": plain_text
            })
            
        return jsonify({
            "success": True,
            "feed_title": feed.feed.get("title", "BigQuery Release Notes"),
            "notes": notes
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
