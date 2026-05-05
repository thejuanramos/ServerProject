import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';

export const createProject = async (req, res, next) => {
  try {
    const existingProject = await Project.findOne({ 
      company: req.user.company, 
      projectCode: req.body.projectCode 
    });
    
    if (existingProject) throw AppError.conflict('Project code already exists in this company');

    const project = await Project.create({
      ...req.body,
      user: req.user._id,
      company: req.user.company
    });

    // Emit real-time event
    req.app.get('io').to(req.user.company.toString()).emit('project:new', project);

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, name, client, active, sort = '-createdAt' } = req.query;
    const query = { company: req.user.company, deleted: false };
    if (name) query.name = { $regex: name, $options: 'i' };
    if (client) query.client = client;
    if (active !== undefined) query.active = active === 'true';

    const projects = await Project.find(query)
      .populate('client', 'name cif')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalItems = await Project.countDocuments(query);

    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: Number(page),
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, company: req.user.company })
      .populate('client', 'name cif');
    if (!project) throw AppError.notFound('Project not found');
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    if (req.body.projectCode) {
      const existing = await Project.findOne({ 
        company: req.user.company, 
        projectCode: req.body.projectCode, 
        _id: { $ne: req.params.id } 
      });
      if (existing) throw AppError.conflict('Project code already in use');
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) throw AppError.notFound('Project not found');
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const isSoftDelete = req.query.soft !== 'false';
    let project;
    if (isSoftDelete) {
      project = await Project.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company },
        { deleted: true },
        { new: true }
      );
    } else {
      project = await Project.findOneAndDelete({ _id: req.params.id, company: req.user.company });
    }
    if (!project) throw AppError.notFound('Project not found');
    res.json({ message: isSoftDelete ? 'Project archived' : 'Project deleted permanently' });
  } catch (error) {
    next(error);
  }
};

export const getArchivedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ company: req.user.company, deleted: true })
      .populate('client', 'name');
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const restoreProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: true },
      { deleted: false },
      { new: true }
    );
    if (!project) throw AppError.notFound('Archived project not found');
    res.json(project);
  } catch (error) {
    next(error);
  }
};