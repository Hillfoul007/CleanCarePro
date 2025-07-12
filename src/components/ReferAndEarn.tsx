import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Gift,
  Share2,
  Users,
  Trophy,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Heart,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface ReferAndEarnProps {
  currentUser: any;
}

interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  active_referral_code: string | null;
  available_discounts: any[];
  referral_history: any[];
}

const ReferAndEarn: React.FC<ReferAndEarnProps> = ({ currentUser }) => {
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(
    null,
  );
  const [shareLink, setShareLink] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.id || currentUser?._id) {
      fetchReferralStats();
      fetchShareLink();
    }
  }, [currentUser]);

  const fetchReferralStats = async () => {
    try {
      const userId = currentUser?.id || currentUser?._id;
      const response = await apiClient.getReferralStats(userId);
      if (response && response.data) {
        setReferralStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error);
    }
  };

  const fetchShareLink = async () => {
    try {
      const userId = currentUser?.id || currentUser?._id;
      const response = await apiClient.getReferralShareLink(userId);
      if (response && response.data) {
        setShareLink(response.data.share_url);
        if (!referralStats?.active_referral_code) {
          // If no active code, refresh stats to get the newly created one
          setTimeout(fetchReferralStats, 1000);
        }
      }
    } catch (error) {
      console.error("Error fetching share link:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewReferralCode = async () => {
    try {
      setGenerating(true);
      const userId = currentUser?.id || currentUser?._id;
      const response = await apiClient.generateReferralCode(userId);
      if (response && response.data) {
        await fetchReferralStats();
        await fetchShareLink();
        toast({
          title: "Success! 🎉",
          description: "New referral code generated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate referral code",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied! 📋",
      description: `${type} copied to clipboard`,
    });
  };

  const shareViaWhatsApp = () => {
    const message = `🧼 Join me on CleanCare Pro and get 50% OFF your first laundry service! Use my referral code: ${referralStats?.active_referral_code} or click my link: ${shareLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "CleanCare Pro - 50% OFF",
          text: `Get 50% OFF your first laundry service on CleanCare Pro! Use my referral code: ${referralStats?.active_referral_code}`,
          url: shareLink,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      copyToClipboard(shareLink, "Share link");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const availableDiscounts =
    referralStats?.available_discounts?.filter(
      (d) => !d.used && new Date() < new Date(d.expires_at),
    ) || [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Gift className="h-6 w-6 text-green-600" />
          Refer & Earn
        </h2>
        <p className="text-gray-600">
          Share CleanCare Pro with friends and earn rewards together!
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Your Referral Code
            </span>
            {!referralStats?.active_referral_code && (
              <Button
                onClick={generateNewReferralCode}
                disabled={generating}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {generating ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Generate
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {referralStats?.active_referral_code ? (
            <>
              <div className="bg-white p-4 rounded-xl border-2 border-green-300 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-2xl font-bold text-green-700">
                    {referralStats.active_referral_code}
                  </div>
                  <Button
                    onClick={() =>
                      copyToClipboard(
                        referralStats.active_referral_code!,
                        "Referral code",
                      )
                    }
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={shareViaWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share on WhatsApp
                </Button>
                <Button
                  onClick={shareViaNative}
                  variant="outline"
                  className="border-green-300 text-green-600 hover:bg-green-50"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Share Link */}
              {shareLink && (
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Share Link:</p>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded flex-1 truncate">
                      {shareLink}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(shareLink, "Share link")}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <Gift className="h-12 w-12 mx-auto mb-3 text-green-400" />
              <p className="text-gray-600 mb-3">
                Generate your unique referral code to start earning rewards!
              </p>
              <Button onClick={generateNewReferralCode} disabled={generating}>
                {generating ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Referral Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            How it Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Share Your Code</h4>
                <p className="text-sm text-gray-600">
                  Share your referral code or link with friends and family
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Friend Signs Up</h4>
                <p className="text-sm text-gray-600">
                  They use your code and get 50% OFF (up to ₹200) on first order
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">You Both Win</h4>
                <p className="text-sm text-gray-600">
                  You get 50% OFF (up to ₹200) on your next order too!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      {referralStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Your Referral Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {referralStats.total_referrals}
                </div>
                <div className="text-sm text-gray-600">Friends Invited</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {referralStats.successful_referrals}
                </div>
                <div className="text-sm text-gray-600">
                  Successful Referrals
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Discounts */}
      {availableDiscounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              Your Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableDiscounts.map((discount, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {discount.type === "referral_reward"
                          ? "Referral Reward"
                          : "Referee Discount"}
                      </Badge>
                      <div className="text-lg font-bold text-purple-700">
                        {discount.percentage}% OFF
                      </div>
                      <div className="text-sm text-gray-600">
                        Up to ₹{discount.amount || 200} discount
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Expires:{" "}
                        {new Date(discount.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral History */}
      {referralStats?.referral_history &&
        referralStats.referral_history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Referral History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {referralStats.referral_history.map((referral, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        {referral.referee_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {referral.status.replace("_", " ").toUpperCase()}
                      </div>
                      {referral.registration_date && (
                        <div className="text-xs text-gray-500">
                          {new Date(
                            referral.registration_date,
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        referral.status === "rewarded"
                          ? "default"
                          : referral.status === "first_payment_completed"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {referral.status === "rewarded"
                        ? "Completed"
                        : referral.status === "first_payment_completed"
                          ? "Pending Reward"
                          : referral.status === "registered"
                            ? "Signed Up"
                            : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default ReferAndEarn;
