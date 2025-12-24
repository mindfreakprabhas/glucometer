
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSupportiveCopy = async (label: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 variations of supportive, non-judgmental notification text for a blood glucose reading for the routine time: "${label}". 
      Avoid words like 'forgot', 'failed', or 'required'. Use warm, clinical-yet-caring tone. 
      Examples: 'Time for your post-lunch check', 'Let's see how your body is feeling after breakfast'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [
      `Time for your ${label} check.`,
      `How are you feeling? It's time to log your ${label} reading.`,
      `Quick check-in: Time for your ${label} measurement.`,
      `Your health matters. Let's record that ${label} reading.`,
      `Ready for your ${label} log? It only takes a second.`
    ];
  }
};

export const getHealthInsights = async (logs: any[], summary: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these blood glucose stats for a patient's weekly review:
      - Time in Range: ${summary.timeInRange}%
      - Average Reading: ${summary.average} mg/dL
      - Logs Completed: ${summary.totalLogs}
      
      Provide a 2-sentence supportive summary and one specific non-medical piece of encouragement.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            encouragement: { type: Type.STRING }
          },
          required: ["summary", "encouragement"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return {
      summary: "You've been consistent with your tracking this week. Great job keeping your levels stable!",
      encouragement: "Consistency is key to understanding your patterns. Keep it up!"
    };
  }
};
