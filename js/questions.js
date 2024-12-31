let db;
let teams = [];
let currentTeamIndex = 0;
let currentRoundId;
let questions = [];
let selectedCategories = [];

const categoryImages = {
    'رياضة': 'catpic/sports.png',
    'تاريخ': 'catpic/history.png',
    'علوم': 'catpic/science.png',
    'جغرافيا': 'catpic/geography.png',
    'فنون': 'catpic/arts.png',
    'إسلامي': 'catpic/islamic.png',
    'تكنولوجيا': 'catpic/tech.png',
    'كرة قدم': 'catpic/football.png',
    'أمراء وحكام': 'catpic/rulers.png',
    'سياسة': 'catpic/default.png',
    'شعر وأدب': 'catpic/literature.png',
    'أوائل': 'catpic/first.png',
    'فلسفة': 'catpic/phyl.png',
    'ألقاب': 'catpic/nicknames.png',
    'default': 'catpic/default.png'
};

const dbName = 'TriviaGame';
const dbVersion = 10;

const initializeDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('questions')) {
                const questionsStore = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
                questionsStore.createIndex('roundId', 'roundId', { unique: false });
                questionsStore.createIndex('awardedTeam', 'awardedTeam', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('rounds')) {
                db.createObjectStore('rounds', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('currentRound')) {
                db.createObjectStore('currentRound', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('selectedCategories')) {
                db.createObjectStore('selectedCategories', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('selectedTeam')) {
                db.createObjectStore('selectedTeam', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = () => reject('خطأ في فتح قاعدة البيانات');
    });
};

const getCurrentRoundId = () => {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('قاعدة البيانات غير متصلة');
            return;
        }

        const transaction = db.transaction(['currentRound'], 'readonly');
        const store = transaction.objectStore('currentRound');
        const request = store.get(1);

        request.onsuccess = (event) => {
            const currentRound = event.target.result;
            if (currentRound) {
                currentRoundId = currentRound.roundId;
                resolve(currentRoundId);
            } else {
                reject('لم يتم العثور على جولة حالية');
            }
        };

        request.onerror = () => reject('خطأ في قراءة الجولة الحالية');
    });
};

const loadSelectedCategories = () => {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('قاعدة البيانات غير متصلة');
            return;
        }

        const transaction = db.transaction(['selectedCategories'], 'readonly');
        const store = transaction.objectStore('selectedCategories');
        const request = store.getAll();

        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result && result.length > 0) {
                selectedCategories = result;
                console.log('الفئات المحملة:', selectedCategories);
                resolve(selectedCategories);
            } else {
                reject('لم يتم العثور على الفئات المحددة');
            }
        };

        request.onerror = () => reject('خطأ في تحميل الفئات');
    });
};

const loadQuestionsForRound = () => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('قاعدة البيانات غير متصلة');
            reject('قاعدة البيانات غير متصلة');
            return;
        }

        if (!currentRoundId) {
            console.error('معرف الجولة غير متوفر');
            reject('معرف الجولة غير متوفر');
            return;
        }

        const transaction = db.transaction(['questions'], 'readonly');
        const store = transaction.objectStore('questions');
        
        // استخدام index للبحث عن الأسئلة حسب roundId
        const index = store.index('roundId');
        const request = index.getAll(currentRoundId);

        request.onsuccess = (event) => {
            questions = event.target.result;
            console.log(`تم جلب ${questions.length} سؤال للجولة ${currentRoundId}`);
            resolve(questions);
        };

        request.onerror = (error) => {
            console.error('خطأ في جلب الأسئلة:', error);
            reject('خطأ في تحميل الأسئلة');
        };
    });
};

