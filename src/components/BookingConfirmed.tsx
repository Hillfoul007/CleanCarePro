import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Phone,
  User,
  Package,
  Home,
  Eye,
} from "lucide-react";
import { bookingHelpers } from "../integrations/mongodb/bookingHelpers";

interface BookingConfirmedProps {
  bookingData: {
    bookingId: string;
    custom_order_id?: string; // <-- Add this line
    services: any[];
    totalAmount: number;
    pickupDate: string;
    pickupTime: string;
    address: any;
    customerName: string;
    customerPhone: string;
  };
  onGoHome: () => void;
  onViewBookings: () => void;
}

const BookingConfirmed: React.FC<BookingConfirmedProps> = ({
  bookingData,
  onGoHome,
  onViewBookings,
}) => {
  const [customOrderId, setCustomOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomOrderId = async () => {
      // Only fetch if custom_order_id is not already present
      if (!bookingData.custom_order_id && bookingData.bookingId) {
        try {
          console.log(
            "🔄 Fetching booking details for custom order ID:",
            bookingData.bookingId,
          );

          // Use the same approach as MobileBookingHistory
          const result = await bookingHelpers.getBookingById(
            bookingData.bookingId,
          );

          if (result && result.data && result.data.custom_order_id) {
            console.log(
              "✅ Found custom order ID:",
              result.data.custom_order_id,
            );
            setCustomOrderId(result.data.custom_order_id);
          } else if (result.data) {
            // Try different field names that might contain the custom order ID
            const orderId =
              result.data.custom_order_id ||
              result.data.order_id ||
              result.data.customOrderId;

            if (orderId) {
              console.log("✅ Found order ID in alternate field:", orderId);
              setCustomOrderId(orderId);
            } else {
              console.log(
                "⚠️ Custom order ID not found in booking data:",
                Object.keys(result.data),
              );

              // Generate a fallback custom order ID based on booking ID
              const fallbackOrderId = `A${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}${bookingData.bookingId.slice(-6)}`;
              console.log("🆆 Generated fallback order ID:", fallbackOrderId);
              setCustomOrderId(fallbackOrderId);
            }
          } else {
            console.error("❌ Failed to fetch booking details:", result.error);
          }
        } catch (error) {
          console.error("❌ Error fetching booking details:", error);

          // Generate a fallback custom order ID
          const fallbackOrderId = `A${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}${bookingData.bookingId.slice(-6)}`;
          console.log(
            "🆆 Generated fallback order ID due to error:",
            fallbackOrderId,
          );
          setCustomOrderId(fallbackOrderId);
        }
      }
    };

    fetchCustomOrderId();
  }, [bookingData.custom_order_id, bookingData.bookingId]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getAddressString = (address: any) => {
    if (typeof address === "string") return address;
    if (address?.fullAddress) return address.fullAddress;

    return [
      address?.flatNo,
      address?.street,
      address?.landmark,
      address?.village,
      address?.city,
      address?.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* Compact Header */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-gray-900">
            Booking Confirmed!
          </h1>
        </div>
      </div>

      {/* Compact Content */}
      <div className="p-4 space-y-3">
        {/* Booking ID */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 text-center">
            <p className="text-sm text-green-700 mb-1">Order ID</p>
            <p className="text-lg font-bold text-green-900">
              #
              {(() => {
                // Priority order: props -> state -> generated
                if (bookingData.custom_order_id) {
                  return bookingData.custom_order_id;
                }
                if (customOrderId) {
                  return customOrderId;
                }
                if (bookingData.bookingId) {
                  // Generate a proper custom order ID format like in MobileBookingHistory
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, "0");
                  const day = String(today.getDate()).padStart(2, "0");
                  return `A${year}${month}${day}${bookingData.bookingId.slice(-6)}`;
                }
                return "Generating...";
              })()}
            </p>
          </CardContent>
        </Card>

        {/* Items & Schedule Combined */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Items & Schedule</span>
            </div>

            {/* Items */}
            <div className="space-y-1 mb-3">
              {bookingData.services.map((service, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {typeof service === "string" ? service : service.name}
                  </span>
                  <span className="font-medium">
                    {typeof service === "object" && service.quantity
                      ? `x${service.quantity}`
                      : "x1"}
                  </span>
                </div>
              ))}
            </div>

            {/* Schedule */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span className="text-gray-700">
                  {formatDate(bookingData.pickupDate)}
                </span>
                <Clock className="h-3 w-3 text-gray-500 ml-2" />
                <span className="text-gray-700">{bookingData.pickupTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address & Contact */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-red-600" />
              <span className="font-medium text-sm">Address & Contact</span>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-gray-700">
                {getAddressString(bookingData.address)}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600">
                  {bookingData.customerName}
                </span>
                <Phone className="h-3 w-3 text-gray-500 ml-2" />
                <span className="text-gray-600">
                  {bookingData.customerPhone}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Amount */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Total Amount</span>
              </div>
              <span className="text-xl font-bold text-blue-900">
                ₹{bookingData.totalAmount}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={onViewBookings}
            className="w-full bg-green-600 hover:bg-green-700 py-3"
          >
            <Eye className="h-4 w-4 mr-2" />
            View My Bookings
          </Button>
          <Button onClick={onGoHome} variant="outline" className="w-full py-3">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmed;
