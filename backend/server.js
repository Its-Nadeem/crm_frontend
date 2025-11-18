// For local development only, start server with WebSocket support - DISABLED for Vercel
// if (process.env.NODE_ENV !== 'production') {
//   const PORT = process.env.PORT || 5000;

//   // Upgrade HTTP server to handle WebSocket connections
//   const server = app.listen(PORT, () => {
//     logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
//   });

//   // Handle WebSocket upgrade requests
//   server.on('upgrade', (request, socket, head) => {
//     // Check if this is a WebSocket upgrade request for /api/sync
//     if (request.url === '/api/sync') {
//       wss.handleUpgrade(request, socket, head, (ws) => {
//         wss.emit('connection', ws, request);
//       });
//     } else {
//       // Reject other WebSocket connections
//       socket.destroy();
//     }
//   });

//   // Handle unhandled promise rejections
//   process.on('unhandledRejection', (err, promise) => {
//     logger.error('Unhandled Promise Rejection:', {
//       error: err.message,
//       stack: err.stack,
//       promise: promise.toString()
//     });

//     // Don't exit the process for unhandled rejections in development
//     console.error('Unhandled Promise Rejection in development - continuing...');
//   });
// }
