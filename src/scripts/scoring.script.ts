import { BaseScript } from '@kifly/beagle/core/application/base-script';
import { inject } from '@kifly/beagle/core/container/decorators/inject';
import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { ScoringService } from '../services/scoring/scoring.service';

@injectable()
export class ScoringScript extends BaseScript {
    @inject()
    public scoringService: ScoringService;

    public async run() {
        const logs = await this.scoringService.repository.findMany();

        for (const log of logs) {
            console.log('Process log ->', log._id);
            await this.scoringService.processLog(log);

            await log.delete();
        }
    }
}
