import { getApiBaseUrl } from "@/config/env";

export interface ReferralData {
  referrer_id: string;
  referee_id?: string;
  referral_code: string;
  status: "pending" | "registered" | "first_payment_completed" | "rewarded";
  discount_percentage: number;
  expires_at: string;
  registration_date?: string;
  first_payment_date?: string;
  reward_date?: string;
}

export interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  active_referral_code: string | null;
  available_discounts: any[];
  referral_history: any[];
}

export interface ShareLinkResponse {
  share_url: string;
  referral_code: string;
  discount_percentage: number;
}

class ReferralService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    // Check if backend is available
    if (!this.baseUrl || this.baseUrl === "") {
      throw new Error("Backend API is not available");
    }

    const url = `${this.baseUrl}/referrals${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      // Add timeout and error handling
      signal: AbortSignal.timeout(10000), // 10 second timeout
    };

    try {
      console.log("🔗 Making referral API request to:", url);

      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `${errorMessage} - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Referral API response received");
      return data;
    } catch (error) {
      console.error("❌ Referral API request failed:", error);

      // Provide more specific error messages
      if (error.name === "AbortError" || error.name === "TimeoutError") {
        throw new Error("Request timeout - please check your connection");
      }

      if (error.message.includes("Failed to fetch")) {
        throw new Error("Unable to connect to server - please try again later");
      }

      throw error;
    }
  }

  // Generate or get referral code for user
  async generateReferralCode(userId: string): Promise<ReferralData> {
    try {
      const data = await this.makeRequest("/generate", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      return data.referral;
    } catch (error) {
      console.warn("Using fallback referral generation:", error);
      // Fallback: generate local referral code
      return this.generateLocalReferralCode(userId);
    }
  }

  // Local fallback for generating referral codes
  private generateLocalReferralCode(userId: string): ReferralData {
    const timestamp = Date.now().toString(36);
    const userPart = userId.slice(-4);
    const randomPart = Math.random().toString(36).substr(2, 4);
    const referralCode =
      `REF${userPart}${timestamp}${randomPart}`.toUpperCase();

    const referralData: ReferralData = {
      referrer_id: userId,
      referral_code: referralCode,
      status: "pending",
      discount_percentage: 50,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Store in localStorage as fallback
    localStorage.setItem(`referral_${userId}`, JSON.stringify(referralData));

    return referralData;
  }

  // Validate a referral code
  async validateReferralCode(code: string): Promise<{
    code: string;
    referrer_name: string;
    discount_percentage: number;
    expires_at: string;
    status: string;
  }> {
    const data = await this.makeRequest(`/validate/${code}`);
    return data.referral;
  }

  // Apply referral code during registration
  async applyReferralCode(
    referralCode: string,
    userId: string,
  ): Promise<{
    message: string;
    discount_percentage: number;
  }> {
    const data = await this.makeRequest("/apply", {
      method: "POST",
      body: JSON.stringify({ referralCode, userId }),
    });
    return {
      message: data.message,
      discount_percentage: data.discount_percentage,
    };
  }

  // Get user's referral statistics
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      const data = await this.makeRequest(`/stats/${userId}`);
      return data.stats;
    } catch (error) {
      console.warn("Using fallback referral stats:", error);
      // Fallback: return local stats
      return this.getLocalReferralStats(userId);
    }
  }

  // Local fallback for referral stats
  private getLocalReferralStats(userId: string): ReferralStats {
    // Try to get stats from localStorage
    const statsKey = `referral_stats_${userId}`;
    const existingStats = localStorage.getItem(statsKey);

    if (existingStats) {
      try {
        return JSON.parse(existingStats);
      } catch (e) {
        console.warn("Failed to parse existing stats");
      }
    }

    // Default stats
    const defaultStats: ReferralStats = {
      total_referrals: 0,
      successful_referrals: 0,
      pending_referrals: 0,
      active_referral_code: null,
      available_discounts: [],
      referral_history: [],
    };

    localStorage.setItem(statsKey, JSON.stringify(defaultStats));
    return defaultStats;
  }

  // Apply referral discount to booking
  async applyReferralDiscount(
    bookingId: string,
    userId: string,
  ): Promise<{
    message: string;
    discount_percentage: number;
  }> {
    const data = await this.makeRequest("/apply-discount", {
      method: "POST",
      body: JSON.stringify({ bookingId, userId }),
    });
    return {
      message: data.message,
      discount_percentage: data.discount_percentage,
    };
  }

  // Get share link with referral code
  async getShareLink(userId: string): Promise<ShareLinkResponse> {
    try {
      const data = await this.makeRequest(`/share-link/${userId}`);
      return {
        share_url: data.share_url,
        referral_code: data.referral_code,
        discount_percentage: data.discount_percentage,
      };
    } catch (error) {
      console.warn("Using fallback share link generation:", error);
      // Fallback: generate local share link
      return this.generateLocalShareLink(userId);
    }
  }

  // Local fallback for share links
  private generateLocalShareLink(userId: string): ShareLinkResponse {
    // Try to get existing referral code from localStorage
    const existingReferral = localStorage.getItem(`referral_${userId}`);
    let referralCode =
      "SHARE" + userId.slice(-4) + Date.now().toString(36).slice(-4);

    if (existingReferral) {
      try {
        const referralData = JSON.parse(existingReferral);
        referralCode = referralData.referral_code;
      } catch (e) {
        console.warn("Failed to parse existing referral data");
      }
    }

    const shareUrl = `${window.location.origin}?ref=${referralCode}`;

    return {
      share_url: shareUrl,
      referral_code: referralCode,
      discount_percentage: 50,
    };
  }

  // Extract referral code from URL
  extractReferralFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("ref");
  }

  // Store referral code in localStorage for later use
  storeReferralCode(code: string): void {
    localStorage.setItem("pending_referral_code", code);
  }

  // Get stored referral code
  getStoredReferralCode(): string | null {
    return localStorage.getItem("pending_referral_code");
  }

  // Clear stored referral code
  clearStoredReferralCode(): void {
    localStorage.removeItem("pending_referral_code");
  }

  // Check if user has available referral discounts
  hasAvailableDiscount(user: any): boolean {
    if (!user?.available_discounts) return false;

    return user.available_discounts.some(
      (discount: any) =>
        !discount.used &&
        new Date() < new Date(discount.expires_at) &&
        (discount.type === "referee_discount" ||
          discount.type === "referral_reward"),
    );
  }

  // Get available discount amount
  getAvailableDiscount(user: any): { percentage: number; type: string } | null {
    if (!user?.available_discounts) return null;

    const discount = user.available_discounts.find(
      (d: any) =>
        !d.used &&
        new Date() < new Date(d.expires_at) &&
        (d.type === "referee_discount" || d.type === "referral_reward"),
    );

    return discount
      ? {
          percentage: discount.percentage,
          type: discount.type,
        }
      : null;
  }

  // Generate share text for social media
  generateShareText(
    referralCode: string,
    discountPercentage: number = 50,
  ): string {
    return `🎉 Get ${discountPercentage}% OFF on your first laundry order with CleanCare Pro! Use my referral code: ${referralCode} ✨ Professional laundry services at your doorstep!`;
  }

  // Generate WhatsApp share URL
  generateWhatsAppShareUrl(shareUrl: string, referralCode: string): string {
    const message = this.generateShareText(referralCode);
    const fullMessage = `${message}\n\n🔗 ${shareUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
  }

  // Generate social media share URLs
  generateSocialShareUrls(shareUrl: string, referralCode: string) {
    const text = this.generateShareText(referralCode);

    return {
      whatsapp: this.generateWhatsAppShareUrl(shareUrl, referralCode),
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      sms: `sms:?body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`,
      email: `mailto:?subject=${encodeURIComponent("Get 50% OFF on CleanCare Pro!")}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`,
    };
  }
}

export const referralService = new ReferralService();
export default referralService;
