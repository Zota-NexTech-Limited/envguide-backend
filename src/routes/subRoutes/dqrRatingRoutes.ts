import { Router } from 'express';
import * as Controller from '../../controller/dqrRatingController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/dqr-rating/add', authService.authenticate, Controller.createDqrRating);
Routes.get('/api/dqr-rating/get-by-id', authService.authenticate, Controller.getSupplierDqrDetailsById);

export default Routes;