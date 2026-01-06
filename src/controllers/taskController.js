const Task = require("../models/Task");
const Todo = require("../models/Todo");
const Project = require("../models/Project");

// @desc    Get all tasks for logged in user (optionally filter by project)
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const query = { user: req.user.id };

    // Filter by project if provided
    if (req.query.project) {
      query.project = req.query.project;
    }

    // Date filtering
    if (req.query.startDate || req.query.endDate) {
      query.dueDate = {};
      if (req.query.startDate) {
        query.dueDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.dueDate.$lte = new Date(req.query.endDate);
      }
    }

    // Filter by completion status
    if (req.query.completed !== undefined) {
      query.completed = req.query.completed === "true";
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const tasks = await Task.find(query)
      .populate("project", "name")
      .sort({ dueDate: 1, createdAt: -1 });

    // Get todo counts for each task
    const tasksWithStats = await Promise.all(
      tasks.map(async (task) => {
        const todos = await Todo.find({ task: task._id });
        const totalTodos = todos.length;
        const completedTodos = todos.filter((t) => t.completed).length;
        const totalEstimatedTime = todos.reduce(
          (sum, t) => sum + (t.estimatedTime || 0),
          0
        );

        return {
          ...task.toObject(),
          totalTodos,
          completedTodos,
          totalEstimatedTime,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: tasksWithStats.length,
      data: tasksWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate("project", "name");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Make sure user owns the task
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this task",
      });
    }

    // Get todo stats
    const todos = await Todo.find({ task: task._id });
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t) => t.completed).length;
    const totalEstimatedTime = todos.reduce(
      (sum, t) => sum + (t.estimatedTime || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        ...task.toObject(),
        totalTodos,
        completedTodos,
        totalEstimatedTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    // Verify project exists and belongs to user
    const project = await Project.findById(req.body.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add tasks to this project",
      });
    }

    const task = await Task.create(req.body);
    const populatedTask = await Task.findById(task._id).populate(
      "project",
      "name"
    );

    res.status(201).json({
      success: true,
      data: {
        ...populatedTask.toObject(),
        totalTodos: 0,
        completedTodos: 0,
        totalEstimatedTime: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Make sure user owns the task
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this task",
      });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("project", "name");

    // Get todo stats
    const todos = await Todo.find({ task: task._id });
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t) => t.completed).length;
    const totalEstimatedTime = todos.reduce(
      (sum, t) => sum + (t.estimatedTime || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        ...task.toObject(),
        totalTodos,
        completedTodos,
        totalEstimatedTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Make sure user owns the task
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this task",
      });
    }

    // Delete all todos associated with this task
    await Todo.deleteMany({ task: task._id });

    // Delete the task
    await task.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle task completion
// @route   PATCH /api/tasks/:id/toggle
// @access  Private
exports.toggleTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Make sure user owns the task
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this task",
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: !task.completed },
      { new: true }
    ).populate("project", "name");

    // Get todo stats
    const todos = await Todo.find({ task: task._id });
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t) => t.completed).length;
    const totalEstimatedTime = todos.reduce(
      (sum, t) => sum + (t.estimatedTime || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        ...task.toObject(),
        totalTodos,
        completedTodos,
        totalEstimatedTime,
      },
    });
  } catch (error) {
    next(error);
  }
};
