import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';

export const useLocationStore = defineStore('location', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
        locationsList: [],
        currentPage: 1,
        totalPages: 1,
    }),
    actions: {
        async fetchLocations(page = 1) {
            try {
                const data = await request('post', `${import.meta.env.VITE_LOCATIONS_ENDPOINT}/p/${page}`, this);
                this.locationsList = data.list || [];
                this.currentPage = page;
                this.totalPages = Math.ceil(data.count / import.meta.env.VITE_LOCATIONS_PER_PAGE); 
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        },
        async location(id) {
            // TO DO
        },
        goToPage(page) {
            if (page > 0 && page <= this.totalPages) {
                this.fetchLocations(page);
            }
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
            toast.error("Please Connect..", { position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark' });
            throw e;
        });
}
