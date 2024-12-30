using UnityEngine;
using System.IO;

public static class SaveSystem
{
    private static readonly string SAVE_PATH = 
        Path.Combine(Application.persistentDataPath, "gameData.json");
    
    public static void SaveGame(GameData data)
    {
        string json = JsonUtility.ToJson(data);
        File.WriteAllText(SAVE_PATH, json);
    }
    
    public static GameData LoadGame()
    {
        if (File.Exists(SAVE_PATH))
        {
            string json = File.ReadAllText(SAVE_PATH);
            return JsonUtility.FromJson<GameData>(json);
        }
        return new GameData();
    }
} 