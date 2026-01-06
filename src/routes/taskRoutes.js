const express = require("express");
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");

// All routes are protected
router.use(protect);

router.route("/").get(getTasks).post(createTask);

router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);

router.patch("/:id/toggle", toggleTask);

module.exports = router;
