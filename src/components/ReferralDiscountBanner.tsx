import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, Timer } from "lucide-react";
import referralService from "@/services/referralService";

interface ReferralDiscountBannerProps {
  user: any;
  className?: string;
}

export function ReferralDiscountBanner({
  user,
  className = "",
}: ReferralDiscountBannerProps) {
  if (!user || !referralService.hasAvailableDiscount(user)) {
    return null;
  }

  const discount = referralService.getAvailableDiscount(user);
  if (!discount) return null;

  const getDiscountTitle = () => {
    switch (discount.type) {
      case "referee_discount":
        return "🎉 Welcome Bonus Active!";
      case "referral_reward":
        return "🌟 Referral Reward Available!";
      default:
        return "🎁 Discount Available!";
    }
  };

  const getDiscountDescription = () => {
    switch (discount.type) {
      case "referee_discount":
        return `You have a ${discount.percentage}% OFF welcome discount! Use it on your first order.`;
      case "referral_reward":
        return `You earned a ${discount.percentage}% OFF discount for referring a friend! Use it on your next order.`;
      default:
        return `You have a ${discount.percentage}% OFF discount available!`;
    }
  };

  const availableDiscounts =
    user.available_discounts?.filter(
      (d: any) =>
        !d.used &&
        new Date() < new Date(d.expires_at) &&
        (d.type === "referee_discount" || d.type === "referral_reward"),
    ) || [];

  if (availableDiscounts.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {availableDiscounts.map((discount: any, index: number) => {
        const expiresIn = Math.ceil(
          (new Date(discount.expires_at).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        return (
          <Alert
            key={index}
            className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {discount.type === "referee_discount" ? (
                  <Gift className="h-5 w-5 text-green-600" />
                ) : (
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <AlertDescription className="text-green-800 font-medium mb-0">
                    {discount.type === "referee_discount"
                      ? "🎉 Welcome Bonus Active!"
                      : "🌟 Referral Reward Available!"}
                  </AlertDescription>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 font-bold"
                  >
                    {discount.percentage}% OFF
                  </Badge>
                </div>

                <AlertDescription className="text-green-700 text-sm">
                  {discount.type === "referee_discount"
                    ? `You have a ${discount.percentage}% OFF welcome discount! Use it on your first order.`
                    : `You earned a ${discount.percentage}% OFF discount for referring a friend! Use it on your next order.`}
                </AlertDescription>

                {expiresIn <= 7 && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <Timer className="h-3 w-3" />
                    Expires in {expiresIn} {expiresIn === 1 ? "day" : "days"}
                  </div>
                )}
              </div>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}

export default ReferralDiscountBanner;
