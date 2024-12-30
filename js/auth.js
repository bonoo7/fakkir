// تكوين Firebase
const firebaseConfig = {
    apiKey: "AIzaSyADraYCGxjsihSeHsK5GEUlV_fclYH04Do",
    authDomain: "fakkir-game.firebaseapp.com",
    projectId: "fakkir-game",
    storageBucket: "fakkir-game.firebasestorage.app",
    messagingSenderId: "896062380289",
    appId: "1:896062380289:web:6c1f65d2b946bfba83e300",
    measurementId: "G-9KPNQEDX6J"
};

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// تهيئة Analytics
const analytics = firebase.analytics();

class Auth {
    static async getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('TriviaGame', 11);

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // إنشاء مخزن المستخدمين إذا لم يكن موجوداً
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'email' });
                    usersStore.createIndex('name', 'name', { unique: false });
                }

                // إنشاء مخزن الجولات إذا لم يكن موجوداً
                if (!db.objectStoreNames.contains('rounds')) {
                    const roundsStore = db.createObjectStore('rounds', { keyPath: 'id' });
                    roundsStore.createIndex('userId', 'userId', { unique: false });
                }
            };
        });
    }

    static async register(userData) {
        try {
            // إنشاء حساب في Firebase
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(
                userData.email,
                userData.password
            );

            // إضافة معلومات المستخدم الإضافية
            await userCredential.user.updateProfile({
                displayName: userData.name
            });

            // تخزين بيانات المستخدم في IndexedDB
            await this.saveUserToIndexedDB({
                email: userData.email,
                name: userData.name,
                uid: userCredential.user.uid
            });

            await this.setUserSession(userCredential.user);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('خطأ في التسجيل:', error);
            let errorMessage;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'كلمة المرور ضعيفة جداً';
                    break;
                default:
                    errorMessage = error.message;
            }
            alert(errorMessage);
            throw error;
        }
    }

    static async login(email, password) {
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(
                email,
                password
            );
            
            await this.setUserSession(userCredential.user);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            let errorMessage;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'البريد الإلكروني غير مسجل';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'كلمة المرور غير صحيحة';
                    break;
                default:
                    errorMessage = error.message;
            }
            alert(errorMessage);
            throw error;
        }
    }

    static async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            // إضافة النطاقات المطلوبة
            provider.addScope('profile');
            provider.addScope('email');
            
            // تعيين اللغة
            provider.setCustomParameters({
                'lang': 'ar'
            });

            const result = await firebase.auth().signInWithPopup(provider);
            
            // تخزين بيانات المستخدم
            await this.saveUserToIndexedDB({
                email: result.user.email,
                name: result.user.displayName,
                uid: result.user.uid,
                photoURL: result.user.photoURL
            });

            await this.setUserSession(result.user);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('خطأ في تسجيل الدخول عبر Google:', error);
            let errorMessage;
            switch (error.code) {
                case 'auth/popup-blocked':
                    errorMessage = 'تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة وإعادة المحاولة.';
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = 'تم إغلاق نافذة تسجيل الدخول.';
                    break;
                default:
                    errorMessage = error.message;
            }
            alert(errorMessage);
            throw error;
        }
    }

    static async signInWithApple() {
        try {
            const provider = new firebase.auth.OAuthProvider('apple.com');
            // إضافة النطاقات المطلوبة
            provider.addScope('email');
            provider.addScope('name');

            // تعيين اللغة
            provider.setCustomParameters({
                locale: 'ar'
            });

            const result = await firebase.auth().signInWithPopup(provider);
            
            // تخزين بيانات المستخدم
            await this.saveUserToIndexedDB({
                email: result.user.email,
                name: result.user.displayName || 'مستخدم Apple', // Apple قد لا يوفر الاسم دائماً
                uid: result.user.uid,
                photoURL: result.user.photoURL
            });

            await this.setUserSession(result.user);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('خطأ في تسجيل الدخول عبر Apple:', error);
            let errorMessage;
            switch (error.code) {
                case 'auth/popup-blocked':
                    errorMessage = 'تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة وإعادة المحاولة.';
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = 'تم إغلاق نافذة تسجيل الدخول.';
                    break;
                default:
                    errorMessage = error.message;
            }
            alert(errorMessage);
            throw error;
        }
    }

    static async saveUserToIndexedDB(userData) {
        const db = await this.getDB();
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');

        try {
            await store.put({
                email: userData.email,
                name: userData.name,
                uid: userData.uid,
                photoURL: userData.photoURL,
                createdAt: new Date()
            });
        } catch (error) {
            console.error('خطأ في حفظ بيانات المستخدم:', error);
            throw error;
        }
    }

    static async setUserSession(user) {
        sessionStorage.setItem('currentUser', JSON.stringify({
            email: user.email,
            name: user.displayName,
            uid: user.uid,
            photoURL: user.photoURL
        }));
    }

    static logout() {
        firebase.auth().signOut().then(() => {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('خطأ في تسجيل الخروج:', error);
        });
    }

    static getCurrentUser() {
        const userData = sessionStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    static isLoggedIn() {
        return !!this.getCurrentUser();
    }

    // إضافة مستمعي الأحداث للنماذج
    static initAuthListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = loginForm.querySelector('button[type="submit"]');
                submitButton.disabled = true;
                try {
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    await this.login(email, password);
                } catch (error) {
                    console.error(error);
                } finally {
                    submitButton.disabled = false;
                }
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = registerForm.querySelector('button[type="submit"]');
                submitButton.disabled = true;
                try {
                    const userData = {
                        name: document.getElementById('name').value,
                        email: document.getElementById('email').value,
                        password: document.getElementById('password').value
                    };
                    const confirmPassword = document.getElementById('confirm-password').value;
                    
                    if (userData.password !== confirmPassword) {
                        throw new Error('كلمات المرور غير متطابقة');
                    }

                    await this.register(userData);
                } catch (error) {
                    console.error(error);
                } finally {
                    submitButton.disabled = false;
                }
            });
        }
    }
}

// تهيئة مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    Auth.initAuthListeners();
}); 