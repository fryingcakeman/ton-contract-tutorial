import { toNano } from '@ton/core';
import { WalletV2 } from '../wrappers/WalletV2';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const walletV2 = provider.open(WalletV2.createFromConfig({}, await compile('WalletV2')));

    await walletV2.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(walletV2.address);

    // run methods on `walletV2`
}
