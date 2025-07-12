import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReferAndEarn from "@/components/ReferAndEarn";

interface ReferAndEarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

const ReferAndEarnModal: React.FC<ReferAndEarnModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] mx-4 sm:mx-auto border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-green-50/30 animate-in zoom-in-95 duration-300 fade-in-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Refer & Earn
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 scrollbar-hide">
          <div className="p-1">
            <ReferAndEarn currentUser={currentUser} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferAndEarnModal;
