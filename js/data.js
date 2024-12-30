async function loadRounds() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const rounds = await Database.getRounds(currentUser.uid);
        displayRounds(rounds);
    } catch (error) {
        console.error('خطأ في تحميل الجولات:', error);
    }
} 