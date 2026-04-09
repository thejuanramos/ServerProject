import Project from '../models/Project.js';

export const createProject = async (req, res, next) => {
  try {
    const projectData = {
      ...req.body,
      companyId: req.user.company // Auto-fill from the logged-in user
    };
    const newProject = await Project.create(projectData);
    res.status(201).json(newProject);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    // Only show projects for the user's company
    const projects = await Project.find({ companyId: req.user.company }).populate('clientId');
    res.json(projects);
  } catch (error) {
    next(error);
  }
};