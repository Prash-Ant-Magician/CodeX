
export const playKeystrokeSound = () => {
    if (typeof window !== 'undefined' && window.AudioContext) {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
};