const createQuestionButton = (question, index, difficulty) => {
    const difficultyGroup = document.createElement('div');
    difficultyGroup.className = `difficulty-group ${difficulty}`;

    const button = document.createElement('button');
    button.className = 'question-button';
    
    // تحديد النقاط حسب مستوى الصعوبة
    let points;
    switch(difficulty) {
        case 'سهل':
            points = '50';
            break;
        case 'متوسط':
            points = '100';
            break;
        case 'صعب':
            points = '150';
            break;
        default:
            points = '0';
    }
    
    button.textContent = points;

    if (question.isDisabled) {
        difficultyGroup.classList.add('disabled');
        // إضافة مستمع حدث للأزرار المعطلة للانتقال إلى صفحة عرض الإجابة
        button.addEventListener('click', () => {
            window.location.href = `show-answer.html?questionId=${question.id}`;
        });
    } else {
        button.addEventListener('click', () => handleQuestionClick(question));
    }

    difficultyGroup.appendChild(button);
    return difficultyGroup;
};
const createButtonsGroup = (categoryQuestions, difficulties, startIndex, container) => {
    difficulties.forEach((difficulty, index) => {
        const questionsOfDifficulty = categoryQuestions.filter(q => q.difficulty === difficulty);
        if (!questionsOfDifficulty || questionsOfDifficulty.length === 0) return;

        const questionIndex = startIndex ? index + startIndex : index + 1;
        const questionToUse = startIndex ? questionsOfDifficulty[1] : questionsOfDifficulty[0];
        
        if (questionToUse) {
            const button = createQuestionButton(questionToUse, questionIndex, difficulty);
            container.appendChild(button);
        }
    });
};

const createCategoryElements = (category) => {
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'category-container';

    const categoryCenter = document.createElement('div');
    categoryCenter.className = 'category-center';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'category-image-container';
    
    const categoryImage = document.createElement('img');
    categoryImage.className = 'category-image';
    categoryImage.src = categoryImages[category.name] || categoryImages['default'];
    categoryImage.alt = category.name;
    
    const categoryName = document.createElement('div');
    categoryName.className = 'category-name';
    categoryName.textContent = category.name;

    imageContainer.appendChild(categoryImage);
    categoryCenter.appendChild(imageContainer);
    categoryCenter.appendChild(categoryName);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container';

    return { categoryContainer, categoryCenter, buttonsContainer };
};

// إضافة دالة جديدة للتحقق من حالة جميع الأسئلة
const checkAllQuestionsDisabled = () => {
    return questions.every(question => question.isDisabled);
};

// تعديل دالة renderCategories
const renderCategories = () => {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return;

    categoriesContainer.innerHTML = '';
    
    selectedCategories.forEach(category => {
        const categoryQuestions = questions.filter(q => q.category === category.name);
        if (!categoryQuestions || categoryQuestions.length === 0) return;

        const { categoryContainer, categoryCenter, buttonsContainer } = createCategoryElements(category);

        // ترتيب الأسئلة حسب الصعوبة
        const sortedQuestions = categoryQuestions.sort((a, b) => {
            const difficultyOrder = { 'سهل': 1, 'متوسط': 2, 'صعب': 3 };
            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        });
        
        // إنشاء الأزرار بالترتيب الجديد
        sortedQuestions.forEach((question) => {
            const button = document.createElement('button');
            button.className = `question-button ${question.difficulty}`;
            
            let points;
            switch(question.difficulty) {
                case 'سهل': points = '50'; break;
                case 'متوسط': points = '100'; break;
                case 'صعب': points = '150'; break;
                default: points = '0';
            }
            
            button.textContent = points;

            if (question.isDisabled) {
                button.classList.add('disabled');
                button.addEventListener('click', () => {
                    window.location.href = `show-answer.html?questionId=${question.id}`;
                });
            } else {
                button.addEventListener('click', () => handleQuestionClick(question));
            }

            buttonsContainer.appendChild(button);
        });

        categoryContainer.appendChild(categoryCenter);
        categoryContainer.appendChild(buttonsContainer);
        categoriesContainer.appendChild(categoryContainer);
    });

    if (checkAllQuestionsDisabled()) {
        window.location.href = 'winner.html';
    }
};

const handleQuestionClick = (question) => {
    if (!db) {
        console.error('قاعدة البيانات غير متصلة');
        return;
    }

    if (question.isDisabled) {
        window.location.href = `show-answer.html?questionId=${question.id}`;
        return;
    }

    const transaction = db.transaction(['questions'], 'readwrite');
    const store = transaction.objectStore('questions');
    const updatedQuestion = { ...question, isDisabled: true };
    
    const request = store.put(updatedQuestion);

    request.onsuccess = () => {
        console.log('تم تعطيل السؤال بنجاح');
        switchToNextTeam();
        
        setTimeout(() => {
            window.location.href = `question-page.html?questionId=${question.id}`;
        }, 100);
    };

    request.onerror = (error) => {
        console.error('خطأ في تعطيل السؤال:', error);
        showError('حدث خطأ أثناء تعطيل السؤال');
    };
};

