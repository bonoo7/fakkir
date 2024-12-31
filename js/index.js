// تعريف المتغيرات
const dbName = 'TriviaGame';
const dbVersion = 10;

// دالة إنشاء حقول الفرق
function generateTeamInputs(count) {
    const teamsContainer = document.getElementById('teamsContainer');
    if (!teamsContainer) return;
    
    teamsContainer.innerHTML = ''; // مسح المحتوى السابق
    
    for (let i = 1; i <= count; i++) {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team-input';
        
        const label = document.createElement('label');
        label.textContent = `اسم الفريق ${i}:`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.name = `team${i}`;
        input.required = true;
        input.placeholder = `أدخل اسم الفريق ${i}`;
        
        teamDiv.appendChild(label);
        teamDiv.appendChild(input);
        teamsContainer.appendChild(teamDiv);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // التأكد من وجود defaultQuestions
    if (typeof defaultQuestions !== 'undefined') {
        // إضافة مستمع الحدث للزر
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', function() {
                const selectedCategory = document.querySelector('input[name="category"]:checked');
                if (!selectedCategory) {
                    alert('الرجاء اختيار فئة');
                    return;
                }
                
                localStorage.setItem('selectedCategory', selectedCategory.value);
                window.location.href = 'questions.html';
            });
        }

        // إضافة مستمع الحدث لتغيير عدد الفرق
        const teamCountSelect = document.querySelector('select[name="teamCount"]');
        if (teamCountSelect) {
            teamCountSelect.addEventListener('change', function(e) {
                generateTeamInputs(parseInt(e.target.value));
            });
        }
    } else {
        console.error('لم يتم تحميل الأسئلة بشكل صحيح');
    }
});

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // منع ظهور النافذة تلقائياً
    e.preventDefault();
    // حفظ الحدث للاستخدام لاحقاً
    deferredPrompt = e;
    
    // إظهار زر التثبيت (إذا كان لديك زر مخصص)
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                // إظهار نافذة التثبيت
                deferredPrompt.prompt();
                // انتظار اختيار المستخدم
                const { outcome } = await deferredPrompt.userChoice;
                // تصفير المتغير
                deferredPrompt = null;
                // إخفاء الزر
                installButton.style.display = 'none';
            }
        });
    }
});