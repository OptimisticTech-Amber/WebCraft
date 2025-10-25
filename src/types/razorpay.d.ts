/**
 * Minimal ambient declaration for the `razorpay` package.
 * Treats the module as 'any' while allowing basic method typing where useful.
 */
declare module "razorpay" {
  type RazorpayOrder = {
    id?: string;
    amount?: number;
    currency?: string;
    receipt?: string;
    [k: string]: any;
  };

  class Razorpay {
    constructor(opts: { key_id: string; key_secret: string });
    orders: {
      create(opts: Partial<RazorpayOrder>): Promise<RazorpayOrder>;
      fetch?(id: string): Promise<RazorpayOrder>;
      [k: string]: any;
    };
    payments?: { [k: string]: any };
    subscriptions?: { [k: string]: any };
  }

  const value: any;
  export default value;
}

export {};
declare module "razorpay" {
  // Minimal ambient declaration for razorpay: treat as `any` to avoid installing @types.
  // Extend this if you want stricter types for orders/subscriptions.
  const Razorpay: any;
  export default Razorpay;
}
