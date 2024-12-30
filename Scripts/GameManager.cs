using UnityEngine;
using System.Collections.Generic;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;
    public QuestionData currentQuestion;
    public List<Team> teams;
    public int currentRoundId;
    public string currentCategory;
    
    [SerializeField] private QuestionManager questionManager;
    [SerializeField] private UIManager uiManager;
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeGame();
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    private void InitializeGame()
    {
        // تحميل البيانات المحفوظة
        GameData savedData = SaveSystem.LoadGame();
        if (savedData != null)
        {
            teams = savedData.teams;
            currentRoundId = savedData.currentRoundId;
        }
        else
        {
            teams = new List<Team>();
        }
    }
    
    public void ShowQuestion(string category)
    {
        currentCategory = category;
        currentQuestion = questionManager.GetRandomQuestion(category);
        if (currentQuestion != null)
        {
            SceneManager.LoadScene("QuestionScene");
        }
        else
        {
            uiManager.ShowError("لا توجد أسئلة متاحة في هذه الفئة");
        }
    }
    
    public void AnswerQuestion(bool isCorrect, Team team)
    {
        if (isCorrect)
        {
            team.score += GetQuestionScore(currentQuestion.difficulty);
            AudioManager.Instance.PlaySound(AudioManager.Instance.correctAnswer);
        }
        else
        {
            AudioManager.Instance.PlaySound(AudioManager.Instance.wrongAnswer);
        }
        
        SaveGame();
        uiManager.UpdateScores();
    }
    
    private int GetQuestionScore(string difficulty)
    {
        switch (difficulty.ToLower())
        {
            case "سهل": return 1;
            case "متوسط": return 2;
            case "صعب": return 3;
            default: return 1;
        }
    }
    
    public void SaveGame()
    {
        GameData data = new GameData
        {
            teams = teams,
            currentRoundId = currentRoundId
        };
        SaveSystem.SaveGame(data);
    }
} 