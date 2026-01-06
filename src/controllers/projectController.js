const Project = require("../models/Project");
const Task = require("../models/Task");
const Todo = require("../models/Todo");

// @desc    Get all projects for logged in user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    // Get task counts and completion stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ project: project._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.completed).length;
        const completionPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project.toObject(),
          totalTasks,
          completedTasks,
          completionPercentage,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projectsWithStats.length,
      data: projectsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Make sure user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this project",
      });
    }

    // Get task stats
    const tasks = await Task.find({ project: project._id });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        totalTasks,
        completedTasks,
        completionPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: {
        ...project.toObject(),
        totalTasks: 0,
        completedTasks: 0,
        completionPercentage: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Make sure user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Get task stats
    const tasks = await Task.find({ project: project._id });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        totalTasks,
        completedTasks,
        completionPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Make sure user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }

    // Delete all tasks and todos associated with this project
    const tasks = await Task.find({ project: project._id });
    const taskIds = tasks.map((t) => t._id);

    // Delete all todos for all tasks in this project
    await Todo.deleteMany({ task: { $in: taskIds } });

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });

    // Delete the project
    await project.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
