const dbName = 'TriviaGame';
const dbVersion = 8;
let db;
let currentRoundId;
let teams = [];
let currentTeamIndex = 0;

const roundInfoElement = document.getElementById('round-info');
const teamsContainerElement = document.getElementById('teams-container');
const teamSelectElement = document.getElementById('team-select');
const categoriesContainer = document.getElementById('categories-container');

const request = indexedDB.open(dbName, dbVersion);

request.onsuccess = (event) => {
    db = event.target.result;
    const urlParams = new URLSearchParams(window.location.search);
    currentRoundId = parseInt(urlParams.get('roundId'));
    loadCurrentRound();
};

request.onerror = (event) => {
    console.error('خطأ في فتح قاعدة البيانات:', event);
};

function loadCurrentRound() {
    const transaction = db.transaction(['rounds'], 'readonly');
    const store = transaction.objectStore('rounds');
    const request = store.get(currentRoundId);

    request.onsuccess = (event) => {
        const round = event.target.result;
        if (round) {
            roundInfoElement.textContent = `الجولة: ${round.name}`;
            teams = round.teams || [];
            renderTeams();
            loadCategoriesForRound();
        } else {
            roundInfoElement.textContent = 'لم يتم العثور على الجولة.';
        }
    };
}
async function loadRoundData() {
    try {
        updateProgress(20, 'جاري تحميل بيانات الجولة...');

        // تحميل معلومات الجولة
        const round = await getRoundData();
        
        // تصفير نقاط جميع الفرق
        round.teams = round.teams.map(team => ({
            ...team,
            points: 0
        }));
        
        localStorage.setItem('currentRound', JSON.stringify(round));
        // ... باقي الكود
    } catch (error) {
        // ... معالجة الخطأ
    }
}
function renderTeams() {
    teamsContainerElement.innerHTML = '';
    teamSelectElement.innerHTML = '';

    teams.forEach((team, index) => {
        const teamBox = document.createElement('div');
        teamBox.className = `team-box ${index === currentTeamIndex ? 'active' : ''}`;
        teamBox.textContent = `${team.name} - ${team.points} نقاط`;
        teamsContainerElement.appendChild(teamBox);

        const option = document.createElement('option');
        option.value = index;
        option.textContent = team.name;
        teamSelectElement.appendChild(option);
    });

    teamSelectElement.value = currentTeamIndex;
}

function loadCategoriesForRound() {
    const transaction = db.transaction(['selectedCategories'], 'readonly');
    const store = transaction.objectStore('selectedCategories');
    const request = store.getAll();

    request.onsuccess = (event) => {
        const categories = event.target.result.filter(c => c.roundId === currentRoundId);
        if (categories.length > 0) {
            loadQuestionsForRound(categories.map(c => c.name));
        } else {
            categoriesContainer.innerHTML = '<p>لا توجد فئات لهذه الجولة.</p>';
        }
    };
}
// في صفحة playagain.html
function getQuestionsForRound() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['questions'], 'readonly');
        const store = transaction.objectStore('questions');
        const request = store.getAll();

        request.onsuccess = () => {
            // نحصل على جميع الأسئلة المرتبطة بالجولة الحالية
            const allQuestions = request.result;
            const roundQuestions = allQuestions.filter(q => q.roundId === currentRoundId);
            console.log('Questions being stored:', roundQuestions); // للتحقق
            resolve(roundQuestions);
        };

        request.onerror = () => reject(request.error);
    });
}
async function loadRoundData() {
    try {
        updateProgress(20, 'جاري تحميل بيانات الجولة...');

        // تحميل معلومات الجولة
        const round = await getRoundData();
        localStorage.setItem('currentRound', JSON.stringify(round));
        
        updateProgress(40, 'جاري تحميل الفئات...');

        // تحميل الفئات
        const categories = await getCategoriesForRound();
        localStorage.setItem('roundCategories', JSON.stringify(categories));
        
        updateProgress(60, 'جاري تحميل الأسئلة...');

        // تحميل الأسئلة
        const questions = await getQuestionsForRound();
        console.log('Questions before storing:', questions); // للتحقق
        localStorage.setItem('roundQuestions', JSON.stringify(questions));
        
        updateProgress(80, 'جاري تحميل الفريق النشط...');

        // تهيئة الفريق النشط
        localStorage.setItem('activeTeamIndex', '0');

        updateProgress(100, 'اكتمل التحميل!');

        // الانتقال إلى صفحة اللعب بعد ثانية
        setTimeout(() => {
            window.location.href = 'playgame.html';
        }, 1000);

    } catch (error) {
        console.error('Error loading data:', error);
        showError('حدث خطأ أثناء تحميل البيانات');
    }
}
function loadQuestionsForRound(categories) {
    const transaction = db.transaction(['questions'], 'readonly');
    const store = transaction.objectStore('questions');
    const request = store.getAll();

    request.onsuccess = (event) => {
        const allQuestions = event.target.result;
        const roundQuestions = allQuestions.filter(q => q.roundId === currentRoundId && categories.includes(q.category));
        
        // تخزين الفئات والأسئلة في Local Storage
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('questions', JSON.stringify(roundQuestions));

        renderCategoriesAndQuestions(categories, roundQuestions);
    };

    request.onerror = () => {
        categoriesContainer.innerHTML = '<p>خطأ أثناء تحميل الأسئلة.</p>';
    };
}

