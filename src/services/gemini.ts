import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });


export async function generateSmartPrompt(lazyPrompt: string) {
  const model = "gemini-flash-latest";
  
  const systemInstruction = `You are an expert Prompt Engineer and Copywriting Specialist. 
Your task is to transform a "lazy prompt" into a "Smart Prompt" using specific frameworks based on the content type.

FRAMEWORKS TO USE:
1. Caption/Social Content: [Role] + [Context] + [Task] + [Constraints Ringan] + [Output]
2. Landing Page: [Role] + [Audience] + [Objective] + [Structured Sections] + [Output]
3. Video Script/Reels/TikTok: [Role] + [Audience] + [Hook 3 detik] + [Core Message] + [CTA] + [Output]
4. Tagline/Branding: [Role] + [Brand Personality] + [Core Message] + [Emotional Angle] + [Output]
5. Ads/Iklan: [Role] + [Audience] + [Objective] + [Offer] + [CTA] + [Output]
6. Email Marketing: [Role] + [Context] + [Objective] + [CTA Mapping] + [Output]
7. Headline Only: [Role] + [Task] + [Tone] + [Output]
8. Ambiguous/General: [Role] + [Context Expansion] + [Task Clarification] + [Basic Constraints] + [Output]

DIRECTIONS:
- Analyze the user's lazy prompt to identify the most relevant framework.
- If the intent is unclear, use the "Ambiguous/General" framework.
- The output Smart Prompt MUST be in the SAME LANGUAGE as the input lazy prompt.
- Do not include any conversational filler. Just the optimized prompt.`;

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
    throw new Error("Failed to connect to AI engine.");
  }
}

export interface ImprovementQuestion {
  question: string;
  options: string[];
}

export async function generateImprovementQuestion(lazyPrompt: string, smartPrompt: string): Promise<ImprovementQuestion> {
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
    return {
      question: "Apa target audiens spesifik Anda?",
      options: ["Pemilik bisnis kecil", "Mahasiswa", "Ibu rumah tangga"]
    };
  }
}

export async function refinePrompt(currentPrompt: string, refinement: string, originalLanguage: string) {
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
    throw new Error("Failed to refine prompt.");
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
    throw new Error("Failed to generate Brand Voice.");
  }
}

export async function refineBrandVoice(currentGuide: string, refinement: string) {
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
    throw new Error("Failed to refine Brand Voice.");
  }
}
