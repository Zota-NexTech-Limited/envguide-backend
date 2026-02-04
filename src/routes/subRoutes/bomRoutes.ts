import { Router } from 'express';
import * as Controller from '../../controller/pcfBomController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

// Routes.post('/api/pcf-bom/add', authService.authenticate, Controller.createBOMWithDetails);
// Routes.get('/api/pcf-bom/get-by-id', authService.authenticate, Controller.getPcfBOMWithDetails);
// Routes.get('/api/pcf-bom/list', authService.authenticate, Controller.getPcfBOMList);
// Routes.post('/api/pcf-bom/create', authService.authenticate, Controller.createBOMWithDetailsFinal);

// New Apis
Routes.post('/api/pcf-bom/create', authService.authenticate, Controller.createPcfRequestWithBOMDetails);
Routes.get('/api/pcf-bom/list', authService.authenticate, Controller.getPcfRequestWithBOMDetailsList);
Routes.get('/api/pcf-bom/get-by-id', authService.authenticate, Controller.getByIdPcfRequestWithBOMDetails);
Routes.post('/api/pcf-bom/verify', authService.authenticate, Controller.updateBomVerificationStatus);
Routes.post('/api/pcf-bom/reject', authService.authenticate, Controller.updateBomRejectionStatus);
Routes.post('/api/pcf-bom/delete-product-specification', authService.authenticate, Controller.deleteProductSpecification);
Routes.post('/api/pcf-bom/delete-bom', authService.authenticate, Controller.deleteBOM);
Routes.post('/api/pcf-bom/update', authService.authenticate, Controller.updatePcfRequestWithBOMDetails);
Routes.post('/api/pcf-bom/add-comment', authService.authenticate, Controller.createPcfBomComment);
Routes.get('/api/pcf-bom/list-comment', authService.authenticate, Controller.getPcfBomCommentsByBomId);
Routes.post('/api/pcf-bom/calculate-bom', authService.authenticate, Controller.pcfCalculate);
Routes.post('/api/pcf-bom/submit-pcf-request-internally', authService.authenticate, Controller.submitPcfRequestInternal);
Routes.post('/api/pcf-bom/submit-pcf-request-client', authService.authenticate, Controller.submitPcfRequestClient);

export default Routes;