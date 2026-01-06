const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a project name"],
      trim: true,
      maxlength: [100, "Project name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    eta: {
      type: Date,
      required: [true, "Please provide an estimated completion date"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "on-hold"],
      default: "active",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for tasks count
projectSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "project",
  justOne: false,
});

// Index for efficient querying by user
projectSchema.index({ user: 1, createdAt: -1 });
projectSchema.index({ user: 1, eta: 1 });

module.exports = mongoose.model("Project", projectSchema);
