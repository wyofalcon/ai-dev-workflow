import React, { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthContext.js";

const WebLlmContext = createContext(null);

export const DEFAULT_MODEL = "gemini-2.0-flash"; // Just for reference

export function WebLlmProvider({ children }) {
  const { createAuthAxios } = useAuth();
  
  // State for compatibility
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Always ready for server-side
  const isReady = true;
  const isLoading = false;
  const progress = null;
  const aiMode = "server";
  const hasDeclinedLocalAI = true;
  const shouldShowLocalAISetup = false;
  const shouldNudgeLocalAI = false;
  const serverCallCount = 0;
  const lastUsedSource = "server";

  // No-op functions for compatibility
  const setAiMode = useCallback(() => {}, []);
  const enableLocalAI = useCallback(() => {}, []);
  const dismissNudge = useCallback(() => {}, []);
  const initializeModel = useCallback(() => {}, []);
  const resetChat = useCallback(() => {}, []);

  /**
   * Unified generation function (always server-side now)
   */
  const generateServer = useCallback(async (messages, taskType, onUpdate, onDone, onError) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const authAxios = await createAuthAxios();
      
      const response = await authAxios.post('/ai/generate', {
        messages,
        taskType: taskType || 'general'
      });

      const text = response.data.response;
      onUpdate?.(text); // For compatibility with streaming usage if any
      onDone?.(text);
      return { source: "server", response: text };
    } catch (err) {
      console.error("Server AI generation failed:", err);
      const errMsg = err.message || "AI generation failed";
      setError(errMsg);
      onError?.(errMsg);
      return { source: "error", error: err };
    } finally {
      setIsGenerating(false);
    }
  }, [createAuthAxios]);

  const generate = useCallback((messages, onUpdate, onDone, onError) => {
    generateServer(messages, 'general', onUpdate, onDone, onError);
  }, [generateServer]);

  const generateWithFallback = useCallback((messages, taskType, onUpdate, onDone, onError) => {
    return generateServer(messages, taskType, onUpdate, onDone, onError);
  }, [generateServer]);

  /**
   * Organize skills (always server-side)
   */
  const organizeSkillsWithFallback = useCallback(async (skills, onDone, onError) => {
    try {
      setIsGenerating(true);
      const authAxios = await createAuthAxios();
      
      const response = await authAxios.post('/ai/organize-skills', { skills });
      onDone?.({ ...response.data, source: "server" });
      return { source: "server" };
    } catch (err) {
      console.error("Server skill organization failed:", err);
      onError?.(err.message || "Skill organization failed");
      return { source: "error", error: err };
    } finally {
      setIsGenerating(false);
    }
  }, [createAuthAxios]);

  return (
    <WebLlmContext.Provider
      value={{
        isReady,
        isLoading,
        isGenerating,
        progress,
        error,
        aiMode,
        setAiMode,
        hasDeclinedLocalAI,
        enableLocalAI,
        shouldShowLocalAISetup,
        shouldNudgeLocalAI,
        serverCallCount,
        lastUsedSource,
        dismissNudge,
        initializeModel,
        generate,
        generateWithFallback,
        organizeSkillsWithFallback,
        resetChat
      }}
    >
      {children}
    </WebLlmContext.Provider>
  );
}

export const useWebLlm = () => {
  const context = useContext(WebLlmContext);
  if (!context) {
    throw new Error("useWebLlm must be used within a WebLlmProvider");
  }
  return context;
};