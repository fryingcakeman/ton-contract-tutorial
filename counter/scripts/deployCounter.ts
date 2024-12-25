import { toNano } from '@ton/core';
import { Counter } from '../wrappers/Counter';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const id = Math.floor(Math.random() * 10000);
    const counter = provider.open(Counter.createFromConfig({id, counter: 0}, await compile('Counter')));
    await counter.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(counter.address);
    console.log("Contract id ", await counter.getId());
}
