/**
 * Image utility functions for handling placeholders and fallbacks
 */

/**
 * Get a placeholder image URL with optional size parameters
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} query - Additional query parameters
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderImage = (width = 32, height = 32, query = '') => {
    const baseUrl = '/placeholder.svg';
    const params = new URLSearchParams();

    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (query) params.append('query', query);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Get a safe image URL with fallback to placeholder
 * @param {string} imageUrl - Original image URL
 * @param {number} width - Fallback width
 * @param {number} height - Fallback height
 * @returns {string} Safe image URL
 */
export const getSafeImageUrl = (imageUrl, width = 32, height = 32) => {
    if (!imageUrl || imageUrl === '/placeholder.svg') {
        return getPlaceholderImage(width, height);
    }

    // If the image URL is already a placeholder, return it
    if (imageUrl.includes('placeholder.svg')) {
        return imageUrl;
    }

    // Return the original image URL
    return imageUrl;
};

/**
 * Handle image load errors by falling back to placeholder
 * @param {Event} event - Image error event
 * @param {number} width - Fallback width
 * @param {number} height - Fallback height
 */
export const handleImageError = (event, width = 32, height = 32) => {
    const img = event.target;
    if (img.src !== getPlaceholderImage(width, height)) {
        img.src = getPlaceholderImage(width, height);
    }
};

/**
 * Create an image component with error handling
 * @param {Object} props - Image props
 * @returns {JSX.Element} Image component with error handling
 */
export const SafeImage = ({ src, alt, width = 32, height = 32, className = '', ...props }) => {
    const safeSrc = getSafeImageUrl(src, width, height);

    return (
        <img
            src={safeSrc}
            alt={alt || 'Placeholder'}
            width={width}
            height={height}
            className={className}
            onError={(e) => handleImageError(e, width, height)}
            {...props}
        />
    );
}; 