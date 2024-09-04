import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type WalletV2Config = {};

export function walletV2ConfigToCell(config: WalletV2Config): Cell {
    return beginCell().endCell();
}

export class WalletV2 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new WalletV2(address);
    }

    static createFromConfig(config: WalletV2Config, code: Cell, workchain = 0) {
        const data = walletV2ConfigToCell(config);
        const init = { code, data };
        return new WalletV2(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
