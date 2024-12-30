using UnityEngine;
using System.Collections.Generic;
using System.IO;

public class QuestionManager : MonoBehaviour
{
    private List<QuestionData> questions;
    
    void Start()
    {
        LoadQuestions();
    }
    
    void LoadQuestions()
    {
        // قراءة ملف JSON من Resources
        TextAsset jsonFile = Resources.Load<TextAsset>("questions");
        if (jsonFile != null)
        {
            QuestionsData data = JsonUtility.FromJson<QuestionsData>(jsonFile.text);
            questions = data.questions;
        }
    }
    
    public QuestionData GetRandomQuestion(string category)
    {
        List<QuestionData> categoryQuestions = questions.FindAll(q => 
            q.category == category && !q.isDisabled);
            
        if (categoryQuestions.Count > 0)
        {
            int randomIndex = Random.Range(0, categoryQuestions.Count);
            return categoryQuestions[randomIndex];
        }
        return null;
    }
} 