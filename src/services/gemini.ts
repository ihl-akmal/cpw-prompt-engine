
import { GoogleGenAI } from "@google/genai";

// --- The "Saklar" / Switch ---
// We use a Vite environment variable to check if we are in "mock" mode.
const IS_MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

// --- Helper function for mock delays ---
const mockApiCall = <T>(data: T, delay = 1000): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log("--- MOCK API CALLED ---", { data });
      resolve(data);
    }, delay);
  });
};

const mockApiError = (message: string, delay = 500): Promise<any> => {
   return new Promise((_, reject) => {
    setTimeout(() => {
        console.error("--- MOCK API ERROR ---", { message });
        reject(new Error(message));
    }, delay);
   });
};

// --- Mock Implementations ("Koki Palsu") ---

const mockGenerateSmartPrompt = (lazyPrompt: string) => {
    if (lazyPrompt.toLowerCase().includes("error_token")) {
        return mockApiError('TOKEN');
    }
    const mockOutput = `[CONTOH DARI MODE UJI]

**Role:** Expert Social Media Manager
**Context:** Anda sedang mempromosikan produk kopi baru bernama "Senja Blend," yang memiliki cita rasa lembut dan menenangkan.
**Task:** Buatlah sebuah caption untuk Instagram yang mengajak audiens untuk bersantai di sore hari dengan kopi ini.
**Constraints:** Caption harus kurang dari 200 karakter dan menyertakan hashtag #SenjaBlend dan #WaktuSantai.
**Output:** [Tulis caption di sini]`;
    return mockApiCall(mockOutput);
};

const mockGenerateImprovementQuestion = (): Promise<ImprovementQuestion> => {
    const mockOutput: ImprovementQuestion = {
        question: "[MODE UJI] Platform media sosial mana yang menjadi target utama Anda?",
        options: ["Instagram", "Twitter (X)", "Facebook", "LinkedIn"]
    };
    return mockApiCall(mockOutput);
};

const mockRefinePrompt = (currentPrompt: string): Promise<string> => {
    const mockOutput = `${currentPrompt}\n\n---\n**Refinement (dari Mode Uji):** Target audiens diubah menjadi "profesional muda yang sibuk".`;
    return mockApiCall(mockOutput);
};

const mockGenerateBrandVoice = (input: BrandVoiceInput): Promise<string> => {
     if (input.name.toLowerCase().includes("error_safety")) {
        return mockApiError('SAFETY');
    }
    const mockOutput = `[CONTOH DARI MODE UJI]

### 1. Brand Personality: Sang Mentor Bijak

**Persona:** Bayangkan seorang mentor atau kakak senior yang sudah berpengalaman. Dia tidak menggurui, tetapi membimbing dengan sabar. Dia memberikan nasihat yang praktis, menenangkan, dan selalu ada untuk membantu audiens mencapai tujuan mereka.

### 2. Tone:
- **Profesional:** Selalu terstruktur, jelas, dan berbasis data.
- **Menenangkan:** Menggunakan bahasa yang mengurangi kecemasan dan memberikan rasa pasti.
- **Empatik:** Menunjukkan pemahaman mendalam terhadap masalah yang dihadapi audiens.

### 3. Language Style Guide:
- **Word Choice:** Gunakan kata-kata seperti "Solusi," "Panduan," "Strategi," "Langkah-demi-langkah," "Terbukti." Hindari jargon yang terlalu teknis kecuali jika dijelaskan.
- **Sentence Structure:** Kalimat jelas, tidak terlalu panjang. Gunakan daftar (bullet points) untuk memecah informasi kompleks.

### 4. Do's & Don'ts:
- **DO:** Berikan contoh nyata, gunakan studi kasus, berfokus pada manfaat jangka panjang.
- **DON'T:** Jangan terdengar sombong, jangan memberikan janji yang berlebihan, hindari bahasa yang terlalu santai atau slang.
`;
    return mockApiCall(mockOutput);
};


// --- Original API Functions (Now with "Pembelokkan") ---

