import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { WalletV3 } from '../wrappers/WalletV3';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('WalletV3', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('WalletV3');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let walletV3: SandboxContract<WalletV3>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        walletV3 = blockchain.openContract(WalletV3.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await walletV3.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: walletV3.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and walletV3 are ready to use
    });
});
