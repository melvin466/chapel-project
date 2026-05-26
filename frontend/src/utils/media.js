import api from '../services/api';

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.replace(/\\/g, '/');
  const uploadPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${encodeURI(uploadPath)}`;
};

export const getEmbeddableVideoUrl = (url) => {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = parsed.searchParams.get('v') || parsed.pathname.split('/').pop();
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }

    if (host === 'vimeo.com') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : '';
    }

    if (host === 'player.vimeo.com' || parsed.pathname.includes('/embed/')) {
      return url;
    }
  } catch (error) {
    return '';
  }

  return '';
};
