const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    dueDate: {
      type: Date,
      required: [true, "Please provide a due date"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    estimatedTime: {
      type: Number,
      min: [0, "Estimated time cannot be negative"],
      default: 0,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Todo must belong to a task"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by user, task, and date
todoSchema.index({ user: 1, task: 1 });
todoSchema.index({ task: 1, dueDate: 1 });
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model("Todo", todoSchema);
