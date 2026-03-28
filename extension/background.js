// FormFillAI Chrome Extension — Background Service Worker
// Handles Firebase Auth state and message passing

// Firebase via importScripts (CDN compat shim for service workers)
// Note: Extension uses REST API for Firebase to avoid module import issues in SW

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDDCJQHjclB8cWnuKV2tGy87vg2Tsb7IoI",
  projectId: "formfiller-pro-1eb71"
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PING') {
    sendResponse({ status: 'alive' });
  }
  return true;
});

// On install
chrome.runtime.onInstalled.addListener(() => {
  console.log('FormFillAI Extension installed');
});
