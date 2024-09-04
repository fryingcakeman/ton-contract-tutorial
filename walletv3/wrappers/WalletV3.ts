import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type WalletV3Config = {};

export function walletV3ConfigToCell(config: WalletV3Config): Cell {
    return beginCell().endCell();
}

export class WalletV3 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new WalletV3(address);
    }

    static createFromConfig(config: WalletV3Config, code: Cell, workchain = 0) {
        const data = walletV3ConfigToCell(config);
        const init = { code, data };
        return new WalletV3(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
