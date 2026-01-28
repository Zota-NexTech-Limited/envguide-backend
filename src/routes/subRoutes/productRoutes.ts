import { Router } from 'express';
import * as Controller from '../../controller/productController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/product/add', authService.authenticate, Controller.createProduct);
Routes.post('/api/product/update', authService.authenticate, Controller.updateProduct);
Routes.get('/api/product/get-by-id', authService.authenticate, Controller.getProductById);
Routes.get('/api/product/list', authService.authenticate, Controller.listProducts);
Routes.get('/api/product/drop-down', authService.authenticate, Controller.productsDropDown);

// OWN EMISSION 
Routes.get('/api/product/bom-pcf-drop-down', authService.authenticate, Controller.pcfDropDown);
Routes.get('/api/product/pcf-bom/get-by-id', authService.authenticate, Controller.getByIdPcfRequestWithBOMDetails);
Routes.get('/api/product/pcf-bom/history-bom-details', authService.authenticate, Controller.getPCFHistoryBOMDetails);
Routes.get('/api/product/pcf-bom/supplier-details', authService.authenticate, Controller.productPCFBomSupplierDetails);
Routes.get('/api/product/secondary-data-entries-by-id', authService.authenticate, Controller.secondaryDataEntriesById);
Routes.get('/api/product/linked-pcfs-by-product-code', authService.authenticate, Controller.getLinkedPCFsUsingProductCode);

export default Routes;