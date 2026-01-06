const Todo = require("../models/Todo");
const Task = require("../models/Task");

// @desc    Get all todos for logged in user (optionally filter by task)
// @route   GET /api/todos
// @access  Private
exports.getTodos = async (req, res, next) => {
  try {
    const query = { user: req.user.id };

    // Filter by task if provided
    if (req.query.task) {
      query.task = req.query.task;
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

    // Filter by created date
    if (req.query.createdFrom || req.query.createdTo) {
      query.createdAt = {};
      if (req.query.createdFrom) {
        query.createdAt.$gte = new Date(req.query.createdFrom);
      }
      if (req.query.createdTo) {
        query.createdAt.$lte = new Date(req.query.createdTo);
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

    const todos = await Todo.find(query)
      .populate("task", "name moduleName")
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: todos.length,
      data: todos,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single todo
// @route   GET /api/todos/:id
// @access  Private
exports.getTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    // Make sure user owns the todo
    if (todo.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this todo",
      });
    }

    res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new todo
// @route   POST /api/todos
// @access  Private
exports.createTodo = async (req, res, next) => {
  try {
    // Add user to request body
    req.body.user = req.user.id;

    // Verify task exists and belongs to user
    const task = await Task.findById(req.body.task);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add todos to this task",
      });
    }

    const todo = await Todo.create(req.body);
    const populatedTodo = await Todo.findById(todo._id).populate(
      "task",
      "name moduleName"
    );

    res.status(201).json({
      success: true,
      data: populatedTodo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update todo
// @route   PUT /api/todos/:id
// @access  Private
exports.updateTodo = async (req, res, next) => {
  try {
    let todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    // Make sure user owns the todo
    if (todo.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this todo",
      });
    }

    todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete todo
// @route   DELETE /api/todos/:id
// @access  Private
exports.deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    // Make sure user owns the todo
    if (todo.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this todo",
      });
    }

    await todo.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle todo completion
// @route   PATCH /api/todos/:id/toggle
// @access  Private
exports.toggleTodo = async (req, res, next) => {
  try {
    let todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    // Make sure user owns the todo
    if (todo.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this todo",
      });
    }

    todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { completed: !todo.completed },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (error) {
    next(error);
  }
};
