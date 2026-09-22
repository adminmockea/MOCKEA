import express from 'express'
import { 
    getQuestions, 
    getQuestionById,
    postQuestion,
    updateQuestion,
    deleteQuestion,
    evaluateQuestions,
    bulkUpdateQuestions,
    uploadQuestionAudio
} from '../controllers/questions.controller.js'
import verifyUserToken from '../middlewares/verifyUserToken.js';
import verifyUserRole from '../middlewares/verifyUserRole.js';
import upload from '../middlewares/upload.js';

const qRouter = express.Router();

// All question routes require authentication
qRouter.use(verifyUserToken);

// Reading questions is allowed for students/authenticated users
qRouter.get('/', getQuestions);
qRouter.get('/:id', getQuestionById);
qRouter.post('/evaluate', evaluateQuestions);

// Modifying the question bank is restricted to admins
qRouter.post('/upload-audio', verifyUserRole(['admin']), upload.single('audio'), uploadQuestionAudio);
qRouter.post('/add', verifyUserRole(['admin']), postQuestion);
qRouter.post('/bulk-update', verifyUserRole(['admin']), bulkUpdateQuestions);
qRouter.put('/:id', verifyUserRole(['admin']), updateQuestion);
qRouter.delete('/:id', verifyUserRole(['admin']), deleteQuestion);

export default qRouter;