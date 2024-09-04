import { toNano } from '@ton/core';
import { WalletV3 } from '../wrappers/WalletV3';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const walletV3 = provider.open(WalletV3.createFromConfig({}, await compile('WalletV3')));

    await walletV3.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(walletV3.address);

    // run methods on `walletV3`
}
