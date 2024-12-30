class Database {
    static db = firebase.firestore();

    // إدارة الأسئلة
    static async getQuestions() {
        try {
            const snapshot = await this.db.collection('questions').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('خطأ في جلب الأسئلة:', error);
            throw error;
        }
    }

    static async addQuestion(question) {
        try {
            const docRef = await this.db.collection('questions').add({
                ...question,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('خطأ في إضافة السؤال:', error);
            throw error;
        }
    }

    // إدارة الجولات
    static async saveRound(roundData) {
        try {
            const docRef = await this.db.collection('rounds').add({
                ...roundData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('خطأ في حفظ الجولة:', error);
            throw error;
        }
    }

    static async getRounds(userId) {
        try {
            const snapshot = await this.db.collection('rounds')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('خطأ في جلب الجولات:', error);
            throw error;
        }
    }

    // إدارة الفئات
    static async getCategories() {
        try {
            const snapshot = await this.db.collection('categories').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('خطأ في جلب الفئات:', error);
            throw error;
        }
    }

    // نقل البيانات من IndexedDB إلى Firestore
    static async migrateFromIndexedDB() {
        try {
            // نقل الأسئلة
            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open('TriviaGame', 11);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });

            const tx = db.transaction(['questions', 'rounds'], 'readonly');
            const questionsStore = tx.objectStore('questions');
            const roundsStore = tx.objectStore('rounds');

            // نقل الأسئلة
            const questions = await new Promise((resolve, reject) => {
                const request = questionsStore.getAll();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });

            for (const question of questions) {
                await this.addQuestion(question);
            }

            // نقل الجولات
            const rounds = await new Promise((resolve, reject) => {
                const request = roundsStore.getAll();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });

            for (const round of rounds) {
                await this.saveRound(round);
            }

            console.log('تم نقل البيانات بنجاح');
        } catch (error) {
            console.error('خطأ في نقل البيانات:', error);
            throw error;
        }
    }
} 