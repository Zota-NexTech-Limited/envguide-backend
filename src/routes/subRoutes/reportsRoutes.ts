import { Router } from 'express';
import * as Controller from '../../controller/reportsController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.get('/api/report/product-foot-print-list', authService.authenticate, Controller.getProductFootPrint);
Routes.get('/api/report/supplier-foot-print-list', authService.authenticate, Controller.getSupplierFootPrint);
Routes.get('/api/report/material-foot-print-list', authService.authenticate, Controller.getMaterialFootPrint);
Routes.get('/api/report/electricity-foot-print-list', authService.authenticate, Controller.getElectricityFootPrint);
Routes.get('/api/report/transporation-foot-print-list', authService.authenticate, Controller.getTransportationFootPrint);
Routes.get('/api/report/packaging-foot-print-list', authService.authenticate, Controller.getPackagingFootPrint);
Routes.get('/api/report/supplier-dqr-rating-report', authService.authenticate, Controller.getSupplierDqrRatingReport);

export default Routes;