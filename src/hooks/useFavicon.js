import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getGameIcon, defaultIcon } from '../config/gameIcons';

// Convert emoji to favicon SVG data URL
function emojiToFavicon(emoji) {
  return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
}

// Hook to set favicon based on current route
export function useFavicon() {
  const location = useLocation();

  useEffect(() => {
    // Extract game slug from pathname (e.g., "/word-wheel" -> "word-wheel")
    const slug = location.pathname.slice(1) || null;
    const icon = slug ? getGameIcon(slug) : defaultIcon;

    // Find or create the favicon link element
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = emojiToFavicon(icon);
  }, [location.pathname]);
}

export default useFavicon;

