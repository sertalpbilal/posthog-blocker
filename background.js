let syncInProgress = false;

async function syncRules() {
  if (syncInProgress) return;
  syncInProgress = true;
  try {
    const { blocked = [] } = await chrome.storage.sync.get({ blocked: [] });

    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing.map((rule) => rule.id);

    const addRules = blocked.flatMap((host, i) => [
      {
        id: i * 2 + 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "||eu.i.posthog.com/",
          resourceTypes: ["xmlhttprequest", "ping"],
          initiatorDomains: [host],
        },
      },
      {
        id: i * 2 + 2,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "||us.i.posthog.com/",
          resourceTypes: ["xmlhttprequest", "ping"],
          initiatorDomains: [host],
        },
      },
    ]);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
  } catch (err) {
    console.error("syncRules failed:", err);
  } finally {
    syncInProgress = false;
  }
}

syncRules();

chrome.runtime.onStartup.addListener(syncRules);
chrome.runtime.onInstalled.addListener(syncRules);
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blocked) syncRules();
});
