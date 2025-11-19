import { Router } from 'express';
import * as Controller from '../../controller/productController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/product/add', authService.authenticate, Controller.createProduct);
Routes.post('/api/product/update', authService.authenticate, Controller.updateProduct);
Routes.get('/api/product/get-by-id', authService.authenticate, Controller.getProductById);
Routes.get('/api/product/list', authService.authenticate, Controller.listProducts);

export default Routes;