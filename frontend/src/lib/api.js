import { useAuthStore } from '@/store/authStore';

const BASE_URL = 'http://localhost/api';

function getToken() {
    return useAuthStore.getState().token;
}

function handleAuthError(status) {
    if (status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
    }
}

async function request(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        if (!response.ok) throw { status: response.status, data: {} };
        return null;
    }

    if (!response.ok) {
        handleAuthError(response.status);
        let data = {};
        try { data = await response.json(); } catch { /* non-JSON error body */ }
        throw { status: response.status, data };
    }
    return response.json();
}

export const authApi = {
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
};

async function requestBlob(path) {
    const token = getToken();
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
        handleAuthError(response.status);
        throw { status: response.status };
    }
    return URL.createObjectURL(await response.blob());
}

async function requestMultipart(path, formData) {
    const token = getToken();
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });
    if (!response.ok) {
        handleAuthError(response.status);
        let data = {};
        try { data = await response.json(); } catch { /* non-JSON error body */ }
        throw { status: response.status, data };
    }
    return response.json();
}

async function requestMultipartText(path, formData) {
    const token = getToken();
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });
    if (!response.ok) {
        handleAuthError(response.status);
        let data = {};
        try { data = await response.json(); } catch { /* non-JSON error body */ }
        throw { status: response.status, data };
    }
    return response.text();
}

export const aiApi = {
    analyze: (imageId, userMessage) => {
        const fd = new FormData();
        fd.append('imageId', imageId);
        fd.append('userMessage', userMessage);
        return requestMultipartText('/ai/analyze', fd);
    },
};

export const adminApi = {
    getAllUsers: () => request('/auth/admin/users'),
    createUser: (data) => request('/auth/admin/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id, data) => request(`/auth/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteUser: (id) => request(`/auth/admin/users/${id}`, { method: 'DELETE' }),
};

export const imageApi = {
    upload: (formData) => requestMultipart('/images/upload', formData),
    getAll: () => request('/images'),
    getById: (id) => request(`/images/${id}`),
    getFile: (id) => requestBlob(`/images/${id}/file`),
    saveProcessed: (id, formData) => requestMultipart(`/images/${id}/process`, formData),
    getProcessedFile: (id) => requestBlob(`/images/${id}/processed-file`),

    processOpenCv: (id, params) => {
        const query = new URLSearchParams(params).toString();
        return request(`/images/${id}/opencv?${query}`, { method: 'POST' });
    },

    processOpenCvWithMask: (id, params, formData) => {
        const query = new URLSearchParams(params).toString();
        return requestMultipart(`/images/${id}/opencv-mask?${query}`, formData);
    },

    processPoisson: (id, params, formData) => {
        const query = new URLSearchParams(params).toString();
        return requestMultipart(`/images/${id}/poisson?${query}`, formData);
    },

    updateCategory: (id, category) => request(`/images/${id}`, { method: 'PATCH', body: JSON.stringify({ category }) }),
    revertProcessed: (id) => request(`/images/${id}/processed`, { method: 'DELETE' }),
    deleteImage: (id) => request(`/images/${id}`, { method: 'DELETE' }),
};
