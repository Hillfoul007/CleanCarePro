const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false,
      unique: false,
      lowercase: true,
      trim: true,
      sparse: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: false,
      minlength: [6, "Password must be at least 6 characters"],
    },
    full_name: {
      type: String,
      required: false,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    name: {
      type: String,
      required: false,
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"],
    },
    user_type: {
      type: String,
      enum: ["customer", "provider", "rider"],
      default: "customer",
    },
    profile_image: {
      type: String,
      default: "",
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    phone_verified: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      default: "",
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Referral system fields
    referral_stats: {
      total_referrals: {
        type: Number,
        default: 0,
      },
      successful_referrals: {
        type: Number,
        default: 0,
      },
      total_rewards_earned: {
        type: Number,
        default: 0,
      },
      pending_rewards: {
        type: Number,
        default: 0,
      },
    },
    referral_code: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    referral_applied: {
      type: Boolean,
      default: false,
    },
    available_discounts: [
      {
        type: {
          type: String,
          enum: ["referral_reward", "referee_discount"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        percentage: {
          type: Number,
          required: true,
        },
        expires_at: {
          type: Date,
          required: true,
        },
        booking_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
          default: null,
        },
        used: {
          type: Boolean,
          default: false,
        },
        created_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    last_login: {
      type: Date,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Update the updated_at field before saving
userSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Hash password before saving (only if password exists)
userSchema.pre("save", async function (next) {
  // Only hash if password is modified and exists
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Sync name and full_name fields
userSchema.pre("save", function (next) {
  // If name is provided but full_name is not, copy name to full_name
  if (this.name && !this.full_name) {
    this.full_name = this.name;
  }
  // If full_name is provided but name is not, copy full_name to name
  if (this.full_name && !this.name) {
    this.name = this.full_name;
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by email (case-insensitive)
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to check if email exists
userSchema.statics.emailExists = async function (email) {
  const user = await this.findOne({ email: email.toLowerCase() });
  return !!user;
};

// Static method to check if phone exists
userSchema.statics.phoneExists = async function (phone) {
  const user = await this.findOne({ phone });
  return !!user;
};

// Create indexes
userSchema.index({ user_type: 1 });
userSchema.index({ created_at: -1 });

module.exports = mongoose.model("User", userSchema);
