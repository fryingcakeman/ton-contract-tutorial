import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { WalletV2 } from '../wrappers/WalletV2';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('WalletV2', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('WalletV2');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let walletV2: SandboxContract<WalletV2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        walletV2 = blockchain.openContract(WalletV2.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await walletV2.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: walletV2.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and walletV2 are ready to use
    });
});
