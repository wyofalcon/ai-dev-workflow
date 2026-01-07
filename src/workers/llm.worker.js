/* eslint-disable no-restricted-globals */
import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

let engine = null;

// Handle messages from the main thread
self.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case "INIT":
      await initializeEngine(payload.modelId);
      break;
    case "GENERATE":
      await generateResponse(payload.messages, payload.options);
      break;
    case "RESET":
        if (engine) await engine.resetChat();
        break;
    default:
      console.warn("Unknown message type:", type);
  }
};

async function initializeEngine(modelId) {
  try {
    // Callback to report initialization progress
    const initProgressCallback = (report) => {
      self.postMessage({
        type: "PROGRESS",
        payload: report,
      });
    };

    // Create the engine
    engine = await CreateMLCEngine(modelId, {
      initProgressCallback,
    });

    self.postMessage({ type: "READY" });
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      payload: error.message,
    });
  }
}

async function generateResponse(messages, options = {}) {
  if (!engine) {
    self.postMessage({ type: "ERROR", payload: "Engine not initialized" });
    return;
  }

  try {
    const stream = await engine.chat.completions.create({
      messages,
      stream: true,
      ...options
    });

    let fullText = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      fullText += delta;
      
      self.postMessage({
        type: "UPDATE",
        payload: delta, // Send just the chunk for streaming effect
      });
    }

    self.postMessage({
      type: "DONE",
      payload: fullText,
    });
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      payload: error.message,
    });
  }
}
