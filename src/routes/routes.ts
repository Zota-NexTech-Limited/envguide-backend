
import userRoutes from './subRoutes/userRoutes';
import roleAndDeptRoutes from './subRoutes/roleAndDepartmentRoutes';
import dataSetupRoutes from './subRoutes/dataSetupRoutes';
import ownEmissionRoutes from './subRoutes/ownEmissionRoutes';
import documentMasterRoutes from './subRoutes/documentMasterRoutes';

export function routes(app: any) {

    app.use(userRoutes);
    app.use(roleAndDeptRoutes);
    app.use(dataSetupRoutes);
    app.use(ownEmissionRoutes);
    app.use(documentMasterRoutes);
    app.get('/health', (req: any, res: any) => {
        res.send('ok');
    });

}
