
import userRoutes from './subRoutes/userRoutes';
import roleAndDeptRoutes from './subRoutes/roleAndDepartmentRoutes';
import dataSetupRoutes from './subRoutes/dataSetupRoutes';

export function routes(app: any) {

    app.use(userRoutes);
    app.use(roleAndDeptRoutes);
    app.use(dataSetupRoutes);
    app.get('/health', (req: any, res: any) => {
        res.send('ok');
    });

}
