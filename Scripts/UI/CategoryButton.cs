using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class CategoryButton : MonoBehaviour
{
    public TextMeshProUGUI categoryText;
    public Image categoryIcon;
    
    public void SetupCategory(string category, Sprite icon)
    {
        categoryText.text = category;
        categoryIcon.sprite = icon;
    }
    
    public void OnClick()
    {
        // فتح شاشة السؤال
        GameManager.Instance.ShowQuestion(category);
    }
} 