import { describe, it, expect, beforeEach } from "vitest";
import {
  registerWallet,
  createOrder,
  captureTransaction,
  rollbackTransaction,
  getLedger,
} from "../../kernel/dravyam.engine.js";
import { computeFraudScore, shouldBlockTransaction } from "../../kernel/fraud.engine.js";
import { validateWebhookSignature, signWebhookPayload } from "../../kernel/webhook.engine.js";
import { computeProfileCompletion, walletLimitMultiplier } from "../../kernel/profile.engine.js";
import type { WalletNode } from "../../shared/types/payment.types.js";
import type { VanshawaliProfile, TrustNode } from "../../shared/types/profile.types.js";

// ─── Test Wallets ─────────────────────────────────────────────────────────────

function makeWallet(id: string, inr = 10000): WalletNode {
  return {
    wallet_id: id,
    owner_id: "user.test",
    kyc_status: "verified",
    balances: {
      DRAVYAM: { available: 1000, locked: 0 },
      INR:     { available: inr,  locked: 0 },
      USD:     { available: 0,    locked: 0 },
      AED:     { available: 0,    locked: 0 },
      EUR:     { available: 0,    locked: 0 },
    },
    linked_banks:  [],
    linked_cards:  [],
    daily_limit:   { INR: 100000 },
    is_frozen:     false,
  };
}

// ─── Minimal VanshawaliProfile ────────────────────────────────────────────────

function emptyProfile(): VanshawaliProfile {
  return {
    personal:   { full_name: "", nickname: "", gender: "", date_of_birth: "", age: null, marital_status: "", blood_group: "", height_cm: null, religion: "", community: "", bio: "", languages_known: [] },
    contact:    { phone: { value: "", privacy: "private" }, email: { value: "", privacy: "private" }, whatsapp: { value: "", privacy: "friends" }, telegram_id: { value: "", privacy: "public" }, emergency_contact: { name: "", phone: "", relation: "", privacy: "family" }, alternate_contact: { value: "", privacy: "family" } },
    location:   { current_address: { line1: "", line2: "", village: "", city: "", district: "", state: "", country: "India", postal_code: "" }, permanent_address: { line1: "", line2: "", village: "", city: "", district: "", state: "", country: "India", postal_code: "" }, geo: { latitude: null, longitude: null }, migration_history: [] },
    social:     { linkedin: "", instagram: "", facebook: "", twitter_x: "", youtube: "", github: "", website: "", blog: "" },
    family:     { members: [] },
    education:  { highest_qualification: "", entries: [] },
    profession: { occupation: "", company_name: "", role: "", experience_years: null, industry: "", skills: [], certifications: [], income_range: "" },
    preference: { hobbies: [], interests: [], likes: [], dislikes: [], food_preference: "", lifestyle: "", goals: [] },
    property:   { house: [], land: [], vehicles: [], business_ownership: [], investments: [] },
    media:      { profile_photo: null, background_photo: null, documents: [], certificates: [], family_photos: [] },
    trust:      { profile_completion_score: 0, verification_level: "unverified", family_connections: 0, activity_score: 0, karma_score: 0, completion_breakdown: { basic_info: { weight: 20, filled: false }, contact: { weight: 10, filled: false }, location: { weight: 10, filled: false }, education: { weight: 10, filled: false }, profession: { weight: 10, filled: false }, family: { weight: 20, filled: false }, preferences: { weight: 10, filled: false }, media: { weight: 10, filled: false } } },
  };
}

function baseTrust(): TrustNode {
  return emptyProfile().trust;
}

// ─── dravyam.engine ───────────────────────────────────────────────────────────

describe("dravyam.engine", () => {
  beforeEach(() => {
    registerWallet(makeWallet("w_sender", 10000));
    registerWallet(makeWallet("w_receiver", 0));
  });

  it("createOrder locks funds and returns initiated status", () => {
    const { order, tx } = createOrder({
      from_wallet: "w_sender",
      to_wallet: "w_receiver",
      amount: 1000,
      currency: "INR",
      payment_method: "internal",
    });
    expect(order.status).toBe("initiated");
    expect(tx.fee).toBe(10); // 1% of 1000
    expect(tx.status).toBe("initiated");
  });

  it("captureTransaction credits receiver and writes ledger entry", () => {
    const { tx } = createOrder({ from_wallet: "w_sender", to_wallet: "w_receiver", amount: 500, currency: "INR", payment_method: "internal" });
    const entry = captureTransaction(tx);
    expect(tx.status).toBe("success");
    expect(entry.amount).toBe(500);
    expect(getLedger().length).toBeGreaterThan(0);
  });

  it("rollbackTransaction restores sender balance", () => {
    const { tx } = createOrder({ from_wallet: "w_sender", to_wallet: "w_receiver", amount: 200, currency: "INR", payment_method: "internal" });
    rollbackTransaction(tx);
    expect(tx.status).toBe("rolled_back");
    const { order: o2 } = createOrder({ from_wallet: "w_sender", to_wallet: "w_receiver", amount: 200, currency: "INR", payment_method: "internal" });
    expect(o2.status).toBe("initiated"); // funds were restored → second order succeeds
  });

  it("throws on insufficient balance", () => {
    expect(() =>
      createOrder({ from_wallet: "w_sender", to_wallet: "w_receiver", amount: 999999, currency: "INR", payment_method: "internal" })
    ).toThrow("Insufficient balance");
  });

  it("throws on frozen wallet", () => {
    const frozen = makeWallet("w_frozen", 5000);
    frozen.is_frozen = true;
    registerWallet(frozen);
    expect(() =>
      createOrder({ from_wallet: "w_frozen", to_wallet: "w_receiver", amount: 100, currency: "INR", payment_method: "internal" })
    ).toThrow("frozen");
  });
});

