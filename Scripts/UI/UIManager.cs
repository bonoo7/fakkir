using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class UIManager : MonoBehaviour
{
    [Header("الشاشة الرئيسية")]
    [SerializeField] private GameObject mainMenuPanel;
    [SerializeField] private GameObject categoriesPanel;
    [SerializeField] private Transform categoryButtonsContainer;
    [SerializeField] private GameObject categoryButtonPrefab;
    
    [Header("شاشة السؤال")]
    [SerializeField] private TextMeshProUGUI questionText;
    [SerializeField] private TextMeshProUGUI categoryText;
    [SerializeField] private Image questionImage;
    [SerializeField] private Button showAnswerButton;
    
    [Header("شاشة الإجابة")]
    [SerializeField] private TextMeshProUGUI answerText;
    [SerializeField] private Image answerImage;
    
    [Header("لوحة النتائج")]
    [SerializeField] private Transform teamsContainer;
    [SerializeField] private GameObject teamScorePrefab;
    
    public void ShowError(string message)
    {
        // إظهار رسالة خطأ للمستخدم
    }
    
    public void UpdateScores()
    {
        foreach (Transform child in teamsContainer)
        {
            Destroy(child.gameObject);
        }
        
        foreach (Team team in GameManager.Instance.teams)
        {
            GameObject scoreObj = Instantiate(teamScorePrefab, teamsContainer);
            TextMeshProUGUI scoreText = scoreObj.GetComponent<TextMeshProUGUI>();
            scoreText.text = $"{team.name}: {team.score}";
            scoreText.color = team.teamColor;
        }
    }
    
    public void ShowQuestion(QuestionData question)
    {
        questionText.text = question.question;
        categoryText.text = question.category;
        
        if (!string.IsNullOrEmpty(question.imgQ))
        {
            StartCoroutine(LoadQuestionImage(question.imgQ));
        }
        
        showAnswerButton.onClick.AddListener(() => ShowAnswer(question));
    }
    
    private System.Collections.IEnumerator LoadQuestionImage(string imagePath)
    {
        // تحميل صورة السؤال
        // يمكن استخدام Resources.Load أو UnityWebRequest
    }
} 