const showError = (message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
};

const updateHeader = async () => {
    try {
        await loadCurrentRound();
    } catch (error) {
        console.error('خطأ في تحديث الهيدر:', error);
    }
};

// تحميل الجولة الحالية
function loadCurrentRound() {
    return new Promise((resolve, reject) => {
        if (!currentRoundId) {
            reject('معرف الجولة غير متوفر');
            return;
        }

        const transaction = db.transaction(['rounds'], 'readonly');
        const roundsStore = transaction.objectStore('rounds');
        const request = roundsStore.get(currentRoundId);

        request.onsuccess = (event) => {
            const round = event.target.result;
            if (round) {
                // تحديث عرض معلومات الجولة
                const roundInfo = document.querySelector('.round-info');
                roundInfo.innerHTML = `
                    <span class="round-name">${round.name}</span>
                    <select class="team-selector" title="اختيار الفريق النشط">
                        ${round.teams.map((team, index) => `
                            <option value="${index}" ${index === currentTeamIndex ? 'selected' : ''}>
                                ${team.name}
                            </option>
                        `).join('')}
                    </select>
                `;

                // إضافة مستمع حدث للقائمة المنسدلة
                const teamSelector = roundInfo.querySelector('.team-selector');
                teamSelector.value = currentTeamIndex.toString(); // تحديد الفريق النشط في القائمة
                teamSelector.addEventListener('change', (e) => {
                    setActiveTeam(Number(e.target.value));
                });

                teams = round.teams || [];
                renderTeams();
                resolve(round);
            } else {
                document.getElementById('roundName').textContent = 'لا توجد جولة حالية';
                reject('لا توجد جولة حالية');
            }
        };

        request.onerror = (event) => {
            console.error('خطأ أثناء تحميل الجولة:', event);
            reject(event);
        };
    });
}

// تحميل الفريق النشط
function loadActiveTeam() {
    const transaction = db.transaction(['selectedTeam'], 'readonly');
    const selectedTeamStore = transaction.objectStore('selectedTeam');
    const request = selectedTeamStore.getAll();

    request.onsuccess = (event) => {
        const selectedTeams = event.target.result;
        if (selectedTeams.length > 0 && teams.length > 0) {
            const activeTeam = selectedTeams[0];
            currentTeamIndex = typeof activeTeam.index === 'number' ? 
                              activeTeam.index : 
                              teams.findIndex(team => team.name === activeTeam.name);
            
            if (currentTeamIndex === -1) currentTeamIndex = 0;
        } else {
            currentTeamIndex = 0;
        }
        renderTeams();
        updateTeamsDisplay();
    };

    request.onerror = (event) => {
        console.error('خطأ أثناء تحميل الفريق النشط:', event);
        currentTeamIndex = 0;
        renderTeams();
    };
}

// عرض الفرق
function renderTeams() {
    const teamsContainer = document.querySelector('.teams-info');
    if (!teamsContainer) {
        console.error('لم يتم العثور على حاوية الفرق');
        return;
    }
    
    teamsContainer.innerHTML = '';
    teams.forEach((team, index) => {
        const teamDiv = document.createElement('div');
        teamDiv.className = `team ${index === currentTeamIndex ? 'active' : ''}`;
        teamDiv.id = `team${index + 1}`;

        // إضافة زر الناقص
        const minusButton = document.createElement('button');
        minusButton.className = 'points-button minus-button';
        minusButton.innerHTML = '-';
        minusButton.onclick = (e) => {
            e.stopPropagation();
            updateTeamPoints(index, -50);
        };

        const teamContent = document.createElement('div');
        teamContent.className = 'team-content';

        const teamName = document.createElement('span');
        teamName.className = 'team-name';
        teamName.textContent = team.name;

        const teamScore = document.createElement('span');
        teamScore.className = 'team-score';
        teamScore.textContent = team.points || '0';

        // إضافة زر الزائد
        const plusButton = document.createElement('button');
        plusButton.className = 'points-button plus-button';
        plusButton.innerHTML = '+';
        plusButton.onclick = (e) => {
            e.stopPropagation();
            updateTeamPoints(index, 50);
        };

        teamContent.appendChild(teamName);
        teamContent.appendChild(teamScore);
        
        teamDiv.appendChild(minusButton);
        teamDiv.appendChild(teamContent);
        teamDiv.appendChild(plusButton);
        
        teamsContainer.appendChild(teamDiv);
    });
}

