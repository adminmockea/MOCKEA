import express from 'express';
import { 
    getAllMockTests, 
    getMockTestById, 
    createMockTest, 
    startTest, 
    submitSection, 
    updateCheatStats, 
    finalizeTest,
    updateMockTest,
    deleteMockTest,
    gradeSection,
    getUserResults,
    getAllResults,
    getResultDetail,
    lockMockResult,
    deleteMockResult,
    bulkDeleteMockResults,
    cloneMockTest,
    togglePublicStatus,
    bulkManageMockTests
} from '../controllers/mockTest.controller.js';
import verifyUserToken from '../middlewares/verifyUserToken.js';
import verifyUserRole from '../middlewares/verifyUserRole.js';

const mockTestRouter = express.Router();

// 1. Authentication (Firebase)
mockTestRouter.use(verifyUserToken);
// 2. Authorization (MongoDB User fetch & Role check)
mockTestRouter.use(verifyUserRole());

// Student/General Authenticated Routes
mockTestRouter.get('/', getAllMockTests);
mockTestRouter.get('/results/user', getUserResults);
mockTestRouter.get('/results/all', verifyUserRole(['admin', 'instructor']), getAllResults);
mockTestRouter.get('/results/:id', getResultDetail); // New: Result Detail for Review
mockTestRouter.get('/:id', getMockTestById);
mockTestRouter.post('/start', startTest);
mockTestRouter.post('/submit-section', submitSection);
mockTestRouter.post('/update-cheat-stats', updateCheatStats);
mockTestRouter.post('/finalize', finalizeTest);

// Instructor/Admin Routes for Manual Grading
mockTestRouter.patch('/grade-section', verifyUserRole(['admin', 'instructor']), gradeSection);
mockTestRouter.patch('/lock/:id', verifyUserRole(['admin', 'instructor']), lockMockResult);
mockTestRouter.post('/results/bulk-delete', verifyUserRole(['admin']), bulkDeleteMockResults);
mockTestRouter.delete('/results/:id', verifyUserRole(['admin']), deleteMockResult);

// Admin-Only Management Routes (Double-check role)
mockTestRouter.post('/create', verifyUserRole(['admin']), createMockTest);
mockTestRouter.post('/bulk', verifyUserRole(['admin']), bulkManageMockTests);
mockTestRouter.post('/:id/clone', verifyUserRole(['admin']), cloneMockTest);
mockTestRouter.patch('/:id/toggle-public', verifyUserRole(['admin']), togglePublicStatus);
mockTestRouter.put('/:id', verifyUserRole(['admin']), updateMockTest);
mockTestRouter.delete('/:id', verifyUserRole(['admin']), deleteMockTest);

export default mockTestRouter;
