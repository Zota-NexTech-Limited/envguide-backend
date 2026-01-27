import { Router } from 'express';
import * as Controller from '../../controller/productController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/product/add', authService.authenticate, Controller.createProduct);
Routes.post('/api/product/update', authService.authenticate, Controller.updateProduct);
Routes.get('/api/product/get-by-id', authService.authenticate, Controller.getProductById);
Routes.get('/api/product/list', authService.authenticate, Controller.listProducts);
Routes.get('/api/product/drop-down', authService.authenticate, Controller.productsDropDown);

Routes.post('/api/product-pcf/add', authService.authenticate, Controller.createProductPCF);
Routes.post('/api/product-pcf/update', authService.authenticate, Controller.updateProductPCF);
Routes.get('/api/product-pcf/get-by-id', authService.authenticate, Controller.getProductPCFById);
Routes.post('/api/product-pcf/delete-raw-material-component', authService.authenticate, Controller.deleteRawMaterialComponents);
Routes.post('/api/product-pcf/delete-transportation', authService.authenticate, Controller.deleteTransportation);
Routes.post('/api/product-pcf/delete-packaging', authService.authenticate, Controller.deletePackaging);

export default Routes;