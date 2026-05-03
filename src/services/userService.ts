
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, addDoc } from "firebase/firestore"; 
import { db, auth } from './firebase';

// --- Definisi Tipe dan Konstanta ---

export const BRAND_VOICE_LIMITS = {
  generate: 3,
  refine: 3,
  download: 3,
};

export const PROMPT_ENGINE_LIMITS = {
  generate: 5,
  refine: 5,
};

export const PRO_BRAND_VOICE_LIMITS = {
  generate: 5,
  refine: 5,
  download: 5,
};

export const PRO_PROMPT_ENGINE_LIMITS = {
  generate: 450,
  refine: 150,
};

export type Feature = 'brandVoice' | 'promptEngine';
export type Action = 'generate' | 'refine' | 'download';

export interface UserUsage {
  brandVoice: {
    generate: number;
    refine: number;
    download: number;
  };
  promptEngine: {
    generate: number;
    refine: number;
  };
}

export interface UserData {
  plan?: 'free' | 'pro';
  isPro?: boolean;
  usage: UserUsage;
  lastUpdate: any;
}

export interface FeedbackData {
    lazyPrompt: string;
    finalPrompt: string; // Ini adalah smartPrompt setelah refine
    generatedOutput: string;
    feedbackValue: 'like' | 'dislike';
}

// --- Fungsi Utama ---

const getCurrentUserId = (): string | null => {
  return auth.currentUser ? auth.currentUser.uid : null;
};

export const getUserData = async (): Promise<UserData | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  const defaultUsage: UserUsage = {
    brandVoice: { generate: 0, refine: 0, download: 0 },
    promptEngine: { generate: 0, refine: 0 },
  };

  if (userSnap.exists()) {
    const data = userSnap.data();

    if (!data.usage) {
      await updateDoc(userRef, {
        usage: defaultUsage,
        lastUpdate: serverTimestamp()
      });
      return { ...data, usage: defaultUsage } as UserData;
    }
    
    return data as UserData;

  } else {
    const newUser: UserData = {
      isPro: false,
      plan: 'free',
      usage: defaultUsage,
      lastUpdate: serverTimestamp(),
    };
    await setDoc(userRef, newUser);
    return newUser;
  }
};

export const canPerformAction = async (feature: Feature, action: Action): Promise<boolean> => {
    const userData = await getUserData();
    if (!userData) {
        console.log('Action denied: User not logged in.');
        return false;
    }

    const isPro = userData.plan === 'pro' || userData.isPro === true;
    const usage = userData.usage;

    const limits = isPro
        ? {
            brandVoice: PRO_BRAND_VOICE_LIMITS,
            promptEngine: PRO_PROMPT_ENGINE_LIMITS,
        }
        : {
            brandVoice: BRAND_VOICE_LIMITS,
            promptEngine: PROMPT_ENGINE_LIMITS,
        };

    const featureLimits = limits[feature];

    if (!(action in featureLimits)) {
        console.error(`Action denied: Action '${action}' is not valid for feature '${feature}'.`);
        return false;
    }

    const limit = featureLimits[action as keyof typeof featureLimits];

    const featureUsage = usage?.[feature];

    if (!featureUsage || typeof (featureUsage as any)[action] !== 'number') {
        console.error(`Action denied: Invalid or missing usage data for feature '${feature}' and action '${action}'.`);
        return false;
    }

    const currentCount = (featureUsage as any)[action];

    const canPerform = currentCount < limit;
    console.log(`User: ${getCurrentUserId()}, Pro: ${isPro}, Feature: ${feature}, Action: ${action}, Count: ${currentCount}, Limit: ${limit}, Allowed: ${canPerform}`);

    return canPerform;
};

export const incrementUsage = async (feature: Feature, action: Action): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const userRef = doc(db, "users", userId);
  const fieldToIncrement = `usage.${feature}.${action}`;

  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    await updateDoc(userRef, {
      [fieldToIncrement]: increment(1),
      lastUpdate: serverTimestamp(),
    });
  } else {
    console.error(`Gagal increment: Dokumen pengguna ${userId} tidak ditemukan.`);
  }
};

export const submitFeedback = async (data: FeedbackData): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) {
        console.error("Feedback submission failed: User not authenticated.");
        return;
    }

    try {
        await addDoc(collection(db, "feedback"), {
            userId: userId,
            timestamp: serverTimestamp(),
            ...data
        });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        // Anda bisa menambahkan penanganan error yang lebih baik di sini, misalnya memberi tahu user
    }
};