// healthController.js

// Lightweight liveness endpoints mirroring the original Node API.
export const health = (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
};





// // 1. If you are using Sequelize:
// import { sequelize } from '../config/database.js'; // Adjust path to your DB instance

// // OR if you are using raw mysql2 pool:
// // import pool from '../config/database.js'; 

// // Liveness: Ultra-lightweight loop check (Kubernetes checks this to see if Node is frozen)
// export const liveness = (_req, res) => {
//   res.json({ status: 'alive', timestamp: new Date().toISOString() });
// };

// // Readiness: Checks if MySQL is actively responding
// export const readiness = async (_req, res) => {
//   try {
//     // For Sequelize:
//     await sequelize.authenticate();
    
//     // For raw mysql2 pool, uncomment this instead:
//     // await pool.query('SELECT 1');

//     res.json({ status: 'ready', timestamp: new Date().toISOString() });
//   } catch (error) {
//     // Return a 503 Service Unavailable so Kubernetes cuts off traffic
//     res.status(503).json({ status: 'unready', error: error.message });
//   }
// };




