
let audioContext: AudioContext | null = null;
let isAudioContextInitialized = false;

const initializeAudioContext = () => {
    if (typeof window !== 'undefined' && !isAudioContextInitialized) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            isAudioContextInitialized = true;
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
            isAudioContextInitialized = true; // Prevent further attempts
        }
    }
};

// Initialize on load or first user interaction
if (typeof window !== 'undefined') {
    // A common practice is to initialize audio on the first user gesture.
    // However, we can try to initialize it eagerly and it will often work.
    // If not, it will be attempted again on the first sound play.
    initializeAudioContext();
}


export const playKeystrokeSound = () => {
    // Attempt to initialize if it failed before
    if (!audioContext) {
        initializeAudioContext();
    }
    
    // If context is still not available, do nothing.
    if (!audioContext) {
        return;
    }
    
    // If the context is suspended, it needs to be resumed, which requires a user gesture.
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Sharper, "tick" sound
    oscillator.type = 'square'; 
    oscillator.frequency.setValueAtTime(1500, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.05);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
};
