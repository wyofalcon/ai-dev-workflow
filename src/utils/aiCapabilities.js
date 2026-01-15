/**
 * Utility functions to check for AI capabilities (Local Extension + WebGPU)
 */

export const checkExtensionInstalled = () => {
  return document.documentElement.getAttribute('data-cvstomize-extension-installed') === 'true';
};

export const checkWebGPUSupport = async () => {
  if (!navigator.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch (e) {
    console.warn('WebGPU check failed:', e);
    return false;
  }
};
