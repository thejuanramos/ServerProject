import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

export const createClient = async (req, res, next) => {
  try {
    const existingClient = await Client.findOne({ 
      company: req.user.company, 
      cif: req.body.cif 
    });
    
    if (existingClient) throw AppError.conflict('A client with this CIF already exists in your company');

    const client = await Client.create({
      ...req.body,
      user: req.user._id,
      company: req.user.company
    });

    // Emit real-time event to company room
    req.app.get('io').to(req.user.company.toString()).emit('client:new', client);

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, name, sort = 'createdAt' } = req.query;
    const query = { company: req.user.company, deleted: false };
    if (name) query.name = { $regex: name, $options: 'i' };

    const clients = await Client.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalItems = await Client.countDocuments(query);

    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: Number(page),
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, company: req.user.company });
    if (!client) throw AppError.notFound('Client not found');
    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    if (req.body.cif) {
      const existing = await Client.findOne({ 
        company: req.user.company, 
        cif: req.body.cif, 
        _id: { $ne: req.params.id } 
      });
      if (existing) throw AppError.conflict('CIF already in use by another client');
    }

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) throw AppError.notFound('Client not found');
    res.json(client);
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const isSoftDelete = req.query.soft !== 'false';
    let client;
    if (isSoftDelete) {
      client = await Client.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company },
        { deleted: true },
        { new: true }
      );
    } else {
      client = await Client.findOneAndDelete({ _id: req.params.id, company: req.user.company });
    }
    if (!client) throw AppError.notFound('Client not found');
    res.json({ message: isSoftDelete ? 'Client archived' : 'Client deleted permanently' });
  } catch (error) {
    next(error);
  }
};

export const getArchivedClients = async (req, res, next) => {
  try {
    const clients = await Client.find({ company: req.user.company, deleted: true });
    res.json(clients);
  } catch (error) {
    next(error);
  }
};

export const restoreClient = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: true },
      { deleted: false },
      { new: true }
    );
    if (!client) throw AppError.notFound('Archived client not found');
    res.json(client);
  } catch (error) {
    next(error);
  }
};