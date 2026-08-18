/**
 * Parses and modifies a Cloudinary URL to add optimization parameters.
 * Cloudinary URLs typically look like:
 * https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/v<version>/<public_id>
 * 
 * We want to insert transformations after the /upload/ part (or equivalent type).
 * Example:
 * https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg
 * becomes
 * https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/v1234/sample.jpg
 */

export const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url;
  }

  try {
    const {
      width, // e.g. 800, 400, 'auto'
      quality = 'auto',
      format = 'auto',
      crop = 'scale',
      isVideoPoster = false // If true, changes .mp4 to .jpg
    } = options;

    let targetUrl = url;

    // For videos, if we want a poster, we change the extension
    if (isVideoPoster && targetUrl.endsWith('.mp4')) {
      targetUrl = targetUrl.replace(/\.mp4$/, '.jpg');
      // If it's a video poster, the resource type in the URL might still say 'video'
      // Cloudinary allows rendering video thumbnails by just changing extension, 
      // but sometimes replacing '/video/upload/' with '/video/upload/so_0/' (snapshot at 0s) is needed.
      // Changing .mp4 to .jpg is usually enough for a poster.
    }

    // Build the transformation string
    const transformations = [];
    if (format) transformations.push(`f_${format}`);
    if (quality) transformations.push(`q_${quality}`);
    if (width) transformations.push(`w_${width}`);
    if (crop && width) transformations.push(`c_${crop}`);

    const transformStr = transformations.join(',');
    if (!transformStr) return targetUrl;

    // Find the '/upload/' segment to inject transformations
    const uploadIndex = targetUrl.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const beforeUpload = targetUrl.substring(0, uploadIndex + 8); // include '/upload/'
      const afterUpload = targetUrl.substring(uploadIndex + 8);
      
      // Check if transformations already exist (e.g. /upload/w_100/v1234)
      // Usually version starts with 'v' followed by digits
      if (afterUpload.match(/^v\d+\//) || afterUpload.match(/^[^/]+\//)) {
          // It's safe to inject, if it already had transformations, they might be duplicated,
          // but let's assume raw URLs from DB.
          return `${beforeUpload}${transformStr}/${afterUpload}`;
      }
    }

    return targetUrl;
  } catch (err) {
    console.error('Error optimizing Cloudinary URL:', err);
    return url;
  }
};

/**
 * Generate a srcset for responsive images.
 */
export const generateSrcSet = (url, widths = [400, 800, 1200]) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return '';
  }
  
  return widths.map(w => `${optimizeCloudinaryUrl(url, { width: w })} ${w}w`).join(', ');
};
