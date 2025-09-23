import { Router } from 'express';
import * as Controller from '../../controller/documentMasterController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/document-master/add', authService.authenticate, Controller.addDocument);
Routes.post('/api/document-master/update', authService.authenticate, Controller.updateDocument);
Routes.post('/api/document-master/delete', authService.authenticate, Controller.deleteDocument);
Routes.get('/api/document-master/get-by-id', authService.authenticate, Controller.getDocumentById);

export default Routes;