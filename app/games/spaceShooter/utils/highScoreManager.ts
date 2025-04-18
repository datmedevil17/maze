export class HighScoreManager {
    private storageKey = 'spaceShooterHighScore_nextjs'; // Use a distinct key
    private currentHighScore: number;

    constructor() {
        this.currentHighScore = this.loadHighScore();
    }

     private loadHighScore(): number {
         // Check if running in browser context
         if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
             return 0;
         }
        try {
            const storedScore = localStorage.getItem(this.storageKey);
            return storedScore ? parseInt(storedScore, 10) : 0;
        } catch (e) {
            console.warn('Could not access localStorage for high score:', e);
            return 0;
        }
    }

    getHighScore(): number {
        // Return the cached value, load again if needed (e.g., for SSR safety)
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
             this.currentHighScore = this.loadHighScore();
        }
        return this.currentHighScore;
    }

    setHighScore(score: number): boolean {
         if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
             return false; // Cannot save without localStorage
         }
        if (score > this.currentHighScore) {
            try {
                localStorage.setItem(this.storageKey, score.toString());
                this.currentHighScore = score;
                return true; // New high score set
            } catch (e) {
                console.warn('Could not save high score to localStorage:', e);
            }
        }
        return false; // Score was not higher or save failed
    }

    // Optional: Reset function
    resetHighScore(): void {
         if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
             return;
         }
        try {
            localStorage.removeItem(this.storageKey);
            this.currentHighScore = 0;
        } catch (e) {
            console.warn('Could not reset high score in localStorage:', e);
        }
    }
}