import { toast } from 'vue3-toastify';
import { useAuthStore } from '@/stores/auth';
import { isDemo, DemoBlocked } from '@/demo/session';

const TOAST = { position: toast.POSITION.TOP_CENTER, pauseOnHover: true, theme: 'dark' };

// Démo : aucune requête réseau, réponses du backend simulé (chargé à la demande)
const demoCall = async (method, route, body) => {
    const { demoRequest } = await import('@/demo/api');
    try {
        return await demoRequest(method, route, body);
    } catch (e) {
        if (e instanceof DemoBlocked) toast.info(e.message, { ...TOAST, autoClose: 2500 });
        else toast.error(e.message, { ...TOAST, autoClose: 2000 });
        throw e;
    }
};

export function request(method, route, body) {
    // Connexion / inscription depuis l'accueil pendant une démo : vraie API (le login quitte la démo)
    if (isDemo() && !route.startsWith('/auth')) return demoCall(method, route, body);
    const auth = useAuthStore();

    const headers = {
        'Accept': 'application/json',
    };
    
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
    
    const isFormData = body instanceof FormData;

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const hasBody = body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD';

    const params = {
        method: method,
        headers: isFormData ? headers : { ...headers, 'Content-Type': 'application/json' },
    };

    if (hasBody) {
        params.body = isFormData ? body : JSON.stringify(body);
    }

    return fetch(`${import.meta.env.VITE_API_BASE_URL}${route}`, params)
        .then((res) => {
            if (res.status === 401) {
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
            toast.error(e.message, { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            throw e;
        });
}
