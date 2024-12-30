using UnityEngine;

public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance;
    public AudioClip correctAnswer;
    public AudioClip wrongAnswer;
    public AudioClip buttonClick;
    
    private AudioSource audioSource;
    
    void Awake()
    {
        Instance = this;
        audioSource = GetComponent<AudioSource>();
    }
    
    public void PlaySound(AudioClip clip)
    {
        audioSource.PlayOneShot(clip);
    }
} 