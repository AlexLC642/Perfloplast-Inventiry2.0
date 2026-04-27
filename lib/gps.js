import { openDB } from 'idb';

const DB_NAME = 'perflo_gps_db';
const STORE_NAME = 'pending_locations';

// Initialize IndexedDB
async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

// Logic to record a coordinate with "Anti-Rebound" filter
export async function recordLocation(lat, lng, accuracy) {
  // 1. Filter by accuracy (Skip if accuracy is > 50 meters to avoid jumps)
  if (accuracy > 50) return;

  const locationData = {
    lat,
    lng,
    timestamp: new Date().toISOString(),
    accuracy
  };

  if (navigator.onLine) {
    try {
      await sendToServer(locationData);
      // If sync successful, try to send pending ones
      await syncPendingLocations();
    } catch (e) {
      await saveLocally(locationData);
    }
  } else {
    // If no signal, save locally to IndexedDB
    await saveLocally(locationData);
  }
}

async function saveLocally(data) {
  const db = await initDB();
  await db.add(STORE_NAME, data);
  console.log('📍 Location saved locally (No signal)');
}

async function sendToServer(data) {
  const response = await fetch('/api/logistics/tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Sync failed');
}

export async function syncPendingLocations() {
  const db = await initDB();
  const allPending = await db.getAll(STORE_NAME);
  
  if (allPending.length === 0) return;

  console.log(`🔄 Syncing ${allPending.length} pending locations...`);
  
  for (const loc of allPending) {
    try {
      await sendToServer(loc);
      await db.delete(STORE_NAME, loc.id);
    } catch (e) {
      break; // Stop if server still down
    }
  }
}
