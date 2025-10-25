/**
 * Robust Razorpay lazy loader and small helpers.
 * - Server-only: throws if executed in the browser runtime.
 * - Avoids static bundler resolution of the module name by concatenating
 *   the package string at runtime.
 * - Provides small convenience wrappers for creating orders and verifying
 *   webhook signatures.
 */

let _rzp: any = null;

function ensureServer() {
  if (typeof window !== "undefined") {
    throw new Error("Razorpay must only be used on the server side.");
  }
}

export async function getRazorpay(): Promise<any> {
  ensureServer();

  if (_rzp) return _rzp;

  const key_id = process.env.RZP_KEY_ID;
  const key_secret = process.env.RZP_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "RZP_KEY_ID or RZP_KEY_SECRET is not set. Razorpay cannot be initialized."
    );
  }

  // Prevent static bundlers from trying to resolve the module at build time
  // by constructing the package name at runtime.
  const pkgName = "ra" + "zorpay";

  let mod: any;
  try {
    // If a server-side require is available, prefer it to avoid ESM resolution
    // quirks in some Node environments.
    if (typeof (globalThis as any).require === "function") {
      mod = (globalThis as any).require(pkgName);
    } else {
      // dynamic import as fallback
      // note: `import(pkgName as any)` keeps static analysis from resolving
      mod = await import(pkgName as any);
    }
  } catch (err: any) {
    const msg =
      "Could not load 'razorpay' package. Install 'razorpay' and set RZP_KEY_ID / RZP_KEY_SECRET in your environment.";
    // Attach original error message for easier debugging
    const e = new Error(msg + (err && err.message ? ` - ${err.message}` : ""));
    throw e;
  }

  const Razorpay = (mod && (mod.default || mod)) as any;
  _rzp = new Razorpay({ key_id, key_secret });

  return _rzp;
}

/** Convenience wrapper: create an order for one-time payments. */
export async function createOrder(opts: {
  amount: number; // in smallest currency unit (e.g., paise)
  currency?: string;
  receipt?: string;
  [k: string]: any;
}) {
  const rzp = await getRazorpay();
  return rzp.orders.create({
    ...opts,
    currency: opts.currency || "INR",
    receipt: opts.receipt || undefined,
  });
}

/** Convenience wrapper: verify webhook signature */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret?: string
) {
  // Razorpay SDK exposes utils? Not guaranteed; implement simple HMAC SHA256
  // verification here to avoid depending on non-exported SDK internals.
  const sec = secret || process.env.RZP_WEBHOOK_SECRET;
  if (!sec)
    throw new Error(
      "RZP_WEBHOOK_SECRET not set; cannot verify webhook signature"
    );

  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", sec)
    .update(payload)
    .digest("hex");
  // Razorpay sends base64-encoded hmac? They use hex in many examples. Accept both.
  const sig = (signature || "").trim();
  return (
    sig === expected || sig === Buffer.from(expected, "hex").toString("base64")
  );
}

export default getRazorpay;
