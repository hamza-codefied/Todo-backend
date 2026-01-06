const Project = require("../models/Project");
const Task = require("../models/Task");
const Todo = require("../models/Todo");

// @desc    Get dashboard statistics
// @route   GET /api/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all projects
    const projects = await Project.find({ user: userId });
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const completedProjects = projects.filter(
      (p) => p.status === "completed"
    ).length;

    // Get all tasks
    const tasks = await Task.find({ user: userId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const pendingTasks = tasks.filter((t) => !t.completed).length;

    // Get all todos
    const todos = await Todo.find({ user: userId });
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t) => t.completed).length;
    const pendingTodos = todos.filter((t) => !t.completed).length;

    // Priority distribution for todos
    const highPriorityTodos = todos.filter((t) => t.priority === "high").length;
    const mediumPriorityTodos = todos.filter(
      (t) => t.priority === "medium"
    ).length;
    const lowPriorityTodos = todos.filter((t) => t.priority === "low").length;

    // Priority distribution for tasks
    const highPriorityTasks = tasks.filter((t) => t.priority === "high").length;
    const mediumPriorityTasks = tasks.filter(
      (t) => t.priority === "medium"
    ).length;
    const lowPriorityTasks = tasks.filter((t) => t.priority === "low").length;

    // Status distribution for projects
    const projectStatusDistribution = {
      active: activeProjects,
      completed: completedProjects,
      onHold: projects.filter((p) => p.status === "on-hold").length,
    };

    // Get overdue items
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => !t.completed && new Date(t.dueDate) < now
    ).length;
    const overdueTodos = todos.filter(
      (t) => !t.completed && new Date(t.dueDate) < now
    ).length;

    // Recent activity - last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentProjects = projects.filter(
      (p) => new Date(p.createdAt) >= sevenDaysAgo
    ).length;
    const recentTasks = tasks.filter(
      (t) => new Date(t.createdAt) >= sevenDaysAgo
    ).length;
    const recentTodos = todos.filter(
      (t) => new Date(t.createdAt) >= sevenDaysAgo
    ).length;

    res.status(200).json({
      success: true,
      data: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          statusDistribution: projectStatusDistribution,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          overdue: overdueTasks,
          priorityDistribution: {
            high: highPriorityTasks,
            medium: mediumPriorityTasks,
            low: lowPriorityTasks,
          },
        },
        todos: {
          total: totalTodos,
          completed: completedTodos,
          pending: pendingTodos,
          overdue: overdueTodos,
          priorityDistribution: {
            high: highPriorityTodos,
            medium: mediumPriorityTodos,
            low: lowPriorityTodos,
          },
        },
        recentActivity: {
          projects: recentProjects,
          tasks: recentTasks,
          todos: recentTodos,
        },
        completionRate: {
          tasks:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
          todos:
            totalTodos > 0
              ? Math.round((completedTodos / totalTodos) * 100)
              : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
