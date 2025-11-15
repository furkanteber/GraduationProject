export interface AudioAnalysisResult {
  voice_score: number;
  transcript: string;
  features: {
    fft: {
      energy: number;
      mean_freq: number;
    };
    spectral: {
      mfcc_mean: number[];
      centroid_mean: number;
      rms_mean: number;
      tempo: number;
    };
  };
}

const API_BASE_URL = "http://127.0.0.1:8000";
const ANALYZE_AUDIO_URL = `${API_BASE_URL}/analyze-audio`;

export async function analyzeAudioFile(file: Blob): Promise<AudioAnalysisResult> {
  const formData = new FormData();
  // backend'de parametre adı audio idi
  formData.append("audio", file, "answer.webm");

  const res = await fetch(ANALYZE_AUDIO_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Ses analizi başarısız oldu");
  }

  return res.json();
}