export async function generateSmartPrompt(lazyPrompt: string) {
  // Pembelokkan terjadi di sini
  if (IS_MOCK_MODE) {
    return mockGenerateSmartPrompt(lazyPrompt);
  }

  const model = "gemini-flash-latest";
  const systemInstruction = `You are an expert Prompt Engineer and Copywriting Specialist. 
Your task is to transform a "lazy prompt" into a "Smart Prompt" using specific frameworks based on the content type.

Follow this logic:
1.  Analyze the lazy prompt. Compare it against the specific frameworks listed below (1-7).
2.  Find a clear match. If the prompt's intent clearly and directly matches one of the frameworks, use that framework.
3.  CRITICAL: If there is no clear match, you MUST use Framework 8 (Ambiguous/General). This is the designated fallback for all unexpected, creative, or unclear user inputs. Do not try to force a fit into frameworks 1-7.

FRAMEWORKS TO USE:
1. Caption/Social Content: [Role] + [Context] + [Task] + [Constraints Ringan] + [Output]
2. Landing Page: [Role] + [Audience] + [Objective] + [Structured Sections] + [Output]
3. Video Script/Reels/TikTok: [Role] + [Audience] + [Hook 3 detik] + [Core Message] + [CTA] + [Output]
4. Tagline/Branding: [Role] + [Brand Personality] + [Core Message] + [Emotional Angle] + [Output]
5. Ads/Iklan: [Role] + [Audience] + [Objective] + [Offer] + [CTA] + [Output]
6. Email Marketing: [Role] + [Context] + [Objective] + [CTA Mapping] + [Output]
7. Headline Only: [Role] + [Task] + [Tone] + [Output]
8. Ambiguous/General (FALLBACK): [Role] + [Context Expansion] + [Task Clarification] + [Basic Constraints] + [Output]

FINAL RULES:
- The output Smart Prompt MUST be in the Same Language as the input lazy prompt.
- Do not include any conversational filler, introductory phrases, or explanations. Output ONLY the resulting Smart Prompt.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Transform this lazy prompt into a professional smart prompt: "${lazyPrompt}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Failed to generate prompt. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export interface ImprovementQuestion {
  question: string;
  options: string[];
}

export async function generateImprovementQuestion(lazyPrompt: string, smartPrompt: string): Promise<ImprovementQuestion> {
  if (IS_MOCK_MODE) {
    return mockGenerateImprovementQuestion();
  }
    
  const model = "gemini-flash-latest";
  const systemInstruction = `You are a Prompt Engineering Consultant. 
Analyze the user's initial "lazy prompt" and the "smart prompt" we generated.
Identify ONE key missing element or area for improvement (e.g., Target Audience, Specific Goal, Tone, or Platform Constraints).
Generate a question to ask the user to help refine the prompt.
Also provide 3-4 short example answers (options) the user might choose from.

CRITICAL: The question and options MUST be in the SAME LANGUAGE as the lazy prompt.

Return the result as a JSON object:
{
  "question": "The question to ask",
  "options": ["Option 1", "Option 2", "Option 3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Initial Prompt: "${lazyPrompt}"\nCurrent Smart Prompt: "${smartPrompt}"\nGenerate a refinement question and options.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    return JSON.parse(text) as ImprovementQuestion;
  } catch (error) {
    console.error("Gemini Question Error:", error);
    throw error;
  }
}

export async function refinePrompt(currentPrompt: string, refinement: string, originalLanguage: string) {
  if (IS_MOCK_MODE) {
    return mockRefinePrompt(currentPrompt);
  }

  const model = "gemini-flash-latest";
  const systemInstruction = `You are an expert Prompt Engineer. 
Take the current prompt and apply the following refinement instruction to it.
Maintain the professional structure (Role, Context, Task, Constraints, Output Format).
CRITICAL: The output MUST be in the SAME LANGUAGE as the original prompt (${originalLanguage}).
Return only the new, refined prompt.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Current Prompt: "${currentPrompt}"\nRefinement: "${refinement}"`,
      config: {
        systemInstruction,
      },
    });

    return response.text || currentPrompt;
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    throw error;
  }
}

export interface BrandVoiceInput {
  name: string;
  industry: string;
  audience: string;
  adjectives: string[];
  antiVoice: string;
  example?: string;
}

export async function generateBrandVoice(input: BrandVoiceInput) {
    if (IS_MOCK_MODE) {
        return mockGenerateBrandVoice(input);
    }

  const model = "gemini-flash-latest";
  const systemInstruction = `You are a Senior Brand Strategist and Copywriting Expert.
Your task is to create a comprehensive Brand Voice Guide based on the provided inputs.
The output should be structured as follows:
1. Brand Personality Analysis: Give the brand a persona name (e.g., 'The Nurturing Sister') and explain how they speak and interact.
2. Tone: Describe the overall tone (e.g., Warm, Professional, Energetic).
3. Language Style Guide: Detailed guidelines on word choice, sentence structure, and vocabulary.
4. Do's & Don'ts: A clear list of what to do and what to avoid in communication.

CRITICAL: The output MUST be in the same language as the input provided (Indonesian if input is Indonesian).
Format the output using clear Markdown headings and bullet points.`;

  const prompt = `
Brand Name: ${input.name}
Industry: ${input.industry}
Target Audience: ${input.audience}
Adjectives: ${input.adjectives.join(", ")}
Anti-Voice (Avoid): ${input.antiVoice}
Example Sentence: ${input.example || "N/A"}

Please generate the Brand Voice Guide.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text || "Failed to generate Brand Voice.";
  } catch (error) {
    console.error("Gemini Brand Voice Error:", error);
    throw error;
  }
}

// Mock for refineBrandVoice is simple for now
export async function refineBrandVoice(currentGuide: string, refinement: string) {
    if (IS_MOCK_MODE) {
        const mockOutput = `${currentGuide}\n\n---\n**Refinement (dari Mode Uji):** ${refinement}`;
        return mockApiCall(mockOutput);
    }

    const model = "gemini-flash-latest";
    const systemInstruction = `You are a Senior Brand Strategist.
Take the current Brand Voice Guide and apply the following refinement instruction to it.
Maintain the structure (Personality, Tone, Style Guide, Do's & Don'ts).
Return only the new, refined guide in Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Current Guide: "${currentGuide}"\nRefinement: "${refinement}"`,
      config: {
        systemInstruction,
      },
    });

    return response.text || currentGuide;
  } catch (error) {
    console.error("Gemini Brand Voice Refine Error:", error);
    throw error;
  }
}