function loadFromLocalStorage() {
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    const questions = JSON.parse(localStorage.getItem('questions')) || [];

    if (categories.length > 0 && questions.length > 0) {
        renderCategoriesAndQuestions(categories, questions);
    } else {
        categoriesContainer.innerHTML = '<p>لا توجد بيانات متاحة.</p>';
    }
}

function renderCategoriesAndQuestions(categories, questions) {
    categoriesContainer.innerHTML = '';

    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        categoryDiv.innerHTML = `<h2>${category}</h2>`;

        const questionsContainer = document.createElement('div');
        questionsContainer.className = 'questions-container';

        const categoryQuestions = questions
            .filter(q => q.category === category)
            .sort((a, b) => getDifficultyOrder(a.difficulty) - getDifficultyOrder(b.difficulty));

        if (categoryQuestions.length === 0) {
            questionsContainer.innerHTML = '<p>لا توجد أسئلة لهذه الفئة.</p>';
        } else {
            categoryQuestions.forEach(question => {
                const isDisabled = localStorage.getItem(`question-${question.id}`) === 'disabled';
                const questionDiv = document.createElement('div');
                questionDiv.className = `question ${getDifficultyClass(question.difficulty)} ${isDisabled ? 'disabled' : ''}`;
                questionDiv.textContent = `${question.difficulty}`;
                
                questionDiv.addEventListener('click', () => handleQuestionClick(question, questionDiv));
                questionsContainer.appendChild(questionDiv);
            });
        }

        categoryDiv.appendChild(questionsContainer);
        categoriesContainer.appendChild(categoryDiv);
    });
}

function handleQuestionClick(question) {
    if (question.isDisabled) {
        // توجيه إلى صفحة عرض الإجابة الجديدة
        window.location.href = `show-answer-again.html?questionId=${question.id}`;
        return;
    }

    // تعطيل السؤال
    question.isDisabled = true;
    updateQuestionInStorage(question);
    switchToNextTeam();
    
    // توجيه إلى صفحة السؤال الجديدة
    window.location.href = `question-page-again.html?questionId=${question.id}`;
}

function getDifficultyOrder(difficulty) {
    switch (difficulty) {
        case 'سهل': return 1;
        case 'متوسط': return 2;
        case 'صعب': return 3;
        default: return 4;
    }
}

function getDifficultyClass(difficulty) {
    switch (difficulty) {
        case 'سهل': return 'easy';
        case 'متوسط': return 'medium';
        case 'صعب': return 'hard';
        default: return '';
    }
}

function setActiveTeam() {
    currentTeamIndex = parseInt(teamSelectElement.value);
    renderTeams();
}

function endGame() {
    window.location.href = 'winner.html';
}

// تحميل البيانات من Local Storage عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
});