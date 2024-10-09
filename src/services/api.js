import { toast } from 'vue3-toastify';
import { useAuthStore } from '@/stores/auth';

export function request(method, route, body) {
    const auth = useAuthStore();

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
    
    const params = {
        method: method,
        headers: headers,
        body:  ['POST', 'PUT'].includes(method) ? JSON.stringify(body) : undefined
    };

    return fetch(`${import.meta.env.VITE_API_BASE_URL}${route}`, params)
        .then((res) => {
            if(res.status === 401) {
                auth.logout();
            } else {
                if (!res.ok) {
                    return res.text().then((text) => {
                        throw new Error(text || 'Server error');
                    });
                }
                return res.json();
            }
        })
        .catch((e) => {
            toast.error( e.message, { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            throw e;
        });
}