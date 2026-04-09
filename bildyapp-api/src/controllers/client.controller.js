import Client from '../models/Client.js';

export const createClient = async (req, res, next) => {
  try {
    const clientData = {
      ...req.body,
      userId: req.user._id,        // From the JWT middleware
      companyId: req.user.company  // From the JWT middleware
    };

    const newClient = await Client.create(clientData);
    res.status(201).json(newClient);
  } catch (error) {
    next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
    // Only show clients belonging to the user's company
    const clients = await Client.find({ companyId: req.user.company });
    res.json(clients);
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findOne({ 
      _id: req.params.id, 
      companyId: req.user.company 
    });
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    res.json(client);
  } catch (error) {
    next(error);
  }
};