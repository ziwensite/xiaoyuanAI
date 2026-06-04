export class SpeakController {
  private utterance: SpeechSynthesisUtterance | null = null;
  private generation = 0;
  onChange: ((speaking: boolean) => void) | null = null;

  start(text: string) {
    if (typeof speechSynthesis === "undefined") {
      console.warn("[xiaoyuanAI] speechSynthesis API not available in this environment");
      this.notifyChange(false);
      return;
    }
    this.stop();
    if (!text.trim()) return;
    const gen = ++this.generation;
    try {
      const cleanText = text.replace(/[#*_`\[\]]/g, "");
      this.utterance = new SpeechSynthesisUtterance(cleanText);
      this.utterance.lang = "zh-CN";
      this.utterance.rate = 1.0;
      this.utterance.onend = () => {
        if (this.generation !== gen) return;
        this.notifyChange(false);
      };
      this.utterance.onerror = (e) => {
        if (this.generation !== gen) return;
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("[xiaoyuanAI] speechSynthesis error:", e.error);
        }
        this.notifyChange(false);
      };
      speechSynthesis.speak(this.utterance);
      this.notifyChange(true);
    } catch (err) {
      console.warn("[xiaoyuanAI] failed to start speech synthesis:", err);
      this.utterance = null;
      this.notifyChange(false);
    }
  }

  stop() {
    this.generation++;
    if (typeof speechSynthesis !== "undefined") {
      try { speechSynthesis.cancel(); } catch (err) {
        console.warn("[xiaoyuanAI] speechSynthesis.cancel failed:", err);
      }
    }
    this.utterance = null;
    this.notifyChange(false);
  }

  private notifyChange(speaking: boolean) {
    try { this.onChange?.(speaking); } catch (err) {
      console.warn("[xiaoyuanAI] onChange callback failed:", err);
    }
  }
}