// تحديث عرض الفرق
function updateTeamsDisplay() {
    const teamElements = document.querySelectorAll('.team');
    teamElements.forEach((team, index) => {
        if (index === currentTeamIndex) {
            team.classList.add('active');
        } else {
            team.classList.remove('active');
        }
    });
}

const endRound = () => {
    if (confirm('هل أنت متأكد من إنهاء الجولة؟')) {
        window.location.href = 'winner.html';
    }
};

// تحميل الصفحة
const initializePage = async () => {
    try {
        await initializeDB();
        await getCurrentRoundId();
        
        // تحميل الفريق النشط أولاً
        const transaction = db.transaction(['selectedTeam'], 'readonly');
        const selectedTeamStore = transaction.objectStore('selectedTeam');
        const selectedTeamRequest = selectedTeamStore.get(1);
        
        selectedTeamRequest.onsuccess = async (event) => {
            const selectedTeam = event.target.result;
            if (selectedTeam && selectedTeam.index !== undefined) {
                currentTeamIndex = selectedTeam.index;
            }
            
            // ثم تحميل باقي البيانات
            await loadCurrentRound();
            await loadSelectedCategories();
            await loadQuestionsForRound();
            renderCategories();
            
            // تحديث القائمة المنسدلة والفرق
            const teamSelector = document.querySelector('.team-selector');
            if (teamSelector) {
                teamSelector.value = currentTeamIndex.toString();
            }
            updateTeamsDisplay();
        };
        
    } catch (error) {
        console.error('خطأ في تهيئة الصفحة:', error);
        showError(typeof error === 'string' ? error : 'خطأ في تهيئة الصفحة');
    }
};

document.addEventListener('DOMContentLoaded', initializePage);

// الانتقال إلى الفريق التالي بشكل دائري
function switchToNextTeam() {
    console.log('الفريق الحالي:', currentTeamIndex);
    console.log('عدد الفرق:', teams.length);
    const nextIndex = (currentTeamIndex + 1) % teams.length;
    console.log('الفريق التالي:', nextIndex);
    setActiveTeam(nextIndex);
}

// تعيين الفريق النشط
function setActiveTeam(index) {
    if (!db || teams.length === 0) {
        console.error('قاعدة البيانات غير متصلة أو لا توجد فرق');
        return;
    }

    const transaction = db.transaction(['selectedTeam'], 'readwrite');
    const selectedTeamStore = transaction.objectStore('selectedTeam');
    
    selectedTeamStore.clear().onsuccess = () => {
        selectedTeamStore.add({
            id: 1,
            name: teams[index].name,
            index: index
        }).onsuccess = () => {
            currentTeamIndex = index;
            
            // تحديث القائمة المنسدلة
            const teamSelector = document.querySelector('.team-selector');
            if (teamSelector) {
                teamSelector.value = index.toString();
            }
            
            updateTeamsDisplay();
            console.log('تم تحديث الفريق النشط إلى:', index);
        };
    };
}

// إضافة دالة تحديث النقاط
async function updateTeamPoints(teamIndex, pointsChange) {
    if (!db || !currentRoundId) return;

    const transaction = db.transaction(['rounds'], 'readwrite');
    const roundsStore = transaction.objectStore('rounds');
    
    try {
        const round = await new Promise((resolve, reject) => {
            const request = roundsStore.get(currentRoundId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (round && round.teams) {
            const currentPoints = round.teams[teamIndex].points || 0;
            const newPoints = Math.max(0, currentPoints + pointsChange); // لا نسمح بالنقاط السالبة
            round.teams[teamIndex].points = newPoints;

            await new Promise((resolve, reject) => {
                const updateRequest = roundsStore.put(round);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            });

            teams = round.teams;
            renderTeams();
        }
    } catch (error) {
        console.error('خطأ في تحديث النقاط:', error);
    }
}
