/**
 * Render an icon - supports emoji strings, SVG URLs, or React components
 *
 * @param {string|function|React.ReactElement} icon - The icon to render
 * @param {string} className - Optional CSS class for SVG icons
 * @param {string} fallback - Fallback emoji if icon is falsy
 * @returns {React.ReactElement|string} The rendered icon
 */
export function renderIcon(icon, className = '', fallback = '🎮') {
  if (!icon) return fallback;

  if (typeof icon === 'string') {
    // Check if it's an SVG URL/path first (including /api/ paths for community packs)
    // This needs to be checked before raw SVG detection to avoid encoding data: URLs
    if (
      icon.includes('.svg') ||
      icon.startsWith('/assets/') ||
      icon.startsWith('/api/') ||
      icon.startsWith('data:image') ||
      icon.startsWith('http://') ||
      icon.startsWith('https://')
    ) {
      return <img src={icon} alt="" className={className} />;
    }
    
    // Check if it's raw SVG XML content (starts with <svg or contains SVG markup)
    if (icon.trim().startsWith('<svg') || (icon.includes('<svg') && icon.includes('</svg>'))) {
      // Convert SVG XML to data URL for display
      const encodedSvg = encodeURIComponent(icon);
      return <img src={`data:image/svg+xml,${encodedSvg}`} alt="" className={className} />;
    }
    
    // Otherwise treat as emoji
    return icon;
  }

  // React component
  if (typeof icon === 'function') {
    const IconComponent = icon;
    return <IconComponent className={className} />;
  }

  // Already a React element
  return icon;
}

/**
 * Check if an icon is an SVG (not an emoji)
 * @param {string} icon - The icon string to check
 * @returns {boolean} True if the icon appears to be an SVG path/URL
 */
export function isSvgIcon(icon) {
  if (typeof icon !== 'string') return false;

  return (
    icon.includes('.svg') ||
    icon.startsWith('/assets/') ||
    icon.startsWith('/api/') ||
    icon.startsWith('data:image') ||
    icon.startsWith('http://') ||
    icon.startsWith('https://')
  );
}
