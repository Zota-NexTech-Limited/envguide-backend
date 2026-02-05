
import userRoutes from './subRoutes/userRoutes';
import roleAndDeptRoutes from './subRoutes/roleAndDepartmentRoutes';
import dataSetupRoutes from './subRoutes/dataSetupRoutes';
import ownEmissionRoutes from './subRoutes/ownEmissionRoutes';
import documentMasterRoutes from './subRoutes/documentMasterRoutes';
import bomRoutes from './subRoutes/bomRoutes';
import taskManagementRoutes from './subRoutes/taskManagementRoutes';
import supplierInputQuestions from './subRoutes/supplierInputQuestionRoutes';
import dqrRating from './subRoutes/dqrRatingRoutes';
import supplierDetails from './subRoutes/supplierInfoRoutes';
import product from './subRoutes/productRoutes';
import imageRoutes from './subRoutes/imageRoutes';
import masterDatasetup from './subRoutes/materDataSetupRoutes';
import ecoinventEmissionFactorDataSetup from './subRoutes/ecoinventEmissionFactorDataSetupRoutes';
import componentMaster from './subRoutes/componentMasterRoutes';
import reports from './subRoutes/reportsRoutes';
import dashboard from './subRoutes/dashboardRoutes';
import notification from './subRoutes/notification.routes';



export function routes(app: any) {

    app.use(userRoutes);
    app.use(roleAndDeptRoutes);
    app.use(dataSetupRoutes);
    app.use(ownEmissionRoutes);
    app.use(documentMasterRoutes);
    app.use(bomRoutes);
    app.use(taskManagementRoutes);
    app.use(supplierInputQuestions);
    app.use(dqrRating);
    app.use(supplierDetails);
    app.use(product);
    app.use(imageRoutes);
    app.use(masterDatasetup);
    app.use(ecoinventEmissionFactorDataSetup);
    app.use(componentMaster);
    app.use(reports);
    app.use(dashboard);
    app.use(notification);
    app.get('/health', (req: any, res: any) => {
        res.send('ok');
    });

}
