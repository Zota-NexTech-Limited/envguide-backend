
import userRoutes from './subRoutes/userRoutes';
import roleAndDeptRoutes from './subRoutes/roleAndDepartmentRoutes';
import dataSetupRoutes from './subRoutes/dataSetupRoutes';
import ownEmissionRoutes from './subRoutes/ownEmissionRoutes';
import documentMasterRoutes from './subRoutes/documentMasterRoutes';
import bomRoutes from './subRoutes/bomRoutes';
import taskManagementRoutes from './subRoutes/taskManagementRoutes';
import supplierInputQuestions from './subRoutes/supplierInputQuestionRoutes';

export function routes(app: any) {

    app.use(userRoutes);
    app.use(roleAndDeptRoutes);
    app.use(dataSetupRoutes);
    app.use(ownEmissionRoutes);
    app.use(documentMasterRoutes);
    app.use(bomRoutes);
    app.use(taskManagementRoutes);
    app.use(supplierInputQuestions);
    app.get('/health', (req: any, res: any) => {
        res.send('ok');
    });

}
