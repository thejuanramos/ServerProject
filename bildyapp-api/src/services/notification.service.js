import EventEmitter from 'node:events';

class NotificationService extends EventEmitter {}

const notificationService = new NotificationService();

notificationService.on('userregistered', (user) => {
  console.log('--- New User Registration ---');
  console.log(`User: ${user.email}`);
  console.log(`Verification Code: ${user.verificationCode}`); 
  console.log('-----------------------------');
});

notificationService.on('userverified', (user) => {
  console.log(`[Notification] User verified: ${user.email}`);
});

notificationService.on('userinvited', (user) => {
  console.log(`[Notification] User invited: ${user.email}`);
});

notificationService.on('userdeleted', (user) => {
  console.log(`[Notification] User deleted: ${user.email}`);
});

export default notificationService;