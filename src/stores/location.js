import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';

export const useLocationStore = defineStore('location', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        locationsList: [],
    }),
    actions: {
        async locations(page) {
            try {
                const data = await request('post', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/p/${page}`, this);
                console.log(data.list);
                this.locationsList = data.list || [];
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        },
        async location(id) {
            // TO DO
        }
    }
});

function request(method, route, store) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (store.token) {
        headers['Authorization'] = `Bearer ${store.token}`;
    }

    const params = {
        method: method.toUpperCase(),
        headers: headers,
        body: JSON.stringify({})
    };

    console.log(route);

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
            console.error('Loading failed:', e.message || 'An unexpected error occurred.');
            toast.error("Loading failed", { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            throw e;
        });
}
