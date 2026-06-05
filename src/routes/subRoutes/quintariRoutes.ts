import { Router } from "express";
import * as Controller from "../../controller/quintariController.js";
import * as authService from "../../middleware/authService.js";

const Routes = Router();

Routes.post(
    "/api/quintari/publish/:bomPcfRequestId",
    authService.authenticate,
    Controller.publishPcfToQuintari
);
Routes.get(
    "/api/quintari/publication-status/:bomPcfRequestId",
    authService.authenticate,
    Controller.getQuintariPublicationStatus
);

export default Routes;
