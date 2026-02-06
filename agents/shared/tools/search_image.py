import requests
from typing import Optional
from shared.infrastructure.config.settings import settings


def search_unsplash_image(query: str, per_page: int = 1, orientation: str = "landscape") -> Optional[str]:
    """
    Search for images on Unsplash and return the raw URL of the first result.
    
    Args:
        query (str): Search query for images (e.g., "Tam Coc Vietnam")
        per_page (int): Number of results per page (default: 1)
        orientation (str): Image orientation - "landscape", "portrait", or "squarish" (default: "landscape")
    
    Returns:
        Optional[str]: Raw URL of the first image, or None if no results found or error occurred
    """
    if not settings.UNSPLASH_CLIENT_ID:
        raise ValueError("UNSPLASH_CLIENT_ID is not configured in settings")
    
    url = "https://api.unsplash.com/search/photos"
    
    params = {
        "query": query,
        "per_page": per_page,
        "orientation": orientation
    }
    
    headers = {
        "Authorization": f"Client-ID {settings.UNSPLASH_CLIENT_ID}"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        # Check if we have results
        if data.get("results") and len(data["results"]) > 0:
            # Return the raw URL from the first result
            return data["results"][0]["urls"]["raw"]
        else:
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Error fetching image from Unsplash: {e}")
        return None
