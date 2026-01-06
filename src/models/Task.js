const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a task name"],
      trim: true,
      maxlength: [100, "Task name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    moduleName: {
      type: String,
      required: [true, "Please provide a module name"],
      trim: true,
      maxlength: [50, "Module name cannot be more than 50 characters"],
    },
    dueDate: {
      type: Date,
      required: [true, "Please provide a due date"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Task must belong to a project"],
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

// Virtual for todos count
taskSchema.virtual("todos", {
  ref: "Todo",
  localField: "_id",
  foreignField: "task",
  justOne: false,
});

// Indexes for efficient querying
taskSchema.index({ user: 1, project: 1 });
taskSchema.index({ project: 1, dueDate: 1 });
taskSchema.index({ user: 1, dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
