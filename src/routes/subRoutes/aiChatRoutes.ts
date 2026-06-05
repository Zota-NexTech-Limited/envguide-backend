import { Router } from 'express';
import * as Controller from '../../controller/aiChatController.js';

const Routes = Router();

// Public Help Centre assistant — no auth (the help centre chat is unauthenticated).
Routes.post('/api/ai-chat', Controller.aiChat);

export default Routes;
