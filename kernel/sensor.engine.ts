/**
 * sensor.engine.ts
 *
 * Handles all physical and virtual sensor inputs:
 *   - Voice transcripts (mic)
 *   - Proximity / presence detection
 *   - Gesture recognition (hand tracking, body pose)
 *   - Gaze / eye tracking (VR headsets)
 *   - Accelerometer / gyroscope (mobile / wearables)
 *   - Ambient light / temperature / pressure (IoT nodes)
 *   - Camera privacy frames (re-uses camera.engine hooks)
 *
 * Sensor data is:
 *   1. Normalised into a SensorEvent
 *   2. Passed to intention.engine for context enrichment
 *   3. Forwarded to learning.engine to record experience
 *   4. Broadcast to any subscribed VR/UI layer via broadcastNodeUpdate
 */

import { broadcastEvent } from "./broadcast.engine.js";
import { learnSensorEvent }    from "./learning.engine.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SensorType =
  | "voice"           // microphone transcript / wake word
  | "gesture"         // hand gesture, swipe, pinch, point
  | "gaze"            // eye tracking (VR headset)
  | "proximity"       // distance from device / screen
  | "accelerometer"   // motion / tilt
  | "gyroscope"       // rotation
  | "heartrate"       // wearable health sensor
  | "ambient_light"   // environment
  | "temperature"     // IoT room sensor
  | "pressure"        // IoT / wearable
  | "touch"           // touch screen or haptic glove
  | "location"        // GPS or indoor positioning
  | "camera_privacy"  // camera content analysis result
  | "custom";

export interface SensorEvent {
  event_id:   string;
  owner_id:   string;
  device_id:  string;
  type:       SensorType;
  value:      unknown;          // normalised value
  raw?:       unknown;          // original payload
  confidence: number;           // 0–1 sensor accuracy
  timestamp:  string;
}

export interface VoiceSensorData {
  transcript:   string;
  final:        boolean;        // interim vs final result
  language?:    string;
  is_wake_word: boolean;        // "Hey Yunaan"
}

export interface GestureSensorData {
  gesture: "point" | "pinch" | "spread" | "fist" | "open_palm" | "thumbs_up" | "thumbs_down" | "swipe_left" | "swipe_right" | "swipe_up" | "swipe_down" | "rotate" | "custom";
  hand?:   "left" | "right" | "both";
  target_node_id?: string;      // what node is the gesture aimed at
  velocity?:       number;
}

export interface GazeSensorData {
  focused_element?:  string;    // DOM / VR element ID
  dwell_time_ms?:    number;    // how long looking at it
  blink_rate?:       number;    // blinks/min (stress indicator)
}

export interface LocationSensorData {
  lat:       number;
  lng:       number;
  accuracy?: number;
  indoor?:   { floor?: number; room?: string };
  context?:  "home" | "work" | "transit" | "public" | "unknown";
}

// ── In-memory sensor state per user/device ────────────────────────────────────

interface SensorState {
  last_voice_transcript: string;
  last_gesture:          GestureSensorData | null;
  last_gaze:             GazeSensorData    | null;
  last_location:         LocationSensorData | null;
  heartrate_bpm:         number | null;
  activity:              "still" | "walking" | "running" | "driving" | "unknown";
  presence:              boolean;           // is user present/active?
}

const sensorStateMap = new Map<string, SensorState>();

function getState(ownerId: string): SensorState {
  if (!sensorStateMap.has(ownerId)) {
    sensorStateMap.set(ownerId, {
      last_voice_transcript: "",
      last_gesture:          null,
      last_gaze:             null,
      last_location:         null,
      heartrate_bpm:         null,
      activity:              "unknown",
      presence:              false,
    });
  }
  return sensorStateMap.get(ownerId)!;
}

// ── Core ingest ───────────────────────────────────────────────────────────────

/**
 * Ingest a sensor event from any device. Normalises, stores, learns, broadcasts.
 */
export function ingestSensorEvent(event: SensorEvent): SensorEvent {
  const state = getState(event.owner_id);

  switch (event.type) {
    case "voice": {
      const v = event.value as VoiceSensorData;
      if (v.final) {
        state.last_voice_transcript = v.transcript;
        learnSensorEvent(event.owner_id, "voice_transcript", { transcript: v.transcript.slice(0, 80) });
      }
      break;
    }
    case "gesture": {
      state.last_gesture = event.value as GestureSensorData;
      learnSensorEvent(event.owner_id, "gesture", { gesture: (event.value as GestureSensorData).gesture });
      break;
    }
    case "gaze": {
      state.last_gaze = event.value as GazeSensorData;
      break;
    }
    case "location": {
      const loc = event.value as LocationSensorData;
      state.last_location = loc;
      learnSensorEvent(event.owner_id, "location_update", { context: loc.context, indoor: !!loc.indoor });
      break;
    }
    case "proximity": {
      const v = event.value as { distance_cm: number };
      state.presence = v.distance_cm < 100;
      break;
    }
    case "heartrate": {
      state.heartrate_bpm = event.value as number;
      // Alert if elevated (stress / emergency heuristic)
      if ((event.value as number) > 130) {
        learnSensorEvent(event.owner_id, "high_heartrate", { bpm: event.value });
      }
      break;
    }
    case "accelerometer": {
      const mag = event.value as { magnitude: number };
      if (mag.magnitude > 15)      state.activity = "running";
      else if (mag.magnitude > 5)  state.activity = "walking";
      else                         state.activity = "still";
      break;
    }
  }

  // Broadcast to VR/UI layer
  broadcastEvent(`sensor.${event.owner_id}`, "sensor_state", { ...state, last_event: event });

  return event;
}

// ── Context accessor ─────────────────────────────────────────────────────────

export function getSensorContext(ownerId: string): SensorState {
  return getState(ownerId);
}

export function isUserPresent(ownerId: string): boolean {
  return getState(ownerId).presence;
}

export function getLastVoiceTranscript(ownerId: string): string {
  return getState(ownerId).last_voice_transcript;
}

// ── VR-specific helpers ──────────────────────────────────────────────────────

export interface VRSessionState {
  active:      boolean;
  mode:        "dashboard" | "app" | "game" | "social" | "spatial_builder";
  focused_app?: string;
  hand_mode:   "pointer" | "grab" | "draw" | "type";
  spatial_pos: { x: number; y: number; z: number };
}

const vrSessions = new Map<string, VRSessionState>();

export function startVRSession(ownerId: string, mode: VRSessionState["mode"] = "dashboard"): VRSessionState {
  const session: VRSessionState = {
    active:     true,
    mode,
    hand_mode:  "pointer",
    spatial_pos: { x: 0, y: 1.6, z: 0 },
  };
  vrSessions.set(ownerId, session);
  learnSensorEvent(ownerId, "vr_session_start", { mode });
  broadcastEvent(`vr.${ownerId}`, "vr_session_start", session);
  return session;
}

export function updateVRSession(ownerId: string, patch: Partial<VRSessionState>): VRSessionState | null {
  const s = vrSessions.get(ownerId);
  if (!s) return null;
  Object.assign(s, patch);
  broadcastEvent(`vr.${ownerId}`, "vr_session_update", s);
  return s;
}

export function endVRSession(ownerId: string): void {
  vrSessions.delete(ownerId);
  learnSensorEvent(ownerId, "vr_session_end", {});
}

export function getVRSession(ownerId: string): VRSessionState | null {
  return vrSessions.get(ownerId) ?? null;
}
