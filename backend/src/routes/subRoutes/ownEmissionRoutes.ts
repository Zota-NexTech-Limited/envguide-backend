import { Router } from 'express';
import * as Controller from '../../controller/ownEmissionController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/own-emission/add', authService.authenticate, Controller.addOwnEmission);
Routes.post('/api/own-emission/update', authService.authenticate, Controller.updateOwnEmission);
Routes.get('/api/own-emission/list', authService.authenticate, Controller.getOwnEmissionList);
Routes.get('/api/own-emission/get-by-id', authService.authenticate, Controller.getOwnEmissionById);
Routes.post('/api/own-emission/delete-support-doc', authService.authenticate, Controller.deleteSupportingDocument);
Routes.post('/api/own-emission/delete-own-emission', authService.authenticate, Controller.deleteOwnEmission);

Routes.post('/api/own-emission/support-create', Controller.addOwnEmissionSupportingTeam);
Routes.get('/api/own-emission/support-list', Controller.getOwnEmissionSupportingTeamList);
Routes.get('/api/own-emission/support-get-by-id', Controller.getOwnEmissionSupportingTeamById);
export default Routes;