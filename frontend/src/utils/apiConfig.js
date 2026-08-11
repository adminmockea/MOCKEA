// live server
export const API_BASE_URL = import.meta.env.VITE_live_url || import.meta.env.VITE_live_url2;
//local server
// export const API_BASE_URL = import.meta.env.VITE_local_url;
if (!API_BASE_URL) {
    console.error("API_BASE_URL is not defined");
}

export function getFileUrl(pathOrUrl) {
    if (!pathOrUrl) return '';
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
        return pathOrUrl;
    }
    const serverRoot = (API_BASE_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${serverRoot}${cleanPath}`;
}

export function getErrorMessage(error, fallback = "An unexpected error occurred.") {
    if (!error) return fallback;
    if (typeof error === "string") return error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error) return error.response.data.error;
    if (error.message) return error.message;
    return fallback;
}

