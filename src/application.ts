import { BaseApplication, Provider, Script } from '@kifly/beagle/core/application/base-application';
import { appConfigurator } from '@kifly/beagle/core/application/decorators/app-configurator';
import { appInitializer } from '@kifly/beagle/core/application/decorators/app-initializer';
import { Controller } from '@kifly/beagle/modules/express/injectables/controller';
import * as Sentry from '@sentry/node';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import { createServer } from 'http';
import * as packageJson from '../package.json';
import { AdminController } from './controllers/admin.controller';
import { CustomerController } from './controllers/customer-controller';
import { InternalController } from './controllers/internal.controller';
import { PublicController } from './controllers/public-controller';
import { VendorController } from './controllers/vendor.controller';
import { providers } from './providers';
import { scripts } from './scripts';

export class Application extends BaseApplication {
    public sentry = this.config.environment?.sentry;
    public serverPort = this.config.environment?.port || 3032;
    public internalServerPort = this.config.environment?.internalPort || 3033;

    protected scripts: Script[] = scripts(this.config);
    protected providers: Provider[] = providers(this.config);

    @appInitializer('*')
    private initializeSentry() {
        if (!this.sentry) {
            return;
        }

        Sentry.init(this.sentry);
        Sentry.setTag('version', packageJson.version);
        Sentry.setTag('mode', this.config.mode);
        Sentry.setExtra('package', packageJson);
        Sentry.setExtra('config', this.config);
        Sentry.captureMessage('App is running');
    }

    @appInitializer('default')
    private defaultNotice() {
        console.log('There is no executable code. Check scripts section at package.json file');
    }

    @appConfigurator('api')
    private async initializeServer() {
        const app = express();
        const server = createServer(app);

        app.use(cors({ origin: (o, cb) => cb(null, true) }));
        app.use(bodyParser.json());

        app.use('/a', this.container.resolve<AdminController>(AdminController).app);
        app.use('/v', this.container.resolve<VendorController>(VendorController).app);
        app.use('/p', this.container.resolve<PublicController>(PublicController).app);
        app.use('/c', this.container.resolve<CustomerController>(CustomerController).app);
        app.use(Controller.handleError());

        server.listen(this.serverPort, () => console.log(`Server is listening on port ${this.serverPort}`));
    }

    @appConfigurator('api')
    private async initializeInternalServer() {
        const app = express();
        const server = createServer(app);

        app.use(cors({ origin: (o, cb) => cb(null, true) }));
        app.use(bodyParser.json());
        app.use(this.container.resolve<InternalController>(InternalController).app);
        app.use(Controller.handleError());

        server.listen(this.internalServerPort, () => console.log(`InternalServer is listening on port ${this.internalServerPort}`));
    }
}
