import express from 'express';
import { 
    submitPractice, 
    getMySubmissions,
    getSubmissions, 
    reviewSubmission,
    lockSubmission,
    deleteSubmission,
    bulkDeleteSubmissions,
    getUploadSignature
} from '../controllers/submissions.controller.js';
import verifyUserToken from '../middlewares/verifyUserToken.js';
import verifyUserRole from '../middlewares/verifyUserRole.js';
import apiRateLimiter from '../middlewares/apiRateLimiter.js';

const sRouter = express.Router();

// Student routes
sRouter.post('/submit', verifyUserToken, apiRateLimiter("submitLimit", 60 * 1000), submitPractice);
sRouter.get('/my-submissions', verifyUserToken, getMySubmissions);
sRouter.get('/upload-signature', verifyUserToken, getUploadSignature);

// Admin/Instructor routes
sRouter.get('/', verifyUserToken, verifyUserRole(['admin', 'instructor']), getSubmissions);
sRouter.patch('/review/:id', verifyUserToken, verifyUserRole(['admin', 'instructor']), reviewSubmission);
sRouter.patch('/lock/:id', verifyUserToken, verifyUserRole(['admin', 'instructor']), lockSubmission);
sRouter.post('/bulk-delete', verifyUserToken, verifyUserRole(['admin']), bulkDeleteSubmissions);
sRouter.delete('/:id', verifyUserToken, verifyUserRole(['admin']), deleteSubmission);

export default sRouter;
