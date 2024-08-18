import { defineStore } from 'pinia';
import { toast } from 'vue3-toastify';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('authToken') || null,
    }),
    actions: {
        async login(email, password, keepMeLoggedIn) { await request('POST', `${import.meta.env.VITE_LOGIN_ENDPOINT}`, { email, password, keepMeLoggedIn }, this);},
        async register(email, password, firstname, lastname) { await request('POST', `${import.meta.env.VITE_REGISTER_ENDPOINT}`, { email, password, firstname, lastname }, this);},
        async logout(){}
    }
});

function request(method, route, body, store) {
    const params = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(body)
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
        .then((data) => {
            store.token = data.token;
            localStorage.setItem('authToken', data.token);
            toast.success("Login successful !", {position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true, theme: 'dark'});
        })
        .catch((e) => {
            console.error('Login failed:', e.message || 'An unexpected error occurred.');
            toast.error("Login failed", {position: toast.POSITION.TOP_CENTER, autoClose: 1000, pauseOnHover: true,  theme: 'dark'});
            throw e;
        });
}
