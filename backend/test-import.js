// Test file to check if there are import issues
try {
  console.log('Testing calendar controller import...');
  const controller = require('./src/controllers/calendar.controller.ts');
  console.log('Calendar controller imported successfully');
  
  console.log('Testing calendar routes import...');
  const routes = require('./src/routes/calendar.routes.ts');
  console.log('Calendar routes imported successfully');
} catch (error) {
  console.error('Import error:', error.message);
}