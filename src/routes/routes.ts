
import userRoutes from './subRoutes/userRoutes';
import roleAndDeptRoutes from './subRoutes/roleAndDepartmentRoutes';

export function routes(app: any) {
    ;
    app.use(userRoutes);
    app.use(roleAndDeptRoutes);
    app.get('/health', (req: any, res: any) => {
        res.send('ok');
    });

}
