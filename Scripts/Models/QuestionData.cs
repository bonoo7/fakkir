[System.Serializable]
public class QuestionData
{
    public string question;
    public string answer;
    public string category;
    public string difficulty;
    public string roundId;
    public bool isDisabled;
    public string imgQ;
    public string imgA;
    public string vidQ;
    public string vidA;
}

[System.Serializable]
public class Team
{
    public string name;
    public int score;
    public Color teamColor;
} 