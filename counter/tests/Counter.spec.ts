import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Counter } from '../wrappers/Counter';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Counter', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Counter');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let counter: SandboxContract<Counter>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        counter = blockchain.openContract(Counter.createFromConfig({counter: 0, id: 0}, code));
        deployer = await blockchain.treasury('deployer');
        const deployResult = await counter.sendDeploy(deployer.getSender(), toNano('0.05'));
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: counter.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and counter are ready to use
    });


    it("shoule handle the 'increment' message and update counter in the storage", async() => {
        const counterBefore = await counter.getCounter();
        const sendResult = await counter.sendIncrement(deployer.getSender(), toNano('0.05'));
        expect(sendResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: counter.address,
            success: true
        });

        const counterAfter = await counter.getCounter();
        expect(counterAfter).toBe(counterBefore + 1);
    })
});
