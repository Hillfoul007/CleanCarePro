import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Clock, Truck } from "lucide-react";
import { format, addDays, isSameDay, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { laundryServices, LaundryService } from "@/data/laundryServices";

interface DeliveryDateTimePickerProps {
  selectedDate?: Date;
  selectedTime?: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  className?: string;
  cartItems?: Array<{
    service: LaundryService | undefined;
    quantity: number;
  }>;
  pickupDate?: Date; // To calculate minimum delivery date based on pickup
}

const DeliveryDateTimePicker: React.FC<DeliveryDateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  className,
  cartItems = [],
  pickupDate,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Determine minimum days gap based on cart items
  const getMinimumDaysGap = () => {
    if (!cartItems.length) return 1; // Default 1 day gap

    const hasDryCleaningItems = cartItems.some((item) => {
      if (!item.service) return false;
      return (
        item.service.category === "mens-dry-clean" ||
        item.service.category === "womens-dry-clean" ||
        item.service.category === "woolen-dry-clean"
      );
    });

    // If any dry cleaning item exists, use 48 hour (2 days) gap
    // Otherwise use 24 hour (1 day) gap for laundry and iron items
    return hasDryCleaningItems ? 2 : 1;
  };

  // Calculate minimum delivery date based on pickup date and service types
  const getMinimumDeliveryDate = () => {
    const baseDate = pickupDate || new Date();
    const daysGap = getMinimumDaysGap();
    return addDays(baseDate, daysGap);
  };

  // Generate available delivery dates starting from minimum date
  const generateAvailableDates = () => {
    const dates = [];
    const minDate = getMinimumDeliveryDate();

    // Generate 7 dates starting from minimum delivery date
    for (let i = 0; i < 7; i++) {
      const date = addDays(minDate, i);
      dates.push({
        date,
        label:
          i === 0
            ? `${getMinimumDaysGap() === 2 ? "48hrs" : "24hrs"} (Min)`
            : isToday(date)
              ? "Today"
              : isTomorrow(date)
                ? "Tomorrow"
                : format(date, "EEE"),
        shortDate: format(date, "dd MMM"),
        fullDate: format(date, "dd"),
        month: format(date, "MMM"),
        day: format(date, "EEE"),
        isPast: false,
      });
    }
    return dates;
  };

  // Generate extended date options for dropdown
  const generateExtendedDates = () => {
    return generateAvailableDates().map((dateItem, index) => ({
      ...dateItem,
      label:
        index === 0
          ? `${format(dateItem.date, "EEE, MMM dd")} (${getMinimumDaysGap() === 2 ? "48hrs min" : "24hrs min"})`
          : format(dateItem.date, "EEE, MMM dd"),
      value: dateItem.date.toISOString(),
    }));
  };

  // Generate time slots with 1-hour intervals (same as pickup)
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentHour = now.getHours();
    const minDate = getMinimumDeliveryDate();

    // Generate slots from 8 AM to 9 PM (1-hour intervals)
    for (let hour = 8; hour <= 21; hour++) {
      const timeString = `${hour.toString().padStart(2, "0")}:00`;
      const displayTime = format(
        new Date(`2000-01-01T${timeString}`),
        "h:mm a",
      );

      // Skip past times only if selected date is today and it's the minimum delivery date
      const isDisabled =
        selectedDate &&
        isToday(selectedDate) &&
        isSameDay(selectedDate, minDate) &&
        hour <= currentHour;

      if (!isDisabled) {
        let period = "Morning";
        if (hour >= 12 && hour < 17) period = "Afternoon";
        if (hour >= 17) period = "Evening";

        slots.push({
          value: displayTime,
          label: displayTime,
          period,
          groupLabel: `${displayTime} (${period})`,
        });
      }
    }

    return slots;
  };

  // Auto-select minimum delivery date if no date is selected or if it's before minimum
  useEffect(() => {
    const minDate = getMinimumDeliveryDate();
    if (!selectedDate || selectedDate < minDate) {
      onDateChange(minDate);
    }
  }, [pickupDate, cartItems]);

  const availableDates = generateAvailableDates();
  const extendedDates = generateExtendedDates();
  const timeSlots = generateTimeSlots();
  const minimumDaysGap = getMinimumDaysGap();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Service Type Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Truck className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Delivery Schedule
          </span>
        </div>
        <p className="text-xs text-blue-700">
          {minimumDaysGap === 2
            ? "Dry cleaning items require 48 hours minimum processing time"
            : "Laundry and iron items ready for delivery in 24 hours"}
        </p>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Delivery Date
          </Label>
        </div>

        {/* Dropdown for extended date selection */}
        {showDropdown && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Choose from available delivery dates:
            </Label>
            <Select
              value={selectedDate?.toISOString() || ""}
              onValueChange={(value) => {
                if (value) {
                  onDateChange(new Date(value));
                  setShowDropdown(false);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose delivery date" />
              </SelectTrigger>
              <SelectContent>
                {extendedDates.map((dateItem) => (
                  <SelectItem key={dateItem.value} value={dateItem.value}>
                    {dateItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Available dates - Horizontal Scrollable */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Available Dates</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-xs"
            >
              {showDropdown ? "Show Less" : "More Dates"}
            </Button>
          </div>

          {/* Horizontal scrollable date grid */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {availableDates.map((dateItem, index) => {
                const isSelected =
                  selectedDate && isSameDay(dateItem.date, selectedDate);
                const isMinimum = index === 0;

                return (
                  <button
                    key={dateItem.date.toISOString()}
                    type="button"
                    onClick={() => onDateChange(dateItem.date)}
                    className={cn(
                      "flex-shrink-0 p-3 rounded-lg transition-colors border min-w-[80px] text-center",
                      isSelected
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        : isMinimum
                          ? "hover:bg-blue-50 border-blue-300 bg-blue-50"
                          : "hover:bg-gray-50 border-gray-200 bg-white",
                    )}
                  >
                    <div className="space-y-1">
                      <div
                        className={cn(
                          "text-xs font-medium uppercase",
                          isSelected
                            ? "text-white"
                            : isMinimum
                              ? "text-blue-600"
                              : "text-gray-500",
                        )}
                      >
                        {dateItem.day}
                      </div>
                      <div
                        className={cn(
                          "text-2xl font-bold",
                          isSelected
                            ? "text-white"
                            : isMinimum
                              ? "text-blue-800"
                              : "text-gray-900",
                        )}
                      >
                        {dateItem.fullDate}
                      </div>
                      <div
                        className={cn(
                          "text-xs",
                          isSelected
                            ? "text-white/70"
                            : isMinimum
                              ? "text-blue-600"
                              : "text-gray-500",
                        )}
                      >
                        {dateItem.month}
                      </div>
                      {isMinimum && (
                        <div
                          className={cn(
                            "text-xs font-medium",
                            isSelected ? "text-white" : "text-blue-600",
                          )}
                        >
                          {minimumDaysGap === 2 ? "48h" : "24h"}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Time Selection Dropdown */}
      {selectedDate && (
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Delivery Time
          </Label>
          <Select value={selectedTime} onValueChange={onTimeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose delivery time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.groupLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Summary */}
      {selectedDate && selectedTime && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Delivery Scheduled
            </span>
          </div>
          <p className="text-sm text-green-700">
            {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryDateTimePicker;
