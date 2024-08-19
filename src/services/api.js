import { toast } from 'vue3-toastify';

export function request(method, route, store, body) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    
    if (store.token) {
        headers['Authorization'] = `Bearer ${store.token}`;
    }

    const params = {
        method: method,
        headers: headers,
        body: method === 'POST' ? JSON.stringify(body) : undefined
    };

    return fetch(`${import.meta.env.VITE_API_BASE_URL}${route}`, params)
        .then((res) => {
            if (!res.ok) {
                return res.text().then((text) => {
                    throw new Error(text || 'Server error');
                });
            }
            return res.json();
        })
        .catch((e) => {
            toast.error( e.message, { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            throw e;
        });
}