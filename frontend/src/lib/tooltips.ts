import type { TabId } from "../types";

export const NAV_TOOLTIPS: Record<TabId, string> = {
  journey:
    "Your full shopping path: scan skin, get a routine, try on clothes, then save or ask for advice.",
  skin: "Quick skin analysis with condition breakdown and product matches.",
  fashion: "Virtual fitting room — see outfits on your photo before you buy.",
  triage:
    "Chat about products and skin care. Works best after a scan on Home.",
};

export const STEP_TOOLTIPS: Record<string, string> = {
  scan: "Take a clear selfie. We analyze acne, dryness, sun damage, and more.",
  routine:
    "Morning and evening products picked for your skin, with prices and reasons.",
  tryon: "Upload a body photo to preview our suggested outfit with AR try-on.",
  save: "Save locally, share your summary, or open the care assistant.",
};

export const UI_TOOLTIPS = {
  skinScore:
    "0–100 score from your last scan. Higher usually means healthier-looking skin in our model.",
  settings:
    "App settings and demo mode for testing when APIs or networks fail.",
  shopFor:
    "Products are filtered for your region — prices and picks match local catalogues.",
  scoreRing:
    "Based on Perfect Corp AI skin analysis. Not a medical diagnosis.",
  morningRoutine: "SPF and light care for daytime protection.",
  eveningRoutine: "Treatments and moisturizers while your skin repairs overnight.",
  pickedForYou: "Each item matches conditions detected in your scan.",
  resilienceDemo:
    "Turn on to simulate outages — the app still completes your journey using backups.",
  careAssistant:
    "OTC guidance only. See a doctor for severe, spreading, or painful symptoms.",
  virtualTryOn:
    "Powered by Perfect Corp Clothes API. Use a front-facing, well-lit photo for best results.",
  uploadGallery:
    "No camera? Upload an existing photo from your gallery instead.",
  shareRoutine: "Copy or share your score, products, and try-on pick with friends or family.",
};