// ─── fraud.engine ─────────────────────────────────────────────────────────────

describe("fraud.engine", () => {
  const baseTx = {
    transaction_id: "tx_1",
    from_wallet: "w1",
    to_wallet: "w2",
    amount: 1000,
    currency: "INR" as const,
    payment_method: "internal" as const,
    status: "initiated" as const,
    timestamp: new Date().toISOString(),
    reference_id: "r1",
    fee: 10,
    fee_percent: 1,
    rollback_after_seconds: 60,
    fraud_score: 0,
  };

  it("returns risk_score 0 for clean transaction", () => {
    const signal = computeFraudScore(baseTx, { ip: "1.2.3.4", device_hash: "abc", velocity_count: 2, geo_mismatch: false });
    expect(signal.risk_score).toBe(0);
    expect(shouldBlockTransaction(signal)).toBe(false);
  });

  it("adds 30 points for geo mismatch", () => {
    const signal = computeFraudScore(baseTx, { ip: "1.2.3.4", device_hash: "abc", velocity_count: 2, geo_mismatch: true });
    expect(signal.risk_score).toBe(30);
  });

  it("blocks transaction with risk_score >= 70", () => {
    const signal = computeFraudScore(
      { ...baseTx, amount: 600000 },
      { ip: "1.2.3.4", device_hash: "abc", velocity_count: 25, geo_mismatch: true },
    );
    expect(shouldBlockTransaction(signal)).toBe(true);
  });
});

// ─── webhook.engine ───────────────────────────────────────────────────────────

describe("webhook.engine", () => {
  it("validates a correctly signed payload", () => {
    const ts = new Date().toISOString();
    const sig = signWebhookPayload("tx_123", 500, ts);
    expect(validateWebhookSignature({
      event: "payment.success",
      transaction_id: "tx_123",
      amount: 500,
      currency: "INR",
      signature: sig,
      timestamp: ts,
    })).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const ts = new Date().toISOString();
    const sig = signWebhookPayload("tx_123", 500, ts);
    expect(validateWebhookSignature({
      event: "payment.success",
      transaction_id: "tx_999", // tampered
      amount: 500,
      currency: "INR",
      signature: sig,
      timestamp: ts,
    })).toBe(false);
  });
});

// ─── profile.engine ───────────────────────────────────────────────────────────

describe("profile.engine — computeProfileCompletion()", () => {
  it("returns 0 for empty profile", () => {
    const trust = computeProfileCompletion(emptyProfile(), baseTrust());
    expect(trust.profile_completion_score).toBe(0);
  });

  it("adds 20 for basic_info filled", () => {
    const profile = emptyProfile();
    profile.personal.full_name = "Arjun";
    profile.personal.date_of_birth = "1990-01-01";
    const trust = computeProfileCompletion(profile, baseTrust());
    expect(trust.profile_completion_score).toBe(20);
    expect(trust.completion_breakdown.basic_info.filled).toBe(true);
  });

  it("scores 100 for fully filled profile", () => {
    const profile = emptyProfile();
    profile.personal.full_name = "Arjun";
    profile.personal.date_of_birth = "1990-01-01";
    profile.contact.phone.value = "+919999999999";
    profile.location.current_address.city = "Delhi";
    profile.education.highest_qualification = "B.Tech";
    profile.profession.occupation = "Engineer";
    profile.family.members.push({ member_id: "m1", relation: "father", name: "Ram", age: 60, profession: "", education: "", contact: "", location: "", node_ref: null });
    profile.preference.interests.push("coding");
    profile.media.profile_photo = "https://cdn.example.com/photo.jpg";
    const trust = computeProfileCompletion(profile, baseTrust());
    expect(trust.profile_completion_score).toBe(100);
  });
});

describe("profile.engine — walletLimitMultiplier()", () => {
  it("returns 1x below 50%",  () => expect(walletLimitMultiplier(30)).toBe(1));
  it("returns 1.5x at 50%",   () => expect(walletLimitMultiplier(50)).toBe(1.5));
  it("returns 3x at 80%",     () => expect(walletLimitMultiplier(80)).toBe(3));
  it("returns 3x at 100%",    () => expect(walletLimitMultiplier(100)).toBe(3));
});